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


_USA_QUERIES = {"usa", "us", "united states", "united states of america"}

def _location_matches(job_location: str, query_location: str) -> bool:
    """
    Smart location matching: parse 'City, State' format and match by state.
    Handles 'Phoenix, AZ', 'Phoenix, Arizona', 'Arizona, USA', 'AZ', 'Arizona'.
    For country-wide queries like 'USA'/'US'/'United States', matches any US location
    or unspecified remote (no country) but rejects explicitly non-US locations.
    """
    if not query_location:
        return False

    job_loc = (job_location or "").lower().strip()
    q_loc = query_location.lower().strip()

    # Country-wide USA query: match any job with a US location indicator
    if q_loc in _USA_QUERIES:
        # Unspecified remote (no country) passes through for country-wide USA searches
        if job_loc in ("remote", "", "worldwide", "anywhere", "global"):
            return True
        # Explicit US indicator in the location string
        if re.search(r'\busa?\b', job_loc) or "united states" in job_loc:
            return True
        # Any US state name or abbreviation present in the location
        for part in [p.strip() for p in job_loc.split(",")]:
            part_clean = re.sub(r'\b(usa?|united states)\b', '', part).strip()
            if part_clean in _US_STATES or part_clean in _STATE_ABBR:
                return True
        return False

    if not job_loc:
        return False

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


def _posted_datetime(posted_date_str: Optional[str]) -> Optional[datetime]:
    if not posted_date_str:
        return None
    try:
        posted = datetime.fromisoformat(str(posted_date_str))
        if posted.tzinfo is None:
            posted = posted.replace(tzinfo=timezone.utc)
        return posted
    except Exception:
        return None


def _normalize_terms(values: Optional[List[str]]) -> List[str]:
    if not values:
        return []
    return [value.strip().lower() for value in values if isinstance(value, str) and value.strip()]


def _job_text_blob(payload: Dict[str, Any]) -> str:
    requirements = payload.get("requirements") or []
    tags = payload.get("tags") or []
    parts = [
        payload.get("title", ""),
        payload.get("company", ""),
        payload.get("location", ""),
        payload.get("description", ""),
        " ".join(requirements) if isinstance(requirements, list) else str(requirements),
        " ".join(tags) if isinstance(tags, list) else str(tags),
        payload.get("company_stage", ""),
        payload.get("role_type", ""),
    ]
    return " ".join(str(part) for part in parts if part).lower()


def _salary_bounds_match(payload: Dict[str, Any], requested_min: Optional[int], requested_max: Optional[int]) -> bool:
    if requested_min is None and requested_max is None:
        return True

    job_min = payload.get("salary_min")
    job_max = payload.get("salary_max")
    if job_min is None and job_max is None:
        return True

    try:
        job_min_value = int(job_min) if job_min is not None else None
    except Exception:
        job_min_value = None
    try:
        job_max_value = int(job_max) if job_max is not None else None
    except Exception:
        job_max_value = None

    if requested_min is not None and job_max_value is not None and job_max_value < requested_min:
        return False
    if requested_max is not None and job_min_value is not None and job_min_value > requested_max:
        return False
    return True


def _metadata_matches_stage(payload: Dict[str, Any], stages: Optional[List[str]]) -> bool:
    if not stages:
        return True
    job_stage = (payload.get("company_stage") or "").strip().lower()
    if not job_stage:
        return True
    return any(stage in job_stage for stage in _normalize_terms(stages))


def _metadata_matches_role_type(payload: Dict[str, Any], role_type: Optional[str]) -> bool:
    if not role_type:
        return True
    job_role_type = (payload.get("role_type") or "").strip().lower()
    if not job_role_type:
        return True
    return role_type.strip().lower() in job_role_type


def _matches_excludes(payload: Dict[str, Any], excludes: Optional[List[str]]) -> bool:
    if not excludes:
        return True
    blob = _job_text_blob(payload)
    return not any(term in blob for term in _normalize_terms(excludes))


