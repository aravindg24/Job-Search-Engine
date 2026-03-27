"""
Supabase client and CRUD helpers — all operations scoped to user_id.
"""
from supabase import create_client, Client
from config import settings
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)

_client: Optional[Client] = None
_admin_client: Optional[Client] = None


def get_db() -> Client:
    """Return a DB client. Uses service_role key (bypasses RLS) if available, else anon key."""
    global _client
    if _client is None:
        key = settings.supabase_service_key or settings.supabase_key
        _client = create_client(settings.supabase_url, key)
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
    # Keep only latest profile per user
    db.table("resume_profiles").delete().eq("user_id", user_id).execute()
    result = db.table("resume_profiles").insert({
        "raw_text": raw_text,
        "parsed_profile": parsed_profile,
        "user_id": user_id,
    }).execute()
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
    data: Dict[str, Any] = {
        "job_id": f"{user_id}_{job_id}",   # unique per user
        "job_title": job_title,
        "company": company,
        "match_score": match_score,
        "status": status,
        "notes": notes,
        "pitch": pitch,
        "applied_date": applied_date,
        "updated_at": "now()",
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
    result = (
        db.table("tracked_jobs")
        .delete()
        .eq("job_id", f"{user_id}_{job_id}")
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
) -> Dict[str, Any]:
    db = get_db()
    db.table("watch_preferences").delete().eq("user_id", user_id).execute()
    result = db.table("watch_preferences").insert({
        "user_id": user_id,
        "min_match_score": min_match_score,
        "keywords": keywords or [],
        "locations": locations or [],
        "company_stages": company_stages or [],
    }).execute()
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
    db.table("watch_preferences").update({"last_checked_at": "now()"}).eq("user_id", user_id).execute()


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
