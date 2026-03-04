"""
Scraper for Remotive API (free, remote tech jobs).
"""
import requests
import logging
from typing import List, Dict, Any
from scraper.base import make_id, clean_text

logger = logging.getLogger(__name__)

API_URL = "https://remotive.com/api/remote-jobs"


def scrape(limit: int = 50, category: str = "software-dev") -> List[Dict[str, Any]]:
    logger.info(f"Fetching jobs from Remotive API (category={category})...")
    try:
        params = {"category": category, "limit": limit}
        resp = requests.get(API_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json().get("jobs", [])

        jobs = []
        for item in data[:limit]:
            description = clean_text(item.get("description", ""))
            tags = item.get("tags", [])

            jobs.append({
                "id": make_id("rem"),
                "title": item.get("title", "Software Engineer")[:100],
                "company": item.get("company_name", "Unknown")[:100],
                "location": item.get("candidate_required_location", "Remote")[:100],
                "remote": True,  # Remotive is all remote
                "description": description[:2000],
                "requirements": tags[:10],
                "salary_range": item.get("salary", None),
                "company_stage": None,
                "source": "remotive",
                "source_url": item.get("url", ""),
                "posted_date": item.get("publication_date", "")[:10],
                "tags": tags[:10] + ["remote"],
            })

        logger.info(f"Fetched {len(jobs)} jobs from Remotive.")
        return jobs
    except Exception as e:
        logger.error(f"Remotive scraper failed: {e}")
        return []
