"""
Supabase client and CRUD helpers for all user-state tables.

Tables (create these in your Supabase SQL editor):

  CREATE TABLE resume_profiles (
      id SERIAL PRIMARY KEY,
      raw_text TEXT NOT NULL,
      parsed_profile JSONB NOT NULL,
      uploaded_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE tracked_jobs (
      id SERIAL PRIMARY KEY,
      job_id TEXT NOT NULL UNIQUE,
      job_title TEXT,
      company TEXT,
      match_score REAL,
      status TEXT DEFAULT 'saved',
      notes TEXT,
      pitch TEXT,
      applied_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE watch_preferences (
      id SERIAL PRIMARY KEY,
      min_match_score REAL DEFAULT 70,
      keywords JSONB DEFAULT '[]',
      locations JSONB DEFAULT '[]',
      company_stages JSONB DEFAULT '[]',
      last_checked_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE search_history (
      id SERIAL PRIMARY KEY,
      query TEXT NOT NULL,
      results_count INTEGER,
      top_match_score REAL,
      created_at TIMESTAMPTZ DEFAULT NOW()
  );
"""
from supabase import create_client, Client
from config import settings
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_db() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_key)
    return _client


# ── Resume Profile ─────────────────────────────────────────────────────────────

def save_resume_profile(raw_text: str, parsed_profile: Dict[str, Any]) -> Dict[str, Any]:
    db = get_db()
    # Always keep only the latest profile — delete old ones first
    db.table("resume_profiles").delete().neq("id", 0).execute()
    result = db.table("resume_profiles").insert({
        "raw_text": raw_text,
        "parsed_profile": parsed_profile,
    }).execute()
    return result.data[0] if result.data else {}


def get_resume_profile() -> Optional[Dict[str, Any]]:
    db = get_db()
    result = db.table("resume_profiles").select("*").order("uploaded_at", desc=True).limit(1).execute()
    if result.data:
        return result.data[0]
    return None


# ── Tracked Jobs ───────────────────────────────────────────────────────────────

def upsert_tracked_job(
    job_id: str,
    job_title: str,
    company: str,
    match_score: Optional[float],
    status: str = "saved",
    notes: Optional[str] = None,
    pitch: Optional[str] = None,
    applied_date: Optional[str] = None,
) -> Dict[str, Any]:
    db = get_db()
    data: Dict[str, Any] = {
        "job_id": job_id,
        "job_title": job_title,
        "company": company,
        "match_score": match_score,
        "status": status,
        "notes": notes,
        "pitch": pitch,
        "applied_date": applied_date,
        "updated_at": "now()",
    }
    result = db.table("tracked_jobs").upsert(data, on_conflict="job_id").execute()
    return result.data[0] if result.data else {}


def get_tracked_jobs() -> List[Dict[str, Any]]:
    db = get_db()
    result = db.table("tracked_jobs").select("*").order("updated_at", desc=True).execute()
    return result.data or []


def delete_tracked_job(job_id: str) -> bool:
    db = get_db()
    result = db.table("tracked_jobs").delete().eq("job_id", job_id).execute()
    return bool(result.data)


# ── Watch Preferences ──────────────────────────────────────────────────────────

def save_watch_preferences(
    min_match_score: float = 70,
    keywords: Optional[List[str]] = None,
    locations: Optional[List[str]] = None,
    company_stages: Optional[List[str]] = None,
) -> Dict[str, Any]:
    db = get_db()
    # Single-row table — delete old, insert new
    db.table("watch_preferences").delete().neq("id", 0).execute()
    result = db.table("watch_preferences").insert({
        "min_match_score": min_match_score,
        "keywords": keywords or [],
        "locations": locations or [],
        "company_stages": company_stages or [],
    }).execute()
    return result.data[0] if result.data else {}


def get_watch_preferences() -> Optional[Dict[str, Any]]:
    db = get_db()
    result = db.table("watch_preferences").select("*").order("updated_at", desc=True).limit(1).execute()
    return result.data[0] if result.data else None


def update_watch_last_checked() -> None:
    db = get_db()
    db.table("watch_preferences").update({"last_checked_at": "now()"}).neq("id", 0).execute()


# ── Search History ─────────────────────────────────────────────────────────────

def save_search(query: str, results_count: int, top_match_score: Optional[float]) -> Dict[str, Any]:
    db = get_db()
    result = db.table("search_history").insert({
        "query": query,
        "results_count": results_count,
        "top_match_score": top_match_score,
    }).execute()
    return result.data[0] if result.data else {}
