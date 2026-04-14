"""
Direct FastAPI backend — multi-user with Supabase Auth.
Run: uvicorn app:app --reload
"""
import gc
import logging
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from collections import Counter

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Depends, Header
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import (
    SearchRequest, SearchResponse,
    ExplainRequest, ExplainResponse,
    ResumeProfileResponse,
    PitchRequest, PitchResponse,
    GapAnalysisResponse,
    TrackRequest, TrackerResponse, TrackerStats, TrackedJob,
    WatchRequest, DigestResponse, DigestJob,
    InviteRequest,
    JDExtractRequest, JDExtractResponse,
    StoryCreate, Story,
    SaveJobRequest,
)
from search.vector_store import create_collection, ensure_collection, count, search as vector_search
from search.pipeline import run_search, run_explain
from search.gaps import analyze_gaps
from search.embedder import embed, warmup as warmup_embedder
from search.reranker import rerank
from search.query_parser import parse_intent
from resume.parser import extract_text
from resume.profiler import parse_profile, build_search_context
from pitch.generator import generate_pitch
from database import (
    save_resume_profile, get_resume_profile,
    upsert_tracked_job, get_tracked_jobs, delete_tracked_job,
    save_watch_preferences, get_watch_preferences, update_watch_last_checked,
    save_search, get_search_history, send_invite,
    save_job, unsave_job, get_saved_jobs, is_job_saved,
    get_db,
    create_story, get_stories, delete_story,
)
from search.reranker import explain as reranker_explain
from jd_extractor import fetch_and_extract

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


# ── Auth ───────────────────────────────────────────────────────────────────────

