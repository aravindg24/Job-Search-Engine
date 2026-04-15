"""
Search pipeline: embed → vector search → LLM re-rank → format response.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from search.embedder import embed_query
from search.vector_store import search
from search.reranker import rerank, explain as reranker_explain
from models import JobResult, SearchFilters
import logging
import re

logger = logging.getLogger(__name__)

# US state name ↔ abbreviation lookup for smart location parsing
_US_STATES = {
    "alabama": "al", "alaska": "ak", "arizona": "az", "arkansas": "ar",
    "california": "ca", "colorado": "co", "connecticut": "ct", "delaware": "de",
    "florida": "fl", "georgia": "ga", "hawaii": "hi", "idaho": "id",
    "illinois": "il", "indiana": "in", "iowa": "ia", "kansas": "ks",
    "kentucky": "ky", "louisiana": "la", "maine": "me", "maryland": "md",
    "massachusetts": "ma", "michigan": "mi", "minnesota": "mn", "mississippi": "ms",
    "missouri": "mo", "montana": "mt", "nebraska": "ne", "nevada": "nv",
    "new hampshire": "nh", "new jersey": "nj", "new mexico": "nm", "new york": "ny",
    "north carolina": "nc", "north dakota": "nd", "ohio": "oh", "oklahoma": "ok",
    "oregon": "or", "pennsylvania": "pa", "rhode island": "ri", "south carolina": "sc",
    "south dakota": "sd", "tennessee": "tn", "texas": "tx", "utah": "ut",
    "vermont": "vt", "virginia": "va", "washington": "wa", "west virginia": "wv",
    "wisconsin": "wi", "wyoming": "wy", "district of columbia": "dc",
}
# Reverse: abbreviation → full name
_STATE_ABBR = {v: k for k, v in _US_STATES.items()}


def _location_matches(job_location: str, query_location: str) -> bool:
    """
    Smart location matching: parse 'City, State' format and match by state.
    Handles 'Phoenix, AZ', 'Phoenix, Arizona', 'Arizona, USA', 'AZ', 'Arizona'.
    """
    if not job_location or not query_location:
        return False

    job_loc = job_location.lower().strip()
    q_loc = query_location.lower().strip()

    # Direct substring match first (fast path)
    if q_loc in job_loc:
        return True

    # Resolve query to state name + abbreviation
    q_state_full = _US_STATES.get(q_loc)          # "arizona" → "az"
    q_state_abbr = _STATE_ABBR.get(q_loc)          # "az" → "arizona"

    # Extract state from job location "City, State" → take part after last comma
    parts = [p.strip() for p in job_loc.split(",")]
    if len(parts) >= 2:
        job_state = parts[-1].strip()
        # Remove country suffixes like "usa", "us", "united states"
        job_state = re.sub(r'\b(usa?|united states)\b', '', job_state).strip()
    else:
        job_state = job_loc

    # Match against state full name or abbreviation
    if q_state_full and job_state == q_state_full:   # query="az", job_state="arizona"
        return True
    if q_state_abbr and job_state == q_state_abbr:   # query="arizona", job_state="az"
        return True
    if q_state_full and q_state_full in job_state:    # job_state="arizona, usa" → strip country
        return True
    # Also match job_state as abbr against query full name
    if q_loc in _US_STATES and job_state in (_US_STATES.get(q_loc, ''), q_loc):
        return True

    return False


def _blended_score(match_score: float, posted_date_str: Optional[str]) -> float:
    """
    Blended score = 70% relevance + 30% recency.
    recency_score is 1.0 for today, decays to 0.0 over 365 days.
    """
    relevance = (match_score or 0) / 100.0

    recency = 0.0
    if posted_date_str:
        try:
            posted = datetime.fromisoformat(str(posted_date_str))
            if posted.tzinfo is None:
                posted = posted.replace(tzinfo=timezone.utc)
            days_old = max(0, (datetime.now(timezone.utc) - posted).days)
            recency = max(0.0, 1.0 - days_old / 365.0)
        except Exception:
            pass

    return round((0.7 * relevance + 0.3 * recency) * 100, 2)


def run_search(
    query: str,
    top_k: int = 10,
    offset: int = 0,
    sort_by: str = "relevance",
    filters: Optional[SearchFilters] = None,
    resume_profile: Optional[Dict[str, Any]] = None,
    clean_query: Optional[str] = None,
) -> List[JobResult]:
    """Full search pipeline: embed → search → (location post-filter) → rerank → return."""
    # Step 1: Embed the semantic role query.
    embed_text = (clean_query or query).strip() or query
    query_vector = embed_query(embed_text)

    # Step 2: Vector search — fetch enough for offset + top_k after filtering.
    location_filter = (filters.location or "").strip() if filters else ""
    fetch_k = (offset + top_k) * (4 if location_filter else 2)

    filter_dict = None
    if filters:
        filter_dict = {}
        if filters.remote is not None:
            filter_dict["remote"] = filters.remote
        if filters.stream:
            filter_dict["stream"] = filters.stream

    candidates = search(query_vector, top_k=fetch_k, filters=filter_dict)

    if not candidates:
        return []

    # Step 3: Smart location post-filter.
    # Remote jobs always pass. Non-remote jobs must match location via smart parsing.
    if location_filter:
        candidates = [
            c for c in candidates
            if c["payload"].get("remote", False)
            or _location_matches(c["payload"].get("location") or "", location_filter)
        ]

    if not candidates:
        return []

    # Step 4: LLM re-rank (pass resume profile for richer scoring)
    reranked = rerank(query, candidates, resume_profile=resume_profile)

    # Step 5: Apply blended scoring if sort_by == "recent"
    if sort_by == "recent":
        for item in reranked:
            item["blended_score"] = _blended_score(
                item.get("match_score", 0),
                item["payload"].get("posted_date"),
            )
        reranked.sort(key=lambda x: x.get("blended_score", 0), reverse=True)

    # Step 6: Format all reranked results (pagination handled in app.py)
    results = []
    for item in reranked:
        payload = item["payload"]
        results.append(JobResult(
            id=item["id"],
            title=payload.get("title", ""),
            company=payload.get("company", ""),
            location=payload.get("location", ""),
            remote=payload.get("remote", False),
            description=payload.get("description", ""),
            requirements=payload.get("requirements", []),
            salary_range=payload.get("salary_range"),
            company_stage=payload.get("company_stage"),
            source=payload.get("source", ""),
            source_url=payload.get("source_url"),
            posted_date=payload.get("posted_date"),
            tags=payload.get("tags", []),
            match_score=item.get("match_score"),
            match_reason=item.get("match_reason"),
        ))

    return results


def run_explain(query: str, job_id: str, resume_profile: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """Get detailed match explanation for a specific job."""
    from search.vector_store import get_client, _to_uuid
    from config import settings

    client = get_client()
    results = client.retrieve(
        collection_name=settings.qdrant_collection,
        ids=[_to_uuid(job_id)],
        with_payload=True,
    )

    if not results:
        return None

    job = results[0].payload
    return reranker_explain(query, job, resume_profile=resume_profile)
