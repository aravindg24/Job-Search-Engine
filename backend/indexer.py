"""
Indexer: Load seed jobs (and scraped jobs) → embed → store in Qdrant.
Run: python indexer.py
"""
import json
import sys
import logging
from pathlib import Path

# Allow imports from backend root
sys.path.insert(0, str(Path(__file__).parent))

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


def load_jobs(path: Path) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def index_jobs(jobs: list[dict]) -> None:
    if not jobs:
        logger.warning("No jobs to index.")
        return

    logger.info(f"Indexing {len(jobs)} jobs...")
    texts = [build_text(j) for j in jobs]

    logger.info("Generating embeddings...")
    vectors = embed_batch(texts)

    points = [
        {"id": job["id"], "vector": vector, "payload": job}
        for job, vector in zip(jobs, vectors)
    ]

    upsert_batch(points)
    logger.info(f"Indexed {len(points)} jobs. Collection now has {count()} points.")


def main():
    create_collection()

    # Load seed data
    seed_path = DATA_DIR / "seed_jobs.json"
    if seed_path.exists():
        jobs = load_jobs(seed_path)
        logger.info(f"Loaded {len(jobs)} jobs from seed_jobs.json")
    else:
        logger.error(f"seed_jobs.json not found at {seed_path}")
        return

    # Load any scraped data
    scraped_path = DATA_DIR / "scraped_jobs.json"
    if scraped_path.exists():
        scraped = load_jobs(scraped_path)
        logger.info(f"Loaded {len(scraped)} scraped jobs")
        jobs.extend(scraped)

    index_jobs(jobs)
    logger.info("Indexing complete!")


if __name__ == "__main__":
    main()