def get_current_user(authorization: str = Header(None)) -> str:
    """Verify Supabase JWT via auth.get_user(), return user_id."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    token = authorization.split(" ", 1)[1]
    try:
        from database import get_db
        response = get_db().auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid token.")
        return response.user.id
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Auth failed: {e}")
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")


# ── Startup ────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Step 1: Pre-load the embedding model BEFORE accepting any requests.
    # Without this, the first concurrent burst (dashboard fires gaps + digest +
    # search simultaneously) triggers multiple parallel model loads on a cold
    # server, each consuming ~130 MB, which pushes past Render's 512 MB limit.
    # Loading it once here keeps peak RAM flat for all subsequent requests.
    try:
        logger.info("Pre-loading embedding model...")
        warmup_embedder()
        logger.info("Embedding model ready.")
    except Exception as e:
        logger.error(f"Model warmup failed (non-fatal): {e}")

    # Step 2: Verify Qdrant Cloud connection and collection.
    # Use ensure_collection (not create_collection) — we must never drop the
    # indexed jobs on a normal API server restart. create_collection is called
    # only by the indexer before it loads fresh data.
    try:
        ensure_collection()
        n = count()
        logger.info(f"Qdrant ready — {n} jobs indexed.")
    except Exception as e:
        logger.error(f"Qdrant startup warning (non-fatal): {e} — server will still start.")
    yield


app = FastAPI(title="Direct API", version="3.0.0", lifespan=lifespan)

_cors_origins = list({
    o.strip().rstrip("/")
    for o in settings.cors_origins.split(",")
    if o.strip()
} | {"http://localhost:5173", "https://job-search-engine-eta.vercel.app"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health (public) ────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    try:
        jobs_indexed = count()
    except Exception:
        jobs_indexed = None
    return {"status": "ok", "jobs_indexed": jobs_indexed}


# ── Search ─────────────────────────────────────────────────────────────────────

@app.post("/api/search", response_model=SearchResponse)
def search(req: SearchRequest, user_id: str = Depends(get_current_user)):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # ── Parse intent from natural language query ──────────────────────────────
    # Extracts clean role query, location, and remote preference so that
    # "I want to see AI engineer roles in Arizona" is handled correctly:
    # clean_query="AI engineer", location="Arizona" applied as a post-filter.
    intent = parse_intent(req.query)
    clean_query = intent.get("clean_query") or req.query

    # Merge parsed intent into filters (explicit request filters take priority)
    from models import SearchFilters
    base_filters = req.filters or SearchFilters()
    if intent.get("location") and not base_filters.location:
        base_filters = base_filters.model_copy(update={"location": intent["location"]})
    if intent.get("remote") is not None and base_filters.remote is None:
        base_filters = base_filters.model_copy(update={"remote": intent["remote"]})
    active_filters = base_filters if (base_filters.remote is not None or base_filters.stream or base_filters.location) else req.filters

    logger.info(f"Search intent — clean_query='{clean_query}' location='{intent.get('location')}' remote={intent.get('remote')}")

    # ── Enrich query with resume profile context ───────────────────────────────
    profile_row = get_resume_profile(user_id)
    resume_profile = None
    enriched_query = clean_query
    if profile_row:
        resume_profile = profile_row.get("parsed_profile", {})
        context = build_search_context(resume_profile)
        enriched_query = f"{context}\n\nLooking for: {clean_query}"

    all_results = run_search(
        query=enriched_query,
        top_k=req.top_k,
        offset=req.offset,
        filters=active_filters,
        resume_profile=resume_profile,
        clean_query=clean_query,
    )

    # Apply pagination to all results
    total_available = len(all_results)
    paginated_results = all_results[req.offset:req.offset + req.top_k]

    search_record = None
    try:
        top_score = paginated_results[0].match_score if paginated_results else None
        search_record = save_search(req.query, total_available, top_score, user_id)
    except Exception as e:
        logger.warning(f"Could not save search history: {e}")

    response = SearchResponse(
        results=paginated_results,
        total=total_available,
        query=req.query,
        search_id=search_record.get("id") if search_record else None,
    )
    # Free the large results list (job payloads + vectors) before returning.
    del results
    gc.collect()
    return response


# ── Search History ─────────────────────────────────────────────────────────────

@app.get("/api/search/history")
def search_history(user_id: str = Depends(get_current_user)):
    """Return the last 5 unique search queries for the user."""
    try:
        queries = get_search_history(user_id, limit=5)
        return {"queries": queries}
    except Exception as e:
        logger.warning(f"Could not fetch search history: {e}")
        return {"queries": []}


# ── Explain ────────────────────────────────────────────────────────────────────

@app.post("/api/explain", response_model=ExplainResponse)
def explain(req: ExplainRequest, user_id: str = Depends(get_current_user)):
    profile_row = get_resume_profile(user_id)
    resume_profile = profile_row.get("parsed_profile") if profile_row else None
    result = run_explain(query=req.query, job_id=req.job_id, resume_profile=resume_profile)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Job {req.job_id} not found.")
    return ExplainResponse(
        match_score=result.get("match_score", 70),
        strengths=result.get("strengths", []),
        gaps=result.get("gaps", []),
        suggestion=result.get("suggestion", ""),
    )


# ── Resume ─────────────────────────────────────────────────────────────────────

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    import asyncio

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10 MB.")

    try:
        raw_text = await asyncio.to_thread(extract_text, pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not raw_text or len(raw_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract text from PDF. Make sure it is not a scanned image.")

    parsed = await asyncio.to_thread(parse_profile, raw_text)

    # Check if replacing an existing profile (re-upload) or creating a new one
    existing = await asyncio.to_thread(get_resume_profile, user_id)
    is_reupload = existing is not None

    try:
        row = await asyncio.to_thread(save_resume_profile, raw_text, parsed, user_id)
    except Exception as e:
        logger.error(f"Failed to save resume to Supabase: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save resume. Please ensure RLS is disabled on resume_profiles in Supabase."
        )

    action = "updated" if is_reupload else "uploaded"
    return {
        "message": f"Resume {action} successfully.",
        "profile": parsed,
        "id": row.get("id"),
        "is_reupload": is_reupload,
    }


@app.get("/api/resume/profile")
def get_profile(user_id: str = Depends(get_current_user)):
    row = get_resume_profile(user_id)
    if not row:
        raise HTTPException(status_code=404, detail="No resume profile found. Please upload a resume.")
    return {"id": row.get("id"), "parsed_profile": row.get("parsed_profile"), "uploaded_at": row.get("uploaded_at")}


# ── Pitch ──────────────────────────────────────────────────────────────────────

@app.post("/api/pitch", response_model=PitchResponse)
def pitch(req: PitchRequest, user_id: str = Depends(get_current_user)):
    valid_types = {"cover_letter_hook", "cold_email", "why_interested"}
    if req.pitch_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"pitch_type must be one of {valid_types}")

    from search.vector_store import get_client, _to_uuid
    client = get_client()
    results = client.retrieve(
        collection_name=settings.qdrant_collection,
        ids=[_to_uuid(req.job_id)],
        with_payload=True,
    )
    if not results:
        raise HTTPException(status_code=404, detail=f"Job {req.job_id} not found.")

    job = results[0].payload
    profile_row = get_resume_profile(user_id)
    resume_profile = profile_row.get("parsed_profile", {}) if profile_row else {}

    # F6: score threshold guard — warn if match_score < 40
    warning = None
    try:
        tracked = (
            get_db()
            .table("tracked_jobs")
            .select("match_score")
            .eq("job_id", f"{user_id}_{req.job_id}")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if tracked.data:
            ms = tracked.data[0].get("match_score")
            if ms is not None and ms < 40:
                warning = (
                    f"Your match score for this role is {ms:.0f}/100. "
                    "Consider addressing the gaps before pitching."
                )
    except Exception:
        pass

    # F4: inject STAR stories into pitch
    stories = []
    try:
        stories = get_stories(user_id)
    except Exception:
        pass

    result = generate_pitch(resume_profile, job, req.pitch_type, stories=stories)

    return PitchResponse(
        pitch=result.get("pitch", ""),
        key_mappings=result.get("key_mappings", []),
        framing_advice=result.get("framing_advice", ""),
        pitch_type=req.pitch_type,
        warning=warning,
    )


# ── Gap Analysis ───────────────────────────────────────────────────────────────

@app.get("/api/gaps", response_model=GapAnalysisResponse)
def gaps(search_id: int = Query(None), user_id: str = Depends(get_current_user)):
    profile_row = get_resume_profile(user_id)
    resume_profile = profile_row.get("parsed_profile", {}) if profile_row else None

    query_text = build_search_context(resume_profile) if resume_profile else "software engineer developer"
    query_vec = embed(query_text)
    # top_k capped at 8 (was 15) — keeps job payload memory low when this
    # endpoint runs concurrently with search and digest on the dashboard.
    raw_results = vector_search(query_vec, top_k=8)
    result = analyze_gaps(raw_results, resume_profile)
    return GapAnalysisResponse(**result)


# ── Application Tracker ────────────────────────────────────────────────────────

@app.post("/api/track")
def track_job(req: TrackRequest, user_id: str = Depends(get_current_user)):
    try:
        row = upsert_tracked_job(
            job_id=req.job_id,
            job_title=req.job_title,
            company=req.company,
            match_score=req.match_score,
            user_id=user_id,
            status=req.status,
            notes=req.notes,
            pitch=req.pitch,
            applied_date=req.applied_date,
        )
    except Exception as e:
        logger.error(f"Failed to track job: {e}")
        raise HTTPException(status_code=500, detail="Failed to save tracked job.")
    return {"message": "Job tracked successfully.", "job": row}


@app.get("/api/track", response_model=TrackerResponse)
def get_tracker(user_id: str = Depends(get_current_user)):
    try:
        jobs = get_tracked_jobs(user_id)
    except Exception as e:
        logger.error(f"Failed to fetch tracked jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tracked jobs.")

    status_counts: Counter = Counter(j.get("status", "saved") for j in jobs)
    stats = TrackerStats(
        saved=status_counts.get("saved", 0),
        applied=status_counts.get("applied", 0),
        interviewing=status_counts.get("interviewing", 0),
        offered=status_counts.get("offered", 0),
        rejected=status_counts.get("rejected", 0),
        withdrawn=status_counts.get("withdrawn", 0),
    )
    tracked = [
        TrackedJob(
            job_id=j.get("job_id", ""),
            job_title=j.get("job_title"),
            company=j.get("company"),
            status=j.get("status", "saved"),
            match_score=j.get("match_score"),
            notes=j.get("notes"),
            pitch=j.get("pitch"),
            applied_date=j.get("applied_date"),
            created_at=j.get("created_at"),
            updated_at=j.get("updated_at"),
        )
        for j in jobs
    ]
    return TrackerResponse(stats=stats, jobs=tracked)


@app.delete("/api/track/{job_id}")
def remove_tracked_job(job_id: str, user_id: str = Depends(get_current_user)):
    deleted = delete_tracked_job(job_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found in tracker.")
    return {"message": "Job removed from tracker."}


# ── Saved Jobs ─────────────────────────────────────────────────────────────────

@app.post("/api/jobs/{job_id}/save")
def save_job_endpoint(job_id: str, user_id: str = Depends(get_current_user)):
    """Save a job for later review."""
    try:
        row = save_job(user_id, job_id)
        return {"message": "Job saved successfully.", "job_id": job_id}
    except Exception as e:
        logger.error(f"Failed to save job: {e}")
        raise HTTPException(status_code=500, detail="Failed to save job.")


@app.delete("/api/jobs/{job_id}/unsave")
def unsave_job_endpoint(job_id: str, user_id: str = Depends(get_current_user)):
    """Unsave a job."""
    try:
        deleted = unsave_job(user_id, job_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Job not found in saved jobs.")
        return {"message": "Job removed from saved jobs."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to unsave job: {e}")
        raise HTTPException(status_code=500, detail="Failed to unsave job.")


@app.get("/api/saved-jobs")
def get_saved_jobs_endpoint(user_id: str = Depends(get_current_user)):
    """Get all saved jobs for the user."""
    try:
        saved = get_saved_jobs(user_id)
        return {"jobs": saved, "count": len(saved)}
    except Exception as e:
        logger.error(f"Failed to fetch saved jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch saved jobs.")


# ── Watch / Digest ─────────────────────────────────────────────────────────────

@app.get("/api/watch")
def get_watch(user_id: str = Depends(get_current_user)):
    prefs = get_watch_preferences(user_id)
    if not prefs:
        return {"min_match_score": 70, "keywords": [], "locations": [], "company_stages": [], "target_companies": []}
    return {
        "min_match_score": prefs.get("min_match_score", 70),
        "keywords": prefs.get("keywords", []),
        "locations": prefs.get("locations", []),
        "company_stages": prefs.get("company_stages", []),
        "target_companies": prefs.get("target_companies", []),
    }


@app.post("/api/watch")
def set_watch(req: WatchRequest, user_id: str = Depends(get_current_user)):
    try:
        row = save_watch_preferences(
            user_id=user_id,
            min_match_score=req.min_match_score,
            keywords=req.keywords,
            locations=req.locations,
            company_stages=req.company_stages,
            target_companies=req.target_companies,
        )
    except Exception as e:
        logger.error(f"Failed to save watch preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to save watch preferences.")
    return {"message": "Watch preferences saved.", "preferences": row}


@app.get("/api/digest", response_model=DigestResponse)
def get_digest(user_id: str = Depends(get_current_user)):
    prefs = get_watch_preferences(user_id)
    min_score = prefs.get("min_match_score", 70) if prefs else 70
    last_checked = prefs.get("last_checked_at") if prefs else None

    profile_row = get_resume_profile(user_id)
    resume_profile = profile_row.get("parsed_profile", {}) if profile_row else None

    if resume_profile:
        query_text = build_search_context(resume_profile)
        if prefs and prefs.get("keywords"):
            query_text += " " + " ".join(prefs["keywords"])
    else:
        keywords = prefs.get("keywords", []) if prefs else []
        query_text = " ".join(keywords) if keywords else "software engineer"

    query_vec = embed(query_text)
    # Fetch 20 candidates for intelligent digest matching (newly indexed vs top-scoring)
    raw_results = vector_search(query_vec, top_k=20)

    # Use vector similarity scores directly (skip rerank to avoid concurrent
    # LLM + PyTorch memory pressure with the search endpoint).
    digest_jobs = []
    for item in raw_results:
        item["match_score"] = round(item.get("score", 0) * 100)
        item["match_reason"] = "Strong semantic match based on your profile."
    target_companies = []
    if prefs:
        target_companies = [tc.lower() for tc in prefs.get("target_companies", []) if tc]

    # Convert last_checked to datetime for comparison (if it exists)
    from datetime import datetime
    last_checked_dt = None
    if last_checked:
        try:
            last_checked_dt = datetime.fromisoformat(last_checked.replace('Z', '+00:00'))
        except Exception:
            pass

    # Build list with metadata: (job, is_newly_indexed)
    jobs_with_metadata = []

    for item in raw_results:
        score = item.get("match_score", 0) or 0
        if score < min_score:
            continue
        payload = item.get("payload", {})
        if prefs:
            locations = prefs.get("locations", [])
            stages = prefs.get("company_stages", [])
            job_loc = payload.get("location", "")
            job_stage = payload.get("company_stage", "")
            if locations and not any(loc.lower() in job_loc.lower() for loc in locations):
                if not payload.get("remote", False):
                    continue
            if stages and job_stage and job_stage not in stages:
                continue

        # F7: boost score +5 for target company matches
        match_reason = item.get("match_reason", "")
        job_company = (payload.get("company") or "").lower()
        if target_companies and any(tc in job_company for tc in target_companies):
            score = min(score + 5, 100)
            match_reason = f"Target company match. {match_reason}".strip()

        job_id = item.get("id", "")
        job_is_saved = is_job_saved(user_id, job_id)

        # Check if job is newly indexed (indexed_at > last_checked_at)
        is_newly_indexed = False
        indexed_at_str = payload.get("indexed_at")
        if indexed_at_str and last_checked_dt:
            try:
                indexed_at = datetime.fromisoformat(indexed_at_str.replace('Z', '+00:00'))
                is_newly_indexed = indexed_at > last_checked_dt
            except Exception:
                pass

        job = DigestJob(
            id=job_id,
            title=payload.get("title", ""),
            company=payload.get("company", ""),
            match_score=score,
            match_reason=match_reason,
            posted_date=payload.get("posted_date"),
            source=payload.get("source", ""),
            job_is_saved=job_is_saved,
        )
        jobs_with_metadata.append((job, is_newly_indexed))

    # Sort: newly indexed first, then by score descending
    jobs_with_metadata.sort(
        key=lambda x: (not x[1], -x[0].match_score)  # newly_indexed=True sorts first, then by score
    )

    # Count newly indexed jobs and build final list
    digest_jobs = [job for job, _ in jobs_with_metadata]
    newly_indexed_count = sum(1 for _, is_new in jobs_with_metadata if is_new)

    try:
        update_watch_last_checked(user_id)
    except Exception:
        pass

    return DigestResponse(
        since=last_checked,
        new_matches=len(digest_jobs),
        jobs=digest_jobs[:10],
        newly_indexed_count=newly_indexed_count if newly_indexed_count <= 10 else min(newly_indexed_count, 10)
    )


@app.post("/api/digest/refresh")
def refresh_digest(user_id: str = Depends(get_current_user)):
    # Full re-indexing is too memory-intensive to run inside the API server on
    # Render's free tier (512 MB). The job index is refreshed by running
    # `python indexer.py` separately (locally or via GitHub Actions CI).
    try:
        n = count()
        return {"message": "Job index is up to date.", "jobs_indexed": n}
    except Exception as e:
        logger.error(f"Count failed: {e}")
        raise HTTPException(status_code=500, detail="Could not reach job index.")


# ── Invite ──────────────────────────────────────────────────────────────────────

@app.post("/api/invite")
def invite_user(req: InviteRequest, user_id: str = Depends(get_current_user)):
    try:
        send_invite(req.email)
        return {"message": f"Invitation sent to {req.email}."}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Invite failed for {req.email}: {e}")
        raise HTTPException(status_code=500, detail="Failed to send invitation.")


# ── JD Extraction from URL (F2) ────────────────────────────────────────────────

@app.post("/api/jd/extract", response_model=JDExtractResponse)
def extract_jd(req: JDExtractRequest, user_id: str = Depends(get_current_user)):
    try:
        job = fetch_and_extract(req.url)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"JD extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract job from URL.")

    profile_row = get_resume_profile(user_id)
    resume_profile = profile_row.get("parsed_profile", {}) if profile_row else {}

    explain_result = None
    if resume_profile:
        try:
            query = req.query or f"{job.get('title', '')} at {job.get('company', '')}"
            explain_result = reranker_explain(query, job, resume_profile=resume_profile)
        except Exception as e:
            logger.warning(f"Explain failed during JD extraction: {e}")

    return JDExtractResponse(
        job_text=job.get("description", ""),
        title=job.get("title", ""),
        company=job.get("company", ""),
        location=job.get("location", ""),
        remote=job.get("remote", False),
        match_score=explain_result.get("match_score") if explain_result else None,
        pitch_suggestion=explain_result.get("suggestion") if explain_result else None,
    )


# ── STAR Story Bank (F4) ───────────────────────────────────────────────────────

@app.post("/api/stories", response_model=Story)
def add_story(req: StoryCreate, user_id: str = Depends(get_current_user)):
    row = create_story(
        user_id=user_id,
        situation=req.situation,
        task=req.task,
        action=req.action,
        result=req.result,
        skills_demonstrated=req.skills_demonstrated,
    )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to save story.")
    return Story(**row)


@app.get("/api/stories", response_model=list[Story])
def list_stories(user_id: str = Depends(get_current_user)):
    rows = get_stories(user_id)
    return [Story(**r) for r in rows]


@app.delete("/api/stories/{story_id}")
def remove_story(story_id: int, user_id: str = Depends(get_current_user)):
    deleted = delete_story(story_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Story not found.")
    return {"message": "Story deleted."}
