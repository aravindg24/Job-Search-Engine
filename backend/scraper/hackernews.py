"""
Scraper for Hacker News "Who is Hiring?" monthly threads.
"""
import requests
import logging
from typing import List, Dict, Any, Optional
from scraper.base import make_id, clean_text, extract_remote

logger = logging.getLogger(__name__)

ALGOLIA_URL = "https://hn.algolia.com/api/v1/search"
HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/{}.json"


def get_latest_hiring_thread() -> Optional[int]:
    params = {
        "query": "Ask HN: Who is hiring?",
        "tags": "ask_hn",
        "hitsPerPage": 5,
    }
    resp = requests.get(ALGOLIA_URL, params=params, timeout=10)
    resp.raise_for_status()
    hits = resp.json().get("hits", [])
    for hit in hits:
        if "who is hiring" in hit.get("title", "").lower():
            return int(hit["objectID"])
    return None


def get_thread_comments(thread_id: int) -> List[int]:
    resp = requests.get(HN_ITEM_URL.format(thread_id), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data.get("kids", [])[:50]  # top 50 comments


def parse_comment(comment_id: int) -> Optional[Dict[str, Any]]:
    try:
        resp = requests.get(HN_ITEM_URL.format(comment_id), timeout=10)
        resp.raise_for_status()
        data = resp.json()
        text = clean_text(data.get("text", ""))
        if not text or len(text) < 100:
            return None

        lines = text.split("|")
        title = lines[0].strip() if lines else "Software Engineer"
        company = lines[1].strip() if len(lines) > 1 else "Unknown"

        return {
            "id": make_id("hn"),
            "title": title[:100],
            "company": company[:100],
            "location": "Unknown",
            "remote": extract_remote(text),
            "description": text[:2000],
            "requirements": [],
            "salary_range": None,
            "company_stage": None,
            "source": "hackernews",
            "source_url": f"https://news.ycombinator.com/item?id={comment_id}",
            "posted_date": None,
            "tags": ["hackernews"],
        }
    except Exception as e:
        logger.debug(f"Failed to parse comment {comment_id}: {e}")
        return None


def scrape(limit: int = 30) -> List[Dict[str, Any]]:
    logger.info("Scraping Hacker News Who's Hiring...")
    try:
        thread_id = get_latest_hiring_thread()
        if not thread_id:
            logger.warning("Could not find latest HN hiring thread.")
            return []

        comment_ids = get_thread_comments(thread_id)
        jobs = []
        for cid in comment_ids[:limit]:
            job = parse_comment(cid)
            if job:
                jobs.append(job)

        logger.info(f"Scraped {len(jobs)} jobs from HN.")
        return jobs
    except Exception as e:
        logger.error(f"HN scraper failed: {e}")
        return []
