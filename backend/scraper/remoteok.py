"""
Remote OK RSS scraper using feedparser.
Feed: https://remoteok.io/remote-jobs.rss
"""
import uuid
import logging
import feedparser
from typing import List, Dict, Any
from scraper.base import clean_text, extract_remote, parse_salary

logger = logging.getLogger(__name__)

FEED_URL = "https://remoteok.io/remote-jobs.rss"


def _make_id(source_url: str) -> str:
    return str(uuid.uuid5(uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8"), source_url))


def scrape(limit: int = 50) -> List[Dict[str, Any]]:
    logger.info("Fetching jobs from Remote OK RSS feed...")
    try:
        feed = feedparser.parse(FEED_URL)
        if feed.bozo and not feed.entries:
            raise ValueError(f"Feed parse error: {feed.bozo_exception}")
    except Exception as e:
        logger.error(f"Remote OK scraper failed: {e}")
        return []

    jobs = []
    for entry in feed.entries[:limit]:
        source_url = entry.get("link", "")
        if not source_url:
            continue

        title = entry.get("title", "Software Engineer")[:100]
        description = clean_text(entry.get("summary", ""))
        location = entry.get("location", "Remote")[:100] if hasattr(entry, "location") else "Remote"
        remote = True  # Remote OK is remote-only

        # Tags from categories
        tags = [t.term for t in entry.get("tags", []) if hasattr(t, "term")][:10]

        # Salary from feed metadata (some entries include salary_min / salary_max)
        sal_min, _ = parse_salary(entry.get("salary_min") or entry.get("salary"))
        _, sal_max = parse_salary(entry.get("salary_max") or entry.get("salary"))
        salary_range = None
        if sal_min and sal_max:
            salary_range = f"${sal_min:,} – ${sal_max:,}"
        elif sal_min:
            salary_range = f"${sal_min:,}+"

        # Company from author or title prefix (format: "Company | Role")
        company = entry.get("author", "")
        if not company and " | " in title:
            company, title = title.split(" | ", 1)
        company = (company or "Unknown")[:100]

        # Posted date
        published = entry.get("published", "")[:10] if entry.get("published") else None

        jobs.append({
            "id": _make_id(source_url),
            "title": title,
            "company": company,
            "location": location,
            "remote": remote,
            "description": description[:2000],
            "requirements": tags,
            "salary_range": salary_range,
            "salary_min": sal_min,
            "salary_max": sal_max,
            "company_stage": None,
            "source": "remoteok",
            "source_url": source_url,
            "posted_date": published,
            "tags": tags,
        })

    logger.info(f"Remote OK: fetched {len(jobs)} jobs.")
    return jobs


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = scrape()
    for j in results[:5]:
        print(f"  [{j['company']}] {j['title']} — {j['salary_range']}")
    print(f"\nTotal: {len(results)} jobs")
