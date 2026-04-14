"""
Indexer: scrape all sources → deduplicate → embed → upsert to Qdrant.
Drops and recreates the collection on every run so only live jobs are indexed.

Run locally:   python indexer.py
Run in CI:     python indexer.py  (same command, cloud Qdrant via env vars)

NOTE: Do NOT import and call main() from the API server — it is too memory-intensive
for Render's 512 MB free tier. Run this script separately or via GitHub Actions.
"""
import gc
import json
import sys
import time
import hashlib
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Tuple

sys.path.insert(0, str(Path(__file__).parent))

from rapidfuzz import fuzz
from search.embedder import embed_batch
from search.vector_store import create_collection, upsert_batch, count

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
    Deduplicate jobs by source_url hash (Level-1).
    If source_url is missing, fall back to id.
    Last occurrence wins (scraped jobs override seed data).
    """
    seen: dict[str, dict] = {}
    for job in jobs:
        key = job.get("source_url") or job.get("id", "")
        key_hash = hashlib.md5(key.encode()).hexdigest()
        seen[key_hash] = job
    unique = list(seen.values())
    logger.info(f"L1 dedup (URL hash): {len(jobs)} → {len(unique)} unique jobs")
    return unique


def fuzzy_dedup(jobs: list[dict], threshold: int = 92) -> list[dict]:
    """
    Level-2 dedup: remove near-duplicate jobs by fuzzy title+company similarity.
    Keeps the first occurrence when two jobs exceed the similarity threshold.
    O(n²) — acceptable for <10 000 jobs.
    """
    unique: list[dict] = []
    for job in jobs:
        key = f"{job.get('title', '').lower()} {job.get('company', '').lower()}"
        is_dup = False
        for seen in unique:
            seen_key = f"{seen.get('title', '').lower()} {seen.get('company', '').lower()}"
            if fuzz.ratio(key, seen_key) >= threshold:
                is_dup = True
                break
        if not is_dup:
            unique.append(job)
    logger.info(f"L2 dedup (fuzzy): {len(jobs)} → {len(unique)} unique jobs")
    return unique


def stamp_indexed_at(jobs: list[dict]) -> list[dict]:
    """Add indexed_at timestamp to jobs that don't have one (seed data)."""
    now = datetime.now(timezone.utc).isoformat()
    for job in jobs:
        if not job.get("indexed_at"):
            job["indexed_at"] = now
    return jobs


_STREAM_KEYWORDS: dict[str, list[str]] = {
    "engineering": [
        "software engineer", "software developer", "backend", "frontend", "full stack",
        "fullstack", "full-stack", "site reliability", "sre", "devops", "platform engineer",
        "infrastructure engineer", "mobile engineer", "ios engineer", "android engineer",
        "security engineer", "embedded engineer", "firmware engineer", "qa engineer",
        "sdet", "test engineer", "ml engineer", "machine learning engineer",
        "ai engineer", "robotics engineer", "systems engineer", "network engineer",
        "cloud engineer", "solutions engineer", "staff engineer", "principal engineer",
    ],
    "data": [
        "data scientist", "data analyst", "data engineer", "analytics engineer",
        "business intelligence", "bi developer", "bi engineer", "quantitative analyst",
        "statistician", "research scientist", "machine learning researcher", "ai researcher",
        "business analyst", "data science", "data analytics", "applied scientist",
    ],
    "product": [
        "product manager", "product designer", "ux designer", "ui designer",
        "user researcher", "ux researcher", "brand designer", "visual designer",
        "product marketing", "design lead", "head of design", "director of product",
        "vp of product", "growth pm", "technical pm", "associate pm", " apm",
        "program manager", "product lead",
    ],
}


def classify_stream(title: str) -> str:
    """Classify a job title into: engineering | data | product | other."""
    t = title.lower()
    for stream, keywords in _STREAM_KEYWORDS.items():
        if any(kw in t for kw in keywords):
            return stream
    return "other"


def tag_streams(jobs: list[dict]) -> list[dict]:
    """Stamp each job with a stream field if it doesn't already have one."""
    for job in jobs:
        if not job.get("stream"):
            job["stream"] = classify_stream(job.get("title", ""))
    return jobs


_COMPANY_STAGES: dict[str, str] = {}