_EXPERIENCE_LEVEL_PATTERNS = {
    "principal": re.compile(r'\bprincipal\b', re.IGNORECASE),
    "staff":     re.compile(r'\bstaff\b', re.IGNORECASE),
    "senior":    re.compile(r'\bsenior\b|\bsr\.?\b', re.IGNORECASE),
    "mid":       re.compile(r'\bmid(?:-?level)?\b', re.IGNORECASE),
    "junior":    re.compile(r'\bjunior\b|\bjr\.?\b', re.IGNORECASE),
    "entry":     re.compile(r'\bentry(?:-?level)?\b|\bnew\s+grad\b|\bgraduate\b', re.IGNORECASE),
}

def _metadata_matches_experience_level(payload: Dict[str, Any], level: Optional[str]) -> bool:
    if not level:
        return True
    pattern = _EXPERIENCE_LEVEL_PATTERNS.get(level.strip().lower())
    if pattern is None:
        return True  # unrecognised value — don't filter
    text = f"{payload.get('title', '')} {payload.get('description', '')}"
    return bool(pattern.search(text))


def run_search(
    query: str,
    top_k: int = 10,
    offset: int = 0,
    sort_by: str = "relevance",
    filters: Optional[SearchFilters] = None,
    resume_profile: Optional[Dict[str, Any]] = None,
    clean_query: Optional[str] = None,
    search_intent: Optional[Dict[str, Any]] = None,
) -> List[JobResult]:
    """Full search pipeline: embed → search → (location post-filter) → rerank → return."""
    # Step 1: Embed the semantic role query.
    embed_text = (clean_query or query).strip() or query
    query_vector = embed_query(embed_text)

    # Step 2: Vector search — fetch enough for offset + top_k after filtering.
    location_filter = (filters.location or "").strip() if filters else ""
    active_post_filters = sum([
        bool(location_filter),
        bool(filters and filters.experience_level),
        bool(filters and filters.role_type),
        bool(filters and filters.excludes),
        bool(filters and filters.salary_min is not None),
        bool(filters and filters.salary_max is not None),
    ])
    fetch_multiplier = min(3 + active_post_filters, 8)
    if sort_by == "recent":
        fetch_multiplier = max(fetch_multiplier, 5)
    fetch_k = (offset + top_k) * fetch_multiplier

    filter_dict = None
    if filters:
        filter_dict = {}
        if filters.remote is not None:
            filter_dict["remote"] = filters.remote
        if filters.company_stages and len(filters.company_stages) == 1:
            filter_dict["company_stage"] = filters.company_stages[0]

    candidates = search(query_vector, top_k=fetch_k, filters=filter_dict)

    if not candidates:
        return []

    # Step 3: Smart location post-filter — every job must pass location matching.
    # _location_matches() handles unspecified remote ("Remote" with no country) for
    # country-wide queries (USA/US) and strict state/city matching otherwise.
    if location_filter:
        candidates = [
            c for c in candidates
            if _location_matches(c["payload"].get("location") or "", location_filter)
        ]

    if candidates and filters:
        candidates = [
            c for c in candidates
            if _metadata_matches_stage(c["payload"], filters.company_stages)
            and _metadata_matches_role_type(c["payload"], filters.role_type)
            and _metadata_matches_experience_level(c["payload"], filters.experience_level)
            and _salary_bounds_match(c["payload"], filters.salary_min, filters.salary_max)
            and _matches_excludes(c["payload"], filters.excludes)
        ]

    if not candidates:
        return []

    # Step 4: LLM re-rank (pass resume profile for richer scoring)
    reranked = rerank(query, candidates, resume_profile=resume_profile, search_intent=search_intent)

    # Step 5: Apply explicit sort behavior selected by the user.
    # relevance: keep reranker order; recent: strict newest-first ordering.
    if sort_by == "recent":
        for item in reranked:
            item["posted_datetime"] = _posted_datetime(item["payload"].get("posted_date"))
        reranked.sort(
            key=lambda x: (
                x.get("posted_datetime") or datetime.min.replace(tzinfo=timezone.utc),
                x.get("match_score", 0) or 0,
            ),
            reverse=True,
        )

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
