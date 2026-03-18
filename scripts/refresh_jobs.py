#!/usr/bin/env python3
"""
Standalone script: scrape new jobs → embed → upsert into Qdrant.
Run manually or schedule as a cron job.

Usage:
  cd backend
  python ../scripts/refresh_jobs.py
"""
import json
import sys
import logging
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from scraper.hackernews import scrape as scrape_hn
from scraper.arbeitnow import scrape as scrape_arb
from scraper.remotive import scrape as scrape_rem
from search.vector_store import create_collection
from indexer import index_jobs

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / "backend" / "data"


def main():
    logger.info("=== RoleGPT Job Refresh ===")
    create_collection()

    jobs = []

    logger.info("Scraping Hacker News Who's Hiring...")
    try:
        hn_jobs = scrape_hn(limit=30)
        jobs.extend(hn_jobs)
        logger.info(f"  HN: {len(hn_jobs)} jobs")
    except Exception as e:
        logger.warning(f"  HN scrape failed: {e}")

    logger.info("Scraping Arbeitnow...")
    try:
        arb_jobs = scrape_arb(limit=50)
        jobs.extend(arb_jobs)
        logger.info(f"  Arbeitnow: {len(arb_jobs)} jobs")
    except Exception as e:
        logger.warning(f"  Arbeitnow scrape failed: {e}")

    logger.info("Scraping Remotive...")
    try:
        rem_jobs = scrape_rem(limit=50)
        jobs.extend(rem_jobs)
        logger.info(f"  Remotive: {len(rem_jobs)} jobs")
    except Exception as e:
        logger.warning(f"  Remotive scrape failed: {e}")

    if not jobs:
        logger.warning("No jobs scraped. Exiting.")
        return

    # Add indexed_at timestamp
    now = datetime.now(timezone.utc).isoformat()
    for job in jobs:
        job["indexed_at"] = now

    # Save to disk
    out_path = DATA_DIR / "scraped_jobs.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=2)
    logger.info(f"Saved {len(jobs)} jobs to {out_path}")

    # Index into Qdrant
    index_jobs(jobs)
    logger.info(f"=== Refresh complete: {len(jobs)} jobs indexed ===")


if __name__ == "__main__":
    main()
