"""
Scraper for Arbeitnow free job board API (no auth required).
"""
import requests
import logging
from typing import List, Dict, Any
from scraper.base import make_id, clean_text, extract_remote

logger = logging.getLogger(__name__)

API_URL = "https://www.arbeitnow.com/api/job-board-api"


def scrape(limit: int = 50) -> List[Dict[str, Any]]:
    logger.info("Fetching jobs from Arbeitnow API...")
    try:
        resp = requests.get(API_URL, timeout=15)
        resp.raise_for_status()
        data = resp.json().get("data", [])

        jobs = []
        for item in data[:limit]:
            description = clean_text(item.get("description", ""))
            tags = item.get("tags", [])
            location = item.get("location", "Remote")
            remote = item.get("remote", extract_remote(location + " " + description))

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
                "posted_date": str(item.get("created_at", ""))[:10] if item.get("created_at") else None,
                "tags": tags[:10],
            })

        logger.info(f"Fetched {len(jobs)} jobs from Arbeitnow.")
        return jobs
    except Exception as e:
        logger.error(f"Arbeitnow scraper failed: {e}")
        return []
