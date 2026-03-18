"""
SimplifyJobs GitHub scraper.
Fetches the New-Grad-Positions README, parses the HTML job table,
and returns jobs posted within the last `max_age_days` days.
"""
import re
import uuid
import hashlib
import logging
import requests
from datetime import datetime, timezone
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

README_URL = "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md"


def _make_id(source_url: str) -> str:
    """Deterministic UUID from the source URL."""
    return str(uuid.uuid5(uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8"), source_url))


def _clean_location(td) -> str:
    """Extract readable location text from a table cell (may contain <details>)."""
    details = td.find("details")
    if details:
        # Get all location items inside <details>
        locs = [t.strip() for t in details.get_text(separator="\n").split("\n") if t.strip()]
        return ", ".join(locs[:3]) + (" ..." if len(locs) > 3 else "")
    return td.get_text(separator=", ", strip=True)


def _extract_apply_url(td) -> str:
    """Return the direct job application URL from the apply cell."""
    links = td.find_all("a", href=True)
    direct = ""
    simplify = ""
    for a in links:
        href = a["href"]
        if "simplify.jobs" in href:
            simplify = href
        else:
            direct = href
    return direct or simplify


def scrape(max_age_days: int = 7) -> list[dict]:
    """
    Fetch and parse the SimplifyJobs New-Grad-Positions README.
    Returns a list of job dicts for roles posted within max_age_days.
    """
    logger.info(f"Fetching SimplifyJobs README from GitHub...")
    try:
        resp = requests.get(README_URL, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to fetch SimplifyJobs README: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    tables = soup.find_all("table")
    logger.info(f"Found {len(tables)} tables in README")

    jobs = []
    now = datetime.now(timezone.utc)

    for table in tables:
        for row in table.find_all("tr"):
            cols = row.find_all("td")
            if len(cols) < 5:
                continue

            # Age column (last col) — format: "0d", "3d", "7d"
            age_text = cols[4].get_text(strip=True)
            age_match = re.match(r"(\d+)d", age_text)
            if not age_match:
                continue
            age_days = int(age_match.group(1))
            if age_days > max_age_days:
                continue

            # Company name
            company_tag = cols[0].find("a")
            company = company_tag.get_text(strip=True) if company_tag else cols[0].get_text(strip=True)
            # Strip emoji flags / symbols (🔥 🛂 🇺🇸 🔒 🎓)
            company = re.sub(r"[^\x00-\x7F]+", "", company).strip()

            # Role title
            role = cols[1].get_text(strip=True)
            role = re.sub(r"[^\x00-\x7F]+", "", role).strip()

            # Location
            location = _clean_location(cols[2])

            # Apply URL
            apply_url = _extract_apply_url(cols[3])
            if not apply_url:
                continue  # skip jobs with no link

            # Skip closed postings
            if "🔒" in cols[3].get_text() or "closed" in cols[3].get_text().lower():
                continue

            # Build job dict matching our schema
            job_id = _make_id(apply_url)
            posted_date = (now.replace(hour=0, minute=0, second=0, microsecond=0)
                           .isoformat().split("T")[0])

            jobs.append({
                "id": job_id,
                "title": role,
                "company": company,
                "location": location,
                "remote": "remote" in location.lower(),
                "description": f"{role} at {company}. Location: {location}.",
                "requirements": [],
                "salary_range": None,
                "company_stage": None,
                "source": "simplify_github",
                "source_url": apply_url,
                "posted_date": posted_date,
                "indexed_at": now.isoformat(),
                "tags": ["new-grad", "swe"],
            })

    logger.info(f"SimplifyJobs: scraped {len(jobs)} jobs within {max_age_days} days")
    return jobs


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = scrape(max_age_days=7)
    for j in results[:5]:
        print(f"  [{j['company']}] {j['title']} — {j['location']}")
        print(f"    {j['source_url']}")
    print(f"\nTotal: {len(results)} jobs")
