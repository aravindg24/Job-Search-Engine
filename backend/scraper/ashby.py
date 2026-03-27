"""
Scraper for Ashby HQ job boards.

Uses the public Ashby Posting API (no auth required):
  GET https://api.ashbyhq.com/posting-api/job-board/{slug}

Company slugs are loaded from backend/data/company_boards.json.
To add a company: add {"company": "Name", "slug": "their-slug"} to the
"ashby" array in company_boards.json. The slug matches the subdomain in
https://jobs.ashbyhq.com/{slug}.
"""
import json
import time
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

import requests

from scraper.base import clean_text, extract_remote

logger = logging.getLogger(__name__)

_API = "https://api.ashbyhq.com/posting-api/job-board/{slug}"
_REGISTRY = Path(__file__).parent.parent / "data" / "company_boards.json"
_RATE_LIMIT_S = 0.3


def _to_uuid(url: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, url))


def _parse_date(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        return str(value)[:10]
    except Exception:
        return None


def _load_companies() -> List[Dict[str, str]]:
    with open(_REGISTRY, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("ashby", [])


def _fetch_company(slug: str, company_name: str, limit: int) -> List[Dict[str, Any]]:
    url = _API.format(slug=slug)
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 404:
            logger.warning(f"Ashby: slug '{slug}' not found (404) — skipping")
            return []
        resp.raise_for_status()
        raw_jobs = resp.json().get("jobs", [])
    except Exception as e:
        logger.warning(f"Ashby: failed to fetch '{slug}': {e}")
        return []

    jobs = []
    for item in raw_jobs[:limit]:
        apply_url = item.get("applyUrl") or item.get("jobUrl", "")
        if not apply_url:
            # Fall back to constructing URL from id
            job_id = item.get("id", "")
            apply_url = f"https://jobs.ashbyhq.com/{slug}/{job_id}"

        description = clean_text(item.get("descriptionHtml") or item.get("description", ""))
        location = (item.get("locationName") or item.get("location", ""))[:100]

        # Department as tag
        dept = item.get("department") or item.get("departmentName", "")
        tags = [dept] if dept else []

        jobs.append({
            "id": _to_uuid(apply_url),
            "title": (item.get("title", ""))[:100],
            "company": company_name,
            "location": location,
            "remote": extract_remote(location + " " + description),
            "description": description[:2000],
            "requirements": [],
            "salary_range": None,
            "company_stage": None,
            "source": "ashby",
            "source_url": apply_url,
            "posted_date": _parse_date(item.get("publishedAt")),
            "tags": tags[:10],
        })

    return jobs


def scrape(limit_per_company: int = 20) -> List[Dict[str, Any]]:
    companies = _load_companies()
    logger.info(f"Ashby: scraping {len(companies)} companies...")

    all_jobs: List[Dict[str, Any]] = []
    for entry in companies:
        slug = entry.get("slug", "")
        company_name = entry.get("company", slug)
        jobs = _fetch_company(slug, company_name, limit_per_company)
        logger.debug(f"  {company_name}: {len(jobs)} jobs")
        all_jobs.extend(jobs)
        time.sleep(_RATE_LIMIT_S)

    logger.info(f"Ashby: collected {len(all_jobs)} jobs total")
    return all_jobs
