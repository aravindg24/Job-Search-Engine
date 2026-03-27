"""
Indexer: scrape all sources → deduplicate → embed → upsert to Qdrant → cleanup old jobs.

Run locally:   python indexer.py
Run in CI:     python indexer.py  (same command, cloud Qdrant via env vars)

NOTE: Do NOT import and call main() from the API server — it is too memory-intensive
for Render's 512 MB free tier. Run this script separately or via GitHub Actions.
"""
import gc
import json
import sys
import hashlib
import logging
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent))

from search.embedder import embed_batch
from search.vector_store import create_collection, upsert_batch, count, delete_old_jobs

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"


def build_text(job: dict) -> str:
    """Combine job fields into a single text for embedding."""
    parts = [
        job.get("title", ""),
        job.get("company", ""),
        job.get("location", ""),
        job.get("description", ""),
        " ".join(job.get("requirements", [])),
        " ".join(job.get("tags", [])),
    ]
    return " | ".join(p for p in parts if p)


def dedup(jobs: list[dict]) -> list[dict]:
    """
    Deduplicate jobs by source_url hash.
    If source_url is missing, fall back to id.
    Last occurrence wins (scraped jobs override seed data).
    """
    seen: dict[str, dict] = {}
    for job in jobs:
        key = job.get("source_url") or job.get("id", "")
        key_hash = hashlib.md5(key.encode()).hexdigest()
        seen[key_hash] = job
    unique = list(seen.values())
    logger.info(f"Dedup: {len(jobs)} → {len(unique)} unique jobs")
    return unique


def stamp_indexed_at(jobs: list[dict]) -> list[dict]:
    """Add indexed_at timestamp to jobs that don't have one (seed data)."""
    now = datetime.now(timezone.utc).isoformat()
    for job in jobs:
        if not job.get("indexed_at"):
            job["indexed_at"] = now
    return jobs


def load_seed_jobs() -> list[dict]:
    path = DATA_DIR / "seed_jobs.json"
    if not path.exists():
        logger.warning("seed_jobs.json not found — skipping seed data")
        return []
    with open(path, encoding="utf-8") as f:
        jobs = json.load(f)
    logger.info(f"Loaded {len(jobs)} seed jobs")
    return jobs


def load_scraped_jobs() -> list[dict]:
    """Run all live scrapers and return combined results."""
    scraped = []

    # 1. SimplifyJobs GitHub (new grad roles, 7-day filter)
    try:
        from scraper.simplify_github import scrape as scrape_simplify
        jobs = scrape_simplify(max_age_days=7)
        logger.info(f"SimplifyJobs: {len(jobs)} jobs")
        scraped.extend(jobs)
    except Exception as e:
        logger.warning(f"SimplifyJobs scraper failed: {e}")

    # 2. Arbeitnow API (free, no auth required)
    try:
        from scraper.arbeitnow import scrape as scrape_arbeitnow
        jobs = scrape_arbeitnow()
        logger.info(f"Arbeitnow: {len(jobs)} jobs")
        scraped.extend(jobs)
    except Exception as e:
        logger.warning(f"Arbeitnow scraper failed: {e}")

    # 3. Remotive API (free, remote jobs)
    try:
        from scraper.remotive import scrape as scrape_remotive
        jobs = scrape_remotive()
        logger.info(f"Remotive: {len(jobs)} jobs")
        scraped.extend(jobs)
    except Exception as e:
        logger.warning(f"Remotive scraper failed: {e}")

    # 4. Hacker News "Who's Hiring"
    try:
        from scraper.hackernews import scrape as scrape_hn
        jobs = scrape_hn()
        logger.info(f"HackerNews: {len(jobs)} jobs")
        scraped.extend(jobs)
    except Exception as e:
        logger.warning(f"HackerNews scraper failed: {e}")

    # 5. Greenhouse company boards (company_boards.json registry)
    try:
        from scraper.greenhouse import scrape as scrape_greenhouse
        jobs = scrape_greenhouse()
        logger.info(f"Greenhouse: {len(jobs)} jobs")
        scraped.extend(jobs)
    except Exception as e:
        logger.warning(f"Greenhouse scraper failed: {e}")

    # 6. Ashby company boards (company_boards.json registry)
    try:
        from scraper.ashby import scrape as scrape_ashby
        jobs = scrape_ashby()
        logger.info(f"Ashby: {len(jobs)} jobs")
        scraped.extend(jobs)
    except Exception as e:
        logger.warning(f"Ashby scraper failed: {e}")

    # 7. Lever company boards (company_boards.json registry)
    try:
        from scraper.lever import scrape as scrape_lever
        jobs = scrape_lever()
        logger.info(f"Lever: {len(jobs)} jobs")
        scraped.extend(jobs)
    except Exception as e:
        logger.warning(f"Lever scraper failed: {e}")

    return scraped


def index_jobs(jobs: list[dict], chunk_size: int = 50) -> None:
    """
    Embed and upsert jobs in chunks to stay within 512 MB RAM on Render free tier.
    Each chunk embeds at most `chunk_size` job texts before freeing memory.
    """
    if not jobs:
        logger.warning("No jobs to index.")
        return

    total = len(jobs)
    indexed = 0
    logger.info(f"Indexing {total} jobs in chunks of {chunk_size}...")

    for start in range(0, total, chunk_size):
        chunk = jobs[start : start + chunk_size]

        texts = [build_text(j) for j in chunk]
        vectors = embed_batch(texts)

        points = [
            {"id": job["id"], "vector": vec, "payload": job}
            for job, vec in zip(chunk, vectors)
        ]

        upsert_batch(points)
        indexed += len(chunk)
        logger.info(f"  chunk {start // chunk_size + 1}: {indexed}/{total} jobs upserted")

        # Explicitly free the large arrays before the next chunk
        del texts, vectors, points
        gc.collect()

    logger.info(f"Indexing complete — collection now has {count()} points.")


def main(include_scraped: bool = True):
    create_collection()

    # Load all jobs
    all_jobs = load_seed_jobs()

    if include_scraped:
        scraped = load_scraped_jobs()
        all_jobs.extend(scraped)

    # Deduplicate and stamp timestamps
    all_jobs = dedup(all_jobs)
    all_jobs = stamp_indexed_at(all_jobs)

    # Index to Qdrant
    index_jobs(all_jobs)

    # Cleanup jobs older than 90 days (keeps DB lean)
    delete_old_jobs(days=90)

    logger.info("Indexing complete!")


if __name__ == "__main__":
    main()
