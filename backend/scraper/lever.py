"""
Scraper for Lever job boards.

Uses the public Lever Postings API (no auth required):
  GET https://api.lever.co/v0/postings/{slug}?mode=json

Company slugs are loaded from backend/data/company_boards.json.
To add a company: add {"company": "Name", "slug": "their-slug"} to the
"lever" array in company_boards.json. The slug matches the path segment in
https://jobs.lever.co/{slug}.
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

_API = "https://api.lever.co/v0/postings/{slug}?mode=json"
_REGISTRY = Path(__file__).parent.parent / "data" / "company_boards.json"
_RATE_LIMIT_S = 0.3


def _to_uuid(url: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, url))


def _parse_ms_timestamp(value: Optional[int]) -> Optional[str]:
    """Convert Unix millisecond timestamp to YYYY-MM-DD."""
    if not value:
        return None
    try:
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return None


def _load_companies() -> List[Dict[str, str]]:
    with open(_REGISTRY, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("lever", [])


def _fetch_company(slug: str, company_name: str, limit: int) -> List[Dict[str, Any]]:
    url = _API.format(slug=slug)
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 404:
            logger.warning(f"Lever: slug '{slug}' not found (404) — skipping")
            return []
        resp.raise_for_status()
        raw_jobs = resp.json()
        if not isinstance(raw_jobs, list):
            logger.warning(f"Lever: unexpected response format for '{slug}'")
            return []
    except Exception as e:
        logger.warning(f"Lever: failed to fetch '{slug}': {e}")
        return []

    jobs = []
    for item in raw_jobs[:limit]:
        source_url = item.get("hostedUrl", "")
        if not source_url:
            continue

        # Lever stores description + lists as separate HTML fields
        description_parts = [
            item.get("description", ""),
            item.get("descriptionPlain", ""),
            " ".join(
                (l.get("content", "") or l.get("text", ""))
                for l in (item.get("lists") or [])
            ),
        ]
        description = clean_text(" ".join(p for p in description_parts if p))

        categories = item.get("categories") or {}
        location = (categories.get("location") or categories.get("allLocations", [""])[0] if isinstance(categories.get("allLocations"), list) else "")[:100]
        dept = categories.get("department", "")
        team = categories.get("team", "")
        tags = [t for t in [dept, team] if t]

        jobs.append({
            "id": _to_uuid(source_url),
            "title": (item.get("text", ""))[:100],
            "company": company_name,
            "location": location,
            "remote": extract_remote(location + " " + description),
            "description": description[:2000],
            "requirements": [],
            "salary_range": None,
            "company_stage": None,
            "source": "lever",
            "source_url": source_url,
            "posted_date": _parse_ms_timestamp(item.get("createdAt")),
            "tags": tags[:10],
        })

    return jobs


def scrape(limit_per_company: int = 20) -> List[Dict[str, Any]]:
    companies = _load_companies()
    logger.info(f"Lever: scraping {len(companies)} companies...")

    all_jobs: List[Dict[str, Any]] = []
    for entry in companies:
        slug = entry.get("slug", "")
        company_name = entry.get("company", slug)
        jobs = _fetch_company(slug, company_name, limit_per_company)
        logger.debug(f"  {company_name}: {len(jobs)} jobs")
        all_jobs.extend(jobs)
        time.sleep(_RATE_LIMIT_S)

    logger.info(f"Lever: collected {len(all_jobs)} jobs total")
    return all_jobs