def _load_company_stages() -> dict[str, str]:
    global _COMPANY_STAGES
    if not _COMPANY_STAGES:
        path = DATA_DIR / "company_stages.json"
        if path.exists():
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            _COMPANY_STAGES = {k.lower(): v for k, v in data.items() if not k.startswith("_")}
    return _COMPANY_STAGES


def tag_company_stages(jobs: list[dict]) -> list[dict]:
    """Fill in company_stage from the static mapping where not already set."""
    stages = _load_company_stages()
    for job in jobs:
        if not job.get("company_stage"):
            company_key = (job.get("company") or "").lower().strip()
            job["company_stage"] = stages.get(company_key)
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


def load_scraped_jobs() -> Tuple[List[dict], Dict[str, int]]:
    """Run all live scrapers and return (combined jobs, per-source counts)."""
    scraped: list[dict] = []
    source_counts: Dict[str, int] = {}

    scraper_registry = [
        # (label, import_path, function_name, kwargs)
        ("SimplifyJobs new-grad", "scraper.simplify_github", "scrape", {"max_age_days": 7}),
        ("SimplifyJobs internships", "scraper.simplify_github", "scrape_internships", {"max_age_days": 30}),
        ("Arbeitnow", "scraper.arbeitnow", "scrape", {}),
        ("Remotive", "scraper.remotive", "scrape", {}),
        ("HackerNews", "scraper.hackernews", "scrape", {}),
        ("Jobicy", "scraper.jobicy", "scrape", {}),
        ("RemoteOK", "scraper.remoteok", "scrape", {}),
        ("Greenhouse", "scraper.greenhouse", "scrape", {}),
        ("Ashby", "scraper.ashby", "scrape", {}),
        ("Lever", "scraper.lever", "scrape", {}),
    ]

    for label, module_path, fn_name, kwargs in scraper_registry:
        try:
            import importlib
            mod = importlib.import_module(module_path)
            fn = getattr(mod, fn_name)
            jobs = fn(**kwargs)
            job_count = len(jobs)
            source_counts[label] = job_count
            logger.info(f"{label}: {job_count} jobs")
            scraped.extend(jobs)
        except Exception as e:
            logger.warning(f"{label} scraper failed: {e}")
            source_counts[label] = 0

    return scraped, source_counts


def persist_jobs_to_supabase(jobs: list[dict]) -> None:
    """Batch-upsert all jobs into the Supabase jobs table (best-effort)."""
    try:
        from database import bulk_upsert_jobs
        bulk_upsert_jobs(jobs)
        logger.info(f"Persisted {len(jobs)} jobs to Supabase jobs table.")
    except Exception as e:
        logger.warning(f"Supabase job persistence skipped: {e}")


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
    run_start = time.time()
    create_collection()

    # Load all jobs
    all_jobs = load_seed_jobs()
    source_counts: Dict[str, int] = {"seed": len(all_jobs)}

    if include_scraped:
        scraped, scraper_counts = load_scraped_jobs()
        source_counts.update(scraper_counts)
        all_jobs.extend(scraped)

    total_before_dedup = len(all_jobs)

    # Deduplicate (L1: URL hash, L2: fuzzy title+company)
    all_jobs = dedup(all_jobs)
    all_jobs = fuzzy_dedup(all_jobs)
    all_jobs = stamp_indexed_at(all_jobs)
    all_jobs = tag_streams(all_jobs)
    all_jobs = tag_company_stages(all_jobs)

    total_after_dedup = len(all_jobs)

    # Persist to Supabase for historical record
    persist_jobs_to_supabase(all_jobs)

    # Index to Qdrant in memory-safe chunks
    index_jobs(all_jobs)
    total_indexed = count()

    duration_seconds = time.time() - run_start

    # Log ingest run metrics to Supabase
    try:
        from database import log_ingest_run
        log_ingest_run(
            source_counts=source_counts,
            total_before_dedup=total_before_dedup,
            total_after_dedup=total_after_dedup,
            total_indexed=total_indexed,
            duration_seconds=duration_seconds,
        )
    except Exception as e:
        logger.warning(f"Failed to log ingest run metrics: {e}")

    logger.info(
        f"Indexing complete! {total_indexed} jobs indexed in {duration_seconds:.1f}s "
        f"({total_before_dedup} raw → {total_after_dedup} after dedup)"
    )


if __name__ == "__main__":
    main()
