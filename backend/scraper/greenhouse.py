"""
Scraper for Greenhouse job boards.

Uses the public Greenhouse Boards API (no auth required):
  GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true

Company slugs are loaded from backend/data/company_boards.json.
To add a company: add {"company": "Name", "slug": "their-slug"} to the
"greenhouse" array in company_boards.json.
"""
import json
import time
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

import requests

from scraper.base import clean_text, extract_remote

logger = logging.getLogger(__name__)

_API = "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"
_REGISTRY = Path(__file__).parent.parent / "data" / "company_boards.json"
_RATE_LIMIT_S = 0.3  # seconds between requests to be polite


def _to_uuid(url: str) -> str:
    """Deterministic UUID5 from a URL — same job always gets the same ID."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, url))


def _parse_date(value: Optional[str]) -> Optional[str]:
    """Convert ISO 8601 timestamp to YYYY-MM-DD."""
    if not value:
        return None
    try:
        return str(value)[:10]
    except Exception:
        return None


def _load_companies() -> List[Dict[str, str]]:
    with open(_REGISTRY, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("greenhouse", [])


def _fetch_company(slug: str, company_name: str, limit: int) -> List[Dict[str, Any]]:
    url = _API.format(slug=slug)
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 404:
            logger.warning(f"Greenhouse: slug '{slug}' not found (404) — skipping")
            return []
        resp.raise_for_status()
        raw_jobs = resp.json().get("jobs", [])
    except Exception as e:
        logger.warning(f"Greenhouse: failed to fetch '{slug}': {e}")
        return []

    jobs = []
    for item in raw_jobs[:limit]:
        source_url = item.get("absolute_url", "")
        if not source_url:
            continue

        description = clean_text(item.get("content", ""))
        location_obj = item.get("location") or {}
        location = location_obj.get("name", "") if isinstance(location_obj, dict) else str(location_obj)

        # Departments as tags
        depts = item.get("departments") or []
        tags = [d["name"] for d in depts if isinstance(d, dict) and d.get("name")]

        jobs.append({
            "id": _to_uuid(source_url),
            "title": item.get("title", "")[:100],
            "company": company_name,
            "location": (location or "")[:100],
            "remote": extract_remote((location or "") + " " + description),
            "description": description[:2000],
            "requirements": [],
            "salary_range": None,
            "company_stage": None,
            "source": "greenhouse",
            "source_url": source_url,
            "posted_date": _parse_date(item.get("updated_at")),
            "tags": tags[:10],
        })

    return jobs


def scrape(limit_per_company: int = 20) -> List[Dict[str, Any]]:
    companies = _load_companies()
    logger.info(f"Greenhouse: scraping {len(companies)} companies...")

    all_jobs: List[Dict[str, Any]] = []
    for entry in companies:
        slug = entry.get("slug", "")
        company_name = entry.get("company", slug)
        jobs = _fetch_company(slug, company_name, limit_per_company)
        logger.debug(f"  {company_name}: {len(jobs)} jobs")
        all_jobs.extend(jobs)
        time.sleep(_RATE_LIMIT_S)

    logger.info(f"Greenhouse: collected {len(all_jobs)} jobs total")
    return all_jobs
