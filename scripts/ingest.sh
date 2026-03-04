#!/bin/bash
set -e

echo "=== RoleGPT Ingestion Pipeline ==="
cd "$(dirname "$0")/../backend"

echo "→ Running scrapers..."
python -c "
import json, sys, logging
logging.basicConfig(level=logging.INFO)
from scraper.hackernews import scrape as scrape_hn
from scraper.arbeitnow import scrape as scrape_arb
from scraper.remotive import scrape as scrape_rem

jobs = []
jobs += scrape_hn(limit=30)
jobs += scrape_arb(limit=50)
jobs += scrape_rem(limit=50)

with open('data/scraped_jobs.json', 'w') as f:
    json.dump(jobs, f, indent=2)

print(f'Scraped {len(jobs)} total jobs → data/scraped_jobs.json')
"

echo "→ Re-indexing all jobs..."
python indexer.py

echo "=== Ingestion complete! ==="
