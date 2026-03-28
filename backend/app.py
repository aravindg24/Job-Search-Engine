"""
Direct FastAPI backend — multi-user with Supabase Auth.
Run: uvicorn app:app --reload
"""
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
)
from search.vector_store import create_collection, count, search as vector_search
from search.pipeline import run_search, run_explain
from search.gaps import analyze_gaps
from search.embedder import embed, warmup as warmup_embedder
from search.reranker import rerank
from resume.parser import extract_text
from resume.profiler import parse_profile, build_search_context
from pitch.generator import generate_pitch
from database import (
    save_resume_profile, get_resume_profile,
    upsert_tracked_job, get_tracked_jobs, delete_tracked_job,
    save_watch_preferences, get_watch_preferences, update_watch_last_checked,
    save_search, send_invite,
)

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
    try:
        create_collection()
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
async def health():
    return {"status": "ok", "jobs_indexed": count()}


# ── Search ─────────────────────────────────────────────────────────────────────

@app.post("/api/search", response_model=SearchResponse)
async def search(req: SearchRequest, user_id: str = Depends(get_current_user)):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    enriched_query = req.query
    profile_row = get_resume_profile(user_id)
    resume_profile = None
    if profile_row:
        resume_profile = profile_row.get("parsed_profile", {})
        context = build_search_context(resume_profile)
        enriched_query = f"{context}\n\nLooking for: {req.query}"

    results = run_search(
        query=enriched_query,
        top_k=req.top_k,
        filters=req.filters,
        resume_profile=resume_profile,
    )

    search_record = None
    try:
        top_score = results[0].match_score if results else None
        search_record = save_search(req.query, len(results), top_score, user_id)
    except Exception as e:
        logger.warning(f"Could not save search history: {e}")

    return SearchResponse(
        results=results,
        total=len(results),
        query=req.query,
        search_id=search_record.get("id") if search_record else None,
    )


# ── Explain ────────────────────────────────────────────────────────────────────

@app.post("/api/explain", response_model=ExplainResponse)
async def explain(req: ExplainRequest, user_id: str = Depends(get_current_user)):
    result = run_explain(query=req.query, job_id=req.job_id)
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
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10 MB.")

    try:
        raw_text = extract_text(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not raw_text or len(raw_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract text from PDF. Make sure it is not a scanned image.")

    parsed = parse_profile(raw_text)

    # Check if replacing an existing profile (re-upload) or creating a new one
    existing = get_resume_profile(user_id)
    is_reupload = existing is not None

    try:
        row = save_resume_profile(raw_text, parsed, user_id)
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
async def get_profile(user_id: str = Depends(get_current_user)):
    row = get_resume_profile(user_id)
    if not row:
        raise HTTPException(status_code=404, detail="No resume profile found. Please upload a resume.")
    return {"id": row.get("id"), "parsed_profile": row.get("parsed_profile"), "uploaded_at": row.get("uploaded_at")}


# ── Pitch ──────────────────────────────────────────────────────────────────────

@app.post("/api/pitch", response_model=PitchResponse)
async def pitch(req: PitchRequest, user_id: str = Depends(get_current_user)):
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
    result = generate_pitch(resume_profile, job, req.pitch_type)

    return PitchResponse(
        pitch=result.get("pitch", ""),
        key_mappings=result.get("key_mappings", []),
        framing_advice=result.get("framing_advice", ""),
        pitch_type=req.pitch_type,
    )


# ── Gap Analysis ───────────────────────────────────────────────────────────────

@app.get("/api/gaps", response_model=GapAnalysisResponse)
async def gaps(search_id: int = Query(None), user_id: str = Depends(get_current_user)):
    profile_row = get_resume_profile(user_id)
    resume_profile = profile_row.get("parsed_profile", {}) if profile_row else None

    query_text = build_search_context(resume_profile) if resume_profile else "software engineer developer"
    query_vec = embed(query_text)
    raw_results = vector_search(query_vec, top_k=15)
    result = analyze_gaps(raw_results, resume_profile)
    return GapAnalysisResponse(**result)


# ── Application Tracker ────────────────────────────────────────────────────────

@app.post("/api/track")
async def track_job(req: TrackRequest, user_id: str = Depends(get_current_user)):
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
async def get_tracker(user_id: str = Depends(get_current_user)):
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
async def remove_tracked_job(job_id: str, user_id: str = Depends(get_current_user)):
    deleted = delete_tracked_job(job_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found in tracker.")
    return {"message": "Job removed from tracker."}


# ── Watch / Digest ─────────────────────────────────────────────────────────────

@app.get("/api/watch")
async def get_watch(user_id: str = Depends(get_current_user)):
    prefs = get_watch_preferences(user_id)
    if not prefs:
        return {"min_match_score": 70, "keywords": [], "locations": [], "company_stages": []}
    return {
        "min_match_score": prefs.get("min_match_score", 70),
        "keywords": prefs.get("keywords", []),
        "locations": prefs.get("locations", []),
        "company_stages": prefs.get("company_stages", []),
    }


@app.post("/api/watch")
async def set_watch(req: WatchRequest, user_id: str = Depends(get_current_user)):
    try:
        row = save_watch_preferences(
            user_id=user_id,
            min_match_score=req.min_match_score,
            keywords=req.keywords,
            locations=req.locations,
            company_stages=req.company_stages,
        )
    except Exception as e:
        logger.error(f"Failed to save watch preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to save watch preferences.")
    return {"message": "Watch preferences saved.", "preferences": row}


@app.get("/api/digest", response_model=DigestResponse)
async def get_digest(user_id: str = Depends(get_current_user)):
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
    raw_results = vector_search(query_vec, top_k=20)
    reranked = rerank(query_text, raw_results, resume_profile=resume_profile)

    digest_jobs = []
    for item in reranked:
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
        digest_jobs.append(DigestJob(
            id=item.get("id", ""),
            title=payload.get("title", ""),
            company=payload.get("company", ""),
            match_score=score,
            match_reason=item.get("match_reason", ""),
            posted_date=payload.get("posted_date"),
            source=payload.get("source", ""),
        ))

    try:
        update_watch_last_checked(user_id)
    except Exception:
        pass

    return DigestResponse(since=last_checked, new_matches=len(digest_jobs), jobs=digest_jobs[:10])


@app.post("/api/digest/refresh")
async def refresh_digest(user_id: str = Depends(get_current_user)):
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
async def invite_user(req: InviteRequest, user_id: str = Depends(get_current_user)):
    try:
        send_invite(req.email)
        return {"message": f"Invitation sent to {req.email}."}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Invite failed for {req.email}: {e}")
        raise HTTPException(status_code=500, detail="Failed to send invitation.")
