"""
Supabase client and CRUD helpers — all operations scoped to user_id.
"""
from supabase import create_client, Client
from config import settings
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

_client: Optional[Client] = None
_admin_client: Optional[Client] = None


def get_db() -> Client:
    """Return a DB client using the anon key. Used for all standard DB + auth operations."""
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_key)
    return _client


def get_admin_db() -> Client:
    """Admin client using service_role key — required for invite_user_by_email."""
    global _admin_client
    if _admin_client is None:
        if not settings.supabase_service_key:
            raise RuntimeError("SUPABASE_SERVICE_KEY is not set — cannot send invites.")
        _admin_client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _admin_client


def send_invite(email: str) -> None:
    """Invite a user by email via Supabase admin API."""
    get_admin_db().auth.admin.invite_user_by_email(email)


# ── Resume Profile ─────────────────────────────────────────────────────────────

def save_resume_profile(raw_text: str, parsed_profile: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    db = get_db()
    result = db.table("resume_profiles").upsert({
        "raw_text": raw_text,
        "parsed_profile": parsed_profile,
        "user_id": user_id,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }, on_conflict="user_id").execute()
    return result.data[0] if result.data else {}


def get_resume_profile(user_id: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    result = (
        db.table("resume_profiles")
        .select("*")
        .eq("user_id", user_id)
        .order("uploaded_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


# ── Tracked Jobs ───────────────────────────────────────────────────────────────

def upsert_tracked_job(
    job_id: str,
    job_title: str,
    company: str,
    match_score: Optional[float],
    user_id: str,
    status: str = "saved",
    notes: Optional[str] = None,
    pitch: Optional[str] = None,
    applied_date: Optional[str] = None,
) -> Dict[str, Any]:
    db = get_db()
    # Strip user_id prefix if the frontend sends back the compound DB key.
    # When updating status the frontend passes job.job_id which already contains
    # the "{user_id}_" prefix — without this check we'd create a duplicate entry
    # with a double-prefixed key instead of updating the existing row.
    prefix = f"{user_id}_"
    raw_id = job_id[len(prefix):] if job_id.startswith(prefix) else job_id
    data: Dict[str, Any] = {
        "job_id": f"{user_id}_{raw_id}",   # unique per user
        "job_title": job_title,
        "company": company,
        "match_score": match_score,
        "status": status,
        "notes": notes,
        "pitch": pitch,
        "applied_date": applied_date,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
    }
    result = db.table("tracked_jobs").upsert(data, on_conflict="job_id").execute()
    return result.data[0] if result.data else {}


def get_tracked_jobs(user_id: str) -> List[Dict[str, Any]]:
    db = get_db()
    result = (
        db.table("tracked_jobs")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data or []


def delete_tracked_job(job_id: str, user_id: str) -> bool:
    db = get_db()
    prefix = f"{user_id}_"
    raw_id = job_id[len(prefix):] if job_id.startswith(prefix) else job_id
    result = (
        db.table("tracked_jobs")
        .delete()
        .eq("job_id", f"{user_id}_{raw_id}")
        .eq("user_id", user_id)
        .execute()
    )
    return bool(result.data)


# ── Watch Preferences ──────────────────────────────────────────────────────────

def save_watch_preferences(
    user_id: str,
    min_match_score: float = 70,
    keywords: Optional[List[str]] = None,
    locations: Optional[List[str]] = None,
    company_stages: Optional[List[str]] = None,
    target_companies: Optional[List[str]] = None,
) -> Dict[str, Any]:
    db = get_db()
    result = db.table("watch_preferences").upsert({
        "user_id": user_id,
        "min_match_score": min_match_score,
        "keywords": keywords or [],
        "locations": locations or [],
        "company_stages": company_stages or [],
        "target_companies": target_companies or [],
    }, on_conflict="user_id").execute()
    return result.data[0] if result.data else {}


def get_watch_preferences(user_id: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    result = (
        db.table("watch_preferences")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def update_watch_last_checked(user_id: str) -> None:
    db = get_db()
    db.table("watch_preferences").update(
        {"last_checked_at": datetime.now(timezone.utc).isoformat()}
    ).eq("user_id", user_id).execute()


# ── Saved Jobs ─────────────────────────────────────────────────────────────────

def save_job(user_id: str, job_id: str) -> Dict[str, Any]:
    """Save a job for a user. Returns the saved_job record."""
    db = get_db()
    result = db.table("saved_jobs").upsert({
        "user_id": user_id,
        "job_id": job_id,
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }, on_conflict="user_id,job_id").execute()
    return result.data[0] if result.data else {}


def unsave_job(user_id: str, job_id: str) -> bool:
    """Unsave a job for a user. Returns True if deleted."""
    db = get_db()
    result = db.table("saved_jobs").delete().eq("user_id", user_id).eq("job_id", job_id).execute()
    return bool(result.data)


def get_saved_jobs(user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Get all saved jobs for a user."""
    db = get_db()
    result = (
        db.table("saved_jobs")
        .select("*")
        .eq("user_id", user_id)
        .order("saved_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


def is_job_saved(user_id: str, job_id: str) -> bool:
    """Check if a job is saved by a user."""
    db = get_db()
    result = (
        db.table("saved_jobs")
        .select("id")
        .eq("user_id", user_id)
        .eq("job_id", job_id)
        .execute()
    )
    return bool(result.data)


# ── Search History ─────────────────────────────────────────────────────────────

def save_search(query: str, results_count: int, top_match_score: Optional[float], user_id: str) -> Dict[str, Any]:
    db = get_db()
    result = db.table("search_history").insert({
        "query": query,
        "results_count": results_count,
        "top_match_score": top_match_score,
        "user_id": user_id,
    }).execute()
    return result.data[0] if result.data else {}


# ── Ingest Run Metrics ──────────────────────────────────────────────────────────

def log_ingest_run(
    source_counts: Dict[str, Any],
    total_before_dedup: int,
    total_after_dedup: int,
    total_indexed: int,
    duration_seconds: float,
) -> None:
    """Write one row to ingest_runs after every indexer execution."""
    db = get_db()
    db.table("ingest_runs").insert({
        "source_counts": source_counts,
        "total_before_dedup": total_before_dedup,
        "total_after_dedup": total_after_dedup,
        "total_indexed": total_indexed,
        "duration_seconds": round(duration_seconds, 2),
    }).execute()


# ── Persistent Jobs ─────────────────────────────────────────────────────────────

def bulk_upsert_jobs(jobs: List[Dict[str, Any]], batch_size: int = 200) -> None:
    """
    Upsert jobs into the Supabase jobs table in batches.
    Uses source_url as the unique conflict key so re-scraping updates rather than duplicates.
    """
    db = get_db()
    rows = []
    for job in jobs:
        job_id = job.get("id", "")
        # Ensure valid UUID (source_url-based UUIDs already are, but guard anyway)
        try:
            import uuid as _uuid
            _uuid.UUID(job_id)
        except (ValueError, AttributeError):
            import uuid as _uuid
            job_id = str(_uuid.uuid5(_uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8"), job_id))

        rows.append({
            "id": job_id,
            "title": (job.get("title") or "")[:255],
            "company": (job.get("company") or "")[:255],
            "location": (job.get("location") or "")[:255],
            "remote": bool(job.get("remote", False)),
            "description": (job.get("description") or "")[:10000],
            "requirements": job.get("requirements") or [],
            "salary_range": job.get("salary_range"),
            "salary_min": job.get("salary_min"),
            "salary_max": job.get("salary_max"),
            "company_stage": job.get("company_stage"),
            "stream": job.get("stream"),
            "source": job.get("source"),
            "source_url": job.get("source_url") or job_id,
            "posted_date": job.get("posted_date"),
            "indexed_at": job.get("indexed_at"),
            "is_deleted": False,
        })

    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        db.table("jobs").upsert(batch, on_conflict="source_url").execute()


def get_search_history(user_id: str, limit: int = 5) -> List[str]:
    """
    Return the last `limit` unique queries for the user, newest first.
    Fetches more rows than needed then deduplicates in Python because
    PostgREST does not support DISTINCT ON via the query builder.
    """
    db = get_db()
    result = (
        db.table("search_history")
        .select("query, searched_at")
        .eq("user_id", user_id)
        .order("searched_at", desc=True)
        .limit(limit * 10)   # fetch extra to ensure we get `limit` unique ones
        .execute()
    )
    seen: list[str] = []
    for row in result.data or []:
        q = row.get("query", "").strip()
        if q and q.lower() not in [s.lower() for s in seen]:
            seen.append(q)
        if len(seen) >= limit:
            break
    return seen


# ── STAR Story Bank (F4) ───────────────────────────────────────────────────────

def create_story(
    user_id: str,
    situation: str,
    task: str,
    action: str,
    result: str,
    skills_demonstrated: List[str],
) -> Dict[str, Any]:
    db = get_db()
    row = db.table("stories").insert({
        "user_id": user_id,
        "situation": situation,
        "task": task,
        "action": action,
        "result": result,
        "skills_demonstrated": skills_demonstrated,
    }).execute()
    return row.data[0] if row.data else {}


def get_stories(user_id: str) -> List[Dict[str, Any]]:
    db = get_db()
    return (
        db.table("stories")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    ).data or []


def delete_story(story_id: int, user_id: str) -> bool:
    db = get_db()
    result = (
        db.table("stories")
        .delete()
        .eq("id", story_id)
        .eq("user_id", user_id)
        .execute()
    )
    return bool(result.data)
