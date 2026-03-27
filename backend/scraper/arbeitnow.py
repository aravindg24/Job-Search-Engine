"""
Scraper for Arbeitnow free job board API (no auth required).
"""
import requests
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from scraper.base import make_id, clean_text, extract_remote

logger = logging.getLogger(__name__)

API_URL = "https://www.arbeitnow.com/api/job-board-api"


def _parse_date(value: Optional[Any]) -> Optional[str]:
    """Return ISO date string (YYYY-MM-DD) from a Unix timestamp, ISO string, or None."""
    if not value:
        return None
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, tz=timezone.utc).strftime("%Y-%m-%d")
        return str(value)[:10]
    except Exception:
        return None


def scrape(limit: int = 50) -> List[Dict[str, Any]]:
    logger.info("Fetching jobs from Arbeitnow API...")
    try:
        resp = requests.get(API_URL, timeout=15)
        resp.raise_for_status()
        data = resp.json().get("data", [])

        jobs = []
        for item in data[:limit]:
            description = clean_text(item.get("description", ""))
            raw_tags = item.get("tags", [])
            tags = raw_tags if isinstance(raw_tags, list) else []
            location = item.get("location", "Remote")
            remote_val = item.get("remote")
            remote = bool(remote_val) if remote_val is not None else extract_remote(location + " " + description)

            jobs.append({
                "id": make_id("arb"),
                "title": item.get("title", "Software Engineer")[:100],
                "company": item.get("company_name", "Unknown")[:100],
                "location": location[:100],
                "remote": remote,
                "description": description[:2000],
                "requirements": tags[:10],
                "salary_range": None,
                "company_stage": None,
                "source": "arbeitnow",
                "source_url": item.get("url", ""),
                "posted_date": _parse_date(item.get("created_at")),
                "tags": tags[:10],
            })

        logger.info(f"Fetched {len(jobs)} jobs from Arbeitnow.")
        return jobs
    except Exception as e:
        logger.error(f"Arbeitnow scraper failed: {e}")
        return []
