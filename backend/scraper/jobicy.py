"""
Jobicy remote-jobs API scraper (no auth required).
API docs: https://jobicy.com/jobs-rss-feed
"""
import uuid
import logging
from typing import List, Dict, Any
from scraper.base import clean_text, extract_remote, fetch_with_retry, parse_salary

logger = logging.getLogger(__name__)

API_URL = "https://jobicy.com/api/v2/remote-jobs"


def _make_id(source_url: str) -> str:
    return str(uuid.uuid5(uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8"), source_url))


def scrape(limit: int = 50) -> List[Dict[str, Any]]:
    logger.info("Fetching jobs from Jobicy API...")
    try:
        resp = fetch_with_retry(API_URL, params={"count": limit, "tag": "engineer,developer,data,product"})
        data = resp.json().get("jobs", [])
    except Exception as e:
        logger.error(f"Jobicy scraper failed: {e}")
        return []

    jobs = []
    for item in data:
        source_url = item.get("url") or item.get("jobSlug") or ""
        if not source_url:
            continue

        description = clean_text(item.get("jobDescription") or item.get("jobExcerpt", ""))
        location = item.get("jobGeo") or "Remote"
        remote = extract_remote(location + " " + description)

        # Salary — Jobicy provides annualSalaryMin/Max
        sal_min, sal_max = parse_salary(item.get("annualSalaryMin"))
        if item.get("annualSalaryMax"):
            _, sal_max = parse_salary(item.get("annualSalaryMax"))
        salary_range = None
        if sal_min and sal_max:
            salary_range = f"${sal_min:,} – ${sal_max:,}"

        tags = [t.strip() for t in (item.get("jobType") or "").split(",") if t.strip()]

        jobs.append({
            "id": _make_id(source_url),
            "title": (item.get("jobTitle") or "Software Engineer")[:100],
            "company": (item.get("companyName") or "Unknown")[:100],
            "location": location[:100],
            "remote": remote,
            "description": description[:2000],
            "requirements": tags[:10],
            "salary_range": salary_range,
            "salary_min": sal_min,
            "salary_max": sal_max,
            "company_stage": None,
            "source": "jobicy",
            "source_url": source_url,
            "posted_date": (item.get("pubDate") or "")[:10] or None,
            "tags": tags[:10],
        })

    logger.info(f"Jobicy: fetched {len(jobs)} jobs.")
    return jobs


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = scrape()
    for j in results[:5]:
        print(f"  [{j['company']}] {j['title']} — {j['location']}")
    print(f"\nTotal: {len(results)} jobs")
