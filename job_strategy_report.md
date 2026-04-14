# Direct — Job Sources & Collection Strategy Report

**Generated:** 2026-04-03
**Project:** Direct (Semantic Job Search Engine)
**Repo:** https://github.com/aravindg24/Job-Search-Engine

---

## Table of Contents

1. [Current Job Sources](#1-current-job-sources)
2. [Current Collection Architecture](#2-current-collection-architecture)
3. [Current Storage Architecture](#3-current-storage-architecture)
4. [Pain Points & Limitations](#4-pain-points--limitations)
5. [Recommended Job Sources](#5-recommended-job-sources)
6. [Better Collection Strategy](#6-better-collection-strategy)
7. [Better Storage Strategy](#7-better-storage-strategy)
8. [Tools & Libraries Worth Adopting](#8-tools--libraries-worth-adopting)

---

## 1. Current Job Sources

### 1.1 Free Public APIs (no auth required)

| Source | File | Volume | Notes |
|--------|------|--------|-------|
| **Arbeitnow** | `scraper/arbeitnow.py` | 50 jobs/run | General tech, EU-heavy |
| **Remotive** | `scraper/remotive.py` | 50 remote jobs/run | software-dev category hardcoded, all remote |

### 1.2 ATS Public Job Board APIs

| Source | File | Volume | Companies |
|--------|------|--------|-----------|
| **Greenhouse** | `scraper/greenhouse.py` | 16 × 20 = 320 jobs | Anthropic, Stripe, Vercel, Databricks, Figma, Cloudflare, Brex, Pinterest, Twilio, Elastic, Airbnb, DoorDash, Twitch, Airtable, Asana, Scale AI |
| **Ashby** | `scraper/ashby.py` | 29 × 20 = 580 jobs | OpenAI, Cohere, Perplexity, Ramp, Linear, Notion, Plaid, Supabase, Airbyte, Confluent, Modal, Anyscale, Harvey, Cursor, Replit, Dust, Weaviate, LangChain, Wispr Flow, Jerry.ai, Juicebox, Vanta, Mercury, Baseten, Deepgram, Pika, Nabla, Retool, Snyk |
| **Lever** | `scraper/lever.py` | 1 × 20 = 20 jobs | Anyscale only |

### 1.3 Scraped/Parsed Sources

| Source | File | Volume | Notes |
|--------|------|--------|-------|
| **SimplifyJobs GitHub** | `scraper/simplify_github.py` | Variable | Parses README.md markdown table; new-grad SWE only; 7-day filter |
| **HackerNews "Who's Hiring"** | `scraper/hackernews.py` | Up to 50 | Top 50 comments from monthly thread; fragile pipe-separated parsing |

### 1.4 Static Seed Data

| Source | File | Volume | Notes |
|--------|------|--------|-------|
| **seed_jobs.json** | `data/seed_jobs.json` | 1,463 jobs | Hand-curated; startup-focused; contains salary + company stage; not auto-refreshed |

### 1.5 Estimated Total per Run

| Layer | Jobs (approx) |
|-------|---------------|
| Seed | 1,463 (static, deduplicated) |
| Arbeitnow | 50 |
| Remotive | 50 |
| Greenhouse | ~320 |
| Ashby | ~580 |
| Lever | ~20 |
| SimplifyJobs | ~20–80 |
| HackerNews | ~50 |
| **Total (post-dedup)** | **~2,500–2,600** |

---

## 2. Current Collection Architecture

### 2.1 Orchestration

`backend/indexer.py` runs the full pipeline:

```
load_seed_jobs()
  + load_scraped_jobs()  ← all 7 scrapers, try/except around each
  → dedup()             ← MD5 hash of source_url (or fallback to id)
  → stamp_indexed_at()  ← ISO timestamp on each job
  → index_jobs()        ← embed + upsert to Qdrant (50-job chunks)
  → delete_old_jobs()   ← remove indexed_at < (now - JOB_RETENTION_DAYS)
```

### 2.2 Scheduling

- **Trigger:** GitHub Actions cron — `0 * * * *` (every hour at :00 UTC)
- **File:** `.github/workflows/ingest.yml`
- **Concurrency:** Cancels previous run if still in progress
- **Timeout:** 25 minutes hard limit
- **Retention:** `JOB_RETENTION_DAYS=2` (48 hours, set in workflow env)

### 2.3 Embedding

- **Model:** `BAAI/bge-small-en-v1.5` (384 dimensions, ONNX via fastembed, ~33 MB)
- **Text built as:** `title | company | location | description | requirements | tags`
- **Chunking:** 50 jobs/batch with explicit `gc.collect()` between chunks (RAM workaround for Render 512 MB free tier)

### 2.4 Rate Limiting

- ATS scrapers (Greenhouse, Ashby, Lever): 0.3-second sleep between company requests
- No retry logic, no backoff
- No per-source quotas or circuit breakers

---

## 3. Current Storage Architecture

### 3.1 Qdrant (Vector Search Index)

| Property | Value |
|----------|-------|
| Collection | `jobs` |
| Vector dims | 384 (cosine similarity) |
| ID format | UUID5 from job string ID |
| Retention | 2 days (production) |
| Payload index | `indexed_at` with DATETIME index |
| Hosting | Qdrant Cloud (prod), in-memory (dev) |

**Payload schema per job:**

```json
{
  "id": "string",
  "title": "string",
  "company": "string",
  "location": "string",
  "remote": "bool",
  "description": "string",
  "requirements": "string",
  "salary_range": "string | null",
  "company_stage": "string | null",
  "source": "string",
  "source_url": "string",
  "posted_date": "string | null",
  "tags": ["string"],
  "indexed_at": "ISO datetime string"
}
```

### 3.2 Supabase / PostgreSQL (User State)

| Table | Purpose |
|-------|---------|
| `resume_profiles` | Parsed resume per user (raw text + JSONB profile) |
| `tracked_jobs` | Application tracker (status, notes, pitch, score) |
| `watch_preferences` | Alert settings (min score, keywords, locations, stages) |
| `search_history` | Last N queries per user |

### 3.3 File Storage (Local / Ephemeral)

| File | Purpose |
|------|---------|
| `data/seed_jobs.json` | Static baseline jobs |
| `data/company_boards.json` | ATS company slug registry |
| `data/scraped_jobs.json` | Optional local cache from `refresh_jobs.py` |

---

## 4. Pain Points & Limitations

### 4.1 Critical

| # | Issue | Impact |
|---|-------|--------|
| 1 | **2-day retention window** — jobs older than 48h are deleted | Users miss listings; no historical search |
| 2 | **Full re-index every run** — no incremental indexing | Wastes API quota; repeats same scraping work each hour |
| 3 | **Weak deduplication** — MD5 of `source_url` only | Same job from two sources creates two vectors |
| 4 | **No retry/backoff** — scraper failure silently drops source | 0 jobs indexed if multiple scrapers fail simultaneously |
| 5 | **Seed data stagnant** — 1,463 hand-curated jobs never refreshed | Increasingly stale; active job listings may be expired |

### 4.2 Coverage Gaps

| # | Issue | Impact |
|---|-------|--------|
| 6 | **Lever: only 1 company** (Anyscale) | Major gap in coverage — Lever is widely used by mid-stage startups |
| 7 | **No general job board** (LinkedIn, Indeed, Glassdoor) | Missing the largest job volumes |
| 8 | **company_stage missing on ATS jobs** | Watch preferences filter by stage but field is always null for scraped jobs |
| 9 | **salary_range missing on most sources** | Only seed data and Remotive have salary; limits useful filtering |

### 4.3 Scraper Brittleness

| # | Issue | Impact |
|---|-------|--------|
| 10 | **SimplifyJobs depends on GitHub README HTML structure** | Breaks silently if markdown format changes |
| 11 | **HackerNews assumes pipe-separated comment format** | Most comments aren't pipe-separated; low signal quality |
| 12 | **No monitoring/alerting on scraper failures** | No way to know when a source goes down |

### 4.4 Storage Limitations

| # | Issue | Impact |
|---|-------|--------|
| 13 | **Location not normalized** ("SF" vs "San Francisco" vs "San Francisco, CA") | Location filtering unreliable |
| 14 | **Remote status extracted from keyword matching** | False positives/negatives |
| 15 | **No job status tracking** (is it still live?) | Qdrant may serve expired job listings |
| 16 | **Qdrant payload not versioned** — schema changes break old payloads | Risky to evolve schema |

### 4.5 Infrastructure

| # | Issue | Impact |
|---|-------|--------|
| 17 | **Render free tier = 512 MB RAM** — constrains batch sizes, concurrency | Limits embedding model upgrades and concurrent load |
| 18 | **No job count alerting** — can't detect when indexing produces 0 jobs | Silent failures go unnoticed |
| 19 | **Digest doesn't use LLM re-ranking** — RAM pressure tradeoff | Less personalized digest results |

---

## 5. Recommended Job Sources

### 5.1 High-Priority Additions

#### 5.1.1 Workable Public API
- **URL:** `https://jobs.workable.com/api/v1/jobs` (public, no auth)
- **Volume:** Thousands of jobs, global
- **Why:** Free API, structured JSON, widely used by mid-size startups, includes salary data
- **Effort:** Low — similar to Arbeitnow pattern

#### 5.1.2 Jobicy API
- **URL:** `https://jobicy.com/api/v2/remote-jobs`
- **Volume:** 100–500 remote jobs
- **Why:** Free, JSON API, remote-first tech jobs, salary ranges included, no rate limiting
- **Effort:** Very low

#### 5.1.3 Expand Lever Coverage
- **Current:** 1 company (Anyscale)
- **Target:** 50–100 companies (Lever is used by Figma, Coinbase, Netflix, Reddit, Shopify, etc.)
- **URL pattern:** `https://api.lever.co/v0/postings/{slug}?mode=json`
- **Why:** Huge gap — Lever is one of the three dominant ATS platforms alongside Greenhouse and Ashby
- **Effort:** Zero code changes needed — just add slugs to `company_boards.json`
- **Source for slugs:** [Lever's job board directory](https://jobs.lever.co)

#### 5.1.4 Expand Greenhouse & Ashby Company Lists
- **Greenhouse target additions:** Stripe, Lyft, Square, Instacart, GitHub, Dropbox, Okta, Zendesk, Snowflake, Confluent, MongoDB (already missing from current 16)
- **Ashby target additions:** Growing list of AI/ML companies — Mistral, Together AI, Groq, ElevenLabs, Imbue, Inflection, Character.ai, Weights & Biases, Hugging Face
- **Effort:** Zero code changes — add slugs to `company_boards.json`

#### 5.1.5 The Muse API
- **URL:** `https://www.themuse.com/api/public/jobs`
- **Volume:** Thousands of jobs
- **Why:** Free tier available, company culture data, good for filtered tech roles
- **Effort:** Low

#### 5.1.6 Otta (Welcome to the Jungle) API
- **URL:** `https://api.otta.com/graphql` (limited public access)
- **Volume:** Tech-startup focused
- **Why:** High-quality company profiles, equity + salary data, startup-stage metadata
- **Effort:** Medium — GraphQL API, may need account

### 5.2 Medium-Priority Additions

#### 5.2.1 SimplifyJobs Internship Positions
- **URL:** `https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/README.md`
- **Why:** Same scraper pattern already works; adds intern positions with zero new code
- **Effort:** Very low — add a second URL call in `simplify_github.py`

#### 5.2.2 Y Combinator Jobs
- **URL:** `https://www.ycombinator.com/jobs` (scrape or via Workable/Ashby)
- **Why:** High-signal YC companies, startup stage well-known (early), equity data
- **Effort:** Medium — may need HTML scraping

#### 5.2.3 AngelList / Wellfound
- **URL:** `https://wellfound.com/jobs`
- **Why:** Best source for seed/Series A startup jobs with equity info and company stage
- **Effort:** Medium-high — no public API; requires Selenium or Playwright for JS-rendered page

#### 5.2.4 Remote OK RSS
- **URL:** `https://remoteok.com/remote-jobs.rss`
- **Why:** Free RSS feed, remote-only, tech-focused, real-time, minimal parsing
- **Effort:** Very low — add RSS parser (feedparser library, ~50 lines)

#### 5.2.5 LinkedIn Public Job Search (Unofficial)
- **URL:** `https://www.linkedin.com/jobs/search/?keywords=...&f_TPR=r3600`
- **Why:** Largest job volume; not filterable otherwise
- **Effort:** High — JS-rendered, IP blocks, requires Playwright + proxy rotation
- **Risk:** ToS restrictions; not recommended for production indexing without scraping service

### 5.3 Source Priority Matrix

| Source | Volume | Quality | Effort | Recommended? |
|--------|--------|---------|--------|--------------|
| Expand Lever slugs | +500/run | High | None | **Yes — do now** |
| Expand Greenhouse/Ashby slugs | +500/run | High | None | **Yes — do now** |
| Jobicy API | +200/run | High (remote) | Very Low | **Yes** |
| Remote OK RSS | +200/run | High (remote) | Very Low | **Yes** |
| Workable API | +500/run | Medium | Low | **Yes** |
| SimplifyJobs Internships | +50/run | High (targeted) | Very Low | **Yes** |
| The Muse API | +300/run | Medium | Low | **Yes** |
| YC Jobs | +100/run | Very High | Medium | **Yes** |
| Wellfound/AngelList | +500/run | Very High | High | **Later** |
| LinkedIn | +10,000/run | Very High | Very High | **No (ToS risk)** |

---

## 6. Better Collection Strategy

### 6.1 Incremental Indexing (Avoid Re-scraping Known Jobs)

**Current problem:** Every hourly run re-scrapes every source, re-embeds all jobs, upserts duplicates.

**Fix:** Track a `last_fetched_at` timestamp per source. Only fetch new jobs since that timestamp.

```python
# backend/data/scraper_state.json (or Supabase table)
{
  "arbeitnow": "2026-04-03T10:00:00Z",
  "remotive": "2026-04-03T10:00:00Z",
  "greenhouse_anthropic": "2026-04-03T09:00:00Z"
  ...
}
```

For ATS APIs that support `?updated_after=` or `?page=1` with `created_at` sorting, skip jobs already in Qdrant by checking `source_url` before embedding.

**Impact:** Reduces embedding work by ~90% per run; reduces API load on ATS boards.

### 6.2 Smarter Deduplication

**Current:** MD5 of `source_url` only.
**Problem:** Same job posted on Greenhouse and LinkedIn creates two vectors. HackerNews IDs collide.

**Better approach — three-level dedup:**

```
Level 1: Exact ID match (source_url hash) — current
Level 2: Title + company + location fuzzy match (Levenshtein distance < 10)
Level 3: Near-duplicate vector detection (cosine similarity > 0.98 on existing index)
```

For Level 2, use `rapidfuzz` (fast Python fuzzy matching):

```python
from rapidfuzz import fuzz
def is_near_duplicate(job_a, job_b):
    key = lambda j: f"{j['title']} {j['company']}"
    return fuzz.ratio(key(job_a), key(job_b)) > 90
```

For Level 3, query Qdrant before upsert: if nearest neighbor score > 0.98, skip.

### 6.3 Retry Logic & Exponential Backoff

**Current:** One attempt per source, failures silently ignored.

```python
# Proposed wrapper (using tenacity)
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
def fetch_source(scraper_fn):
    return scraper_fn()
```

Add to `indexer.py` around each `load_scraped_jobs()` call.

### 6.4 Health Metrics & Alerting

After each indexing run, log (or store) per-source metrics:

```python
stats = {
  "source": "greenhouse",
  "jobs_fetched": 312,
  "jobs_indexed": 298,
  "jobs_skipped_dedup": 14,
  "errors": 0,
  "duration_seconds": 8.3,
  "run_at": "2026-04-03T10:00:00Z"
}
```

Store in a `ingest_runs` Supabase table. Add a GitHub Actions step to alert (via Slack webhook or GitHub issue) if `jobs_indexed == 0` or `errors > 0`.

This immediately solves the "silent failure" problem.

### 6.5 Configurable Fetch Limits & Scheduling

Move magic numbers out of scraper code into a config file:

```json
// backend/data/scraper_config.json
{
  "arbeitnow": { "enabled": true, "limit": 100, "cron": "*/30 * * * *" },
  "remotive": { "enabled": true, "limit": 100, "cron": "0 * * * *" },
  "greenhouse": { "enabled": true, "per_company_limit": 50, "cron": "0 */2 * * *" },
  "simplify_github": { "enabled": true, "days_back": 14, "cron": "0 */6 * * *" },
  "hackernews": { "enabled": false, "comment_limit": 100 }
}
```

Different sources warrant different polling frequencies:
- **Arbeitnow/Remotive:** Every 30 minutes (high turnover, fast API)
- **Greenhouse/Ashby/Lever:** Every 2 hours (lower turnover, rate limit respect)
- **SimplifyJobs:** Every 6 hours (GitHub README doesn't change that fast)
- **HackerNews:** Once per month (monthly thread only)

### 6.6 Location Normalization

Replace keyword-based remote detection with structured parsing:

```python
REMOTE_KEYWORDS = {"remote", "anywhere", "distributed", "wfh", "work from home"}
LOCATION_MAP = {
    "sf": "San Francisco, CA",
    "nyc": "New York, NY",
    "la": "Los Angeles, CA",
    "dc": "Washington, DC"
}

def normalize_location(raw: str) -> tuple[str, bool]:
    lower = raw.lower()
    is_remote = any(k in lower for k in REMOTE_KEYWORDS)
    canonical = LOCATION_MAP.get(lower.strip(), raw.strip().title())
    return canonical, is_remote
```

For a more robust solution, use `pycountry` + a city geocoding library like `geopy` to normalize to (city, state, country) tuples.

### 6.7 Retire or Auto-Refresh Seed Data

**Option A (Recommended):** Delete `seed_jobs.json`. The ATS scrapers now cover all the same companies. The 1,463 jobs are almost certainly expired.

**Option B:** Script to refresh seed data from the same Greenhouse/Ashby companies but save to `seed_jobs.json` — then use it only as a local development cache, not production.

### 6.8 HackerNews Scraper Rework

The current pipe-based parser works on very few comments. Replace with a structured extraction approach:

```python
# Use Gemini/Cerebras to parse HN comments into structured jobs
def parse_hn_comment(text: str) -> dict | None:
    prompt = f"""Extract job info from this HN Who's Hiring comment.
    Return JSON: {{title, company, location, remote, description, url}}
    If not a job posting, return null.
    Comment: {text[:1000]}"""
    ...
```

This converts unreliable regex parsing into a high-quality structured extraction.

---

## 7. Better Storage Strategy

### 7.1 Extend Job Retention Window

**Current:** 2 days.
**Proposed:** 14 days.

Most job postings are open for 2–6 weeks. 2-day retention means:
- Users checking every other day miss listings
- Digest results go stale quickly
- Historical "recently indexed" queries don't work

On Qdrant Cloud free tier (~1 GB), with ~2,500 jobs × 384 floats × 4 bytes ≈ 3.8 MB of vectors plus payload overhead (~1 KB/job = 2.5 MB) → 7–8 MB/day → 14 days ≈ ~100 MB. Well within free tier limits.

**Action:** Change `JOB_RETENTION_DAYS` from 2 to 14 in `.github/workflows/ingest.yml`.

### 7.2 Store Jobs in Supabase (Persistent Relational Layer)

Currently, jobs exist _only_ in Qdrant and are deleted after 2 days. This means:
- No historical analytics
- No "is this job still live?" tracking
- No per-job metadata enrichment (company info, salary intelligence)

**Add a `jobs` table to Supabase:**

```sql
CREATE TABLE jobs (
  id           TEXT PRIMARY KEY,             -- UUID5 from source_url
  title        TEXT NOT NULL,
  company      TEXT NOT NULL,
  location     TEXT,
  remote       BOOLEAN DEFAULT false,
  description  TEXT,
  requirements TEXT,
  salary_min   INTEGER,
  salary_max   INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  company_stage TEXT,                         -- seed, series-a, series-b, etc.
  source       TEXT NOT NULL,                -- arbeitnow, greenhouse, etc.
  source_url   TEXT UNIQUE,
  posted_date  TIMESTAMPTZ,
  indexed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active    BOOLEAN DEFAULT true,          -- false = expired/removed
  tags         TEXT[] DEFAULT '{}'
);

CREATE INDEX ON jobs(company);
CREATE INDEX ON jobs(source);
CREATE INDEX ON jobs(indexed_at);
CREATE INDEX ON jobs(last_seen_at);
CREATE INDEX ON jobs(is_active);
```

**Benefits:**
- Soft-delete (set `is_active=false`) rather than hard-delete — preserves tracked_jobs FK references
- `last_seen_at` lets you detect expired postings (if a job wasn't seen in last 3 runs, mark inactive)
- Historical analytics: how many jobs indexed per day, per source, per company
- Joins with `tracked_jobs` for richer application tracking

### 7.3 Normalize Salary into Structured Fields

**Current:** `salary_range` is a free-text string (e.g., `"$120k–$150k"`).

**Proposed:** Parse into min/max integer fields at ingest time:

```python
import re

def parse_salary(text: str | None) -> tuple[int | None, int | None]:
    if not text:
        return None, None
    nums = [int(n.replace(',', '')) for n in re.findall(r'\$?([\d,]+)k?', text, re.I)]
    if len(nums) == 1:
        v = nums[0] * 1000 if nums[0] < 1000 else nums[0]
        return v, v
    if len(nums) >= 2:
        lo, hi = sorted(nums[:2])
        lo = lo * 1000 if lo < 1000 else lo
        hi = hi * 1000 if hi < 1000 else hi
        return lo, hi
    return None, None
```

Store `salary_min` + `salary_max` integers in both Supabase and Qdrant payload. Enables:
- Filter: `salary_min >= 150000`
- Sort: `ORDER BY salary_min DESC`
- Qdrant numeric range filter for salary-gated search

### 7.4 Company Stage Enrichment

**Current:** Only seed data has `company_stage`. ATS jobs return `None`.

**Proposed approach — static mapping file:**

```json
// backend/data/company_stages.json
{
  "openai": "growth",
  "anthropic": "growth",
  "cohere": "series-c",
  "perplexity": "series-b",
  "ramp": "series-d",
  "linear": "series-b",
  "notion": "ipo-candidate",
  "stripe": "late-stage",
  "airbnb": "public",
  "databricks": "late-stage"
}
```

Lookup at index time: `stage = COMPANY_STAGES.get(company.lower())`.

For dynamic enrichment, use the Crunchbase Basic API (free tier) to fetch funding round data.

### 7.5 Add Qdrant Payload Indexes for Filtering

Currently only `indexed_at` is indexed. Add:

```python
client.create_payload_index("jobs", "company", PayloadSchemaType.KEYWORD)
client.create_payload_index("jobs", "location", PayloadSchemaType.KEYWORD)
client.create_payload_index("jobs", "remote", PayloadSchemaType.BOOL)
client.create_payload_index("jobs", "salary_min", PayloadSchemaType.INTEGER)
client.create_payload_index("jobs", "company_stage", PayloadSchemaType.KEYWORD)
client.create_payload_index("jobs", "source", PayloadSchemaType.KEYWORD)
```

These enable fast pre-filtering before vector search, dramatically improving query speed for filtered queries (e.g., "remote Python jobs at Series A companies paying > $150k").

### 7.6 Caching Layer for Frequent Queries

Digest and gap analysis run the same embedded query on every request. Add a short TTL cache:

```python
from functools import lru_cache
from datetime import datetime, timedelta

_cache: dict[str, tuple[list, datetime]] = {}
CACHE_TTL = timedelta(minutes=15)

def cached_search(query_vec_hash: str, fn, *args):
    entry = _cache.get(query_vec_hash)
    if entry and datetime.utcnow() - entry[1] < CACHE_TTL:
        return entry[0]
    result = fn(*args)
    _cache[query_vec_hash] = (result, datetime.utcnow())
    return result
```

Or use Redis (via `redis-py` or Upstash Redis free tier) for a persistent, shared cache across API instances.

### 7.7 Job Schema Versioning in Qdrant

Add a `schema_version` field to every Qdrant payload:

```python
job["schema_version"] = 2  # increment when payload shape changes
```

Filter old-schema documents during migration:

```python
client.scroll("jobs", scroll_filter=Filter(
    must_not=[FieldCondition("schema_version", MatchValue(2))]
))
```

This makes schema evolution safe without full re-indexing.

---

## 8. Tools & Libraries Worth Adopting

### 8.1 Data Collection

| Library | Purpose | Why |
|---------|---------|-----|
| `feedparser` | RSS/Atom feed parsing | Adds Remote OK, Stack Overflow Jobs with ~10 lines |
| `tenacity` | Retry with exponential backoff | Replaces bare try/except, handles transient failures |
| `playwright` | Headless browser scraping | For JS-rendered pages (Wellfound, YC) when needed |
| `httpx` (already in deps) | Async HTTP client | Replace `requests` with `httpx.AsyncClient` for concurrent scraping |
| `rapidfuzz` | Fast fuzzy string matching | Level-2 deduplication (title+company similarity) |

### 8.2 Data Normalization

| Library | Purpose | Why |
|---------|---------|-----|
| `pycountry` | Country/city normalization | Standardize location strings |
| `geopy` | Geocoding | Convert "SF" → (37.77, -122.42) for geo-filtering |
| `python-dateutil` | Date parsing | Handles the variety of date formats across scrapers |

### 8.3 Scheduling & Orchestration

| Tool | Purpose | Why |
|------|---------|-----|
| **GitHub Actions** (current) | Hourly cron | Already in use — extend with per-source crons |
| **Prefect** or **Dagster** | Workflow orchestration | If complexity grows; retry logic, alerting, observability |
| **Upstash Redis** | Distributed caching | Free tier, serverless Redis for caching search results |

### 8.4 Monitoring

| Tool | Purpose | Why |
|------|---------|-----|
| **Sentry** (free tier) | Error tracking | Catch silent scraper failures with stack traces + alerts |
| **Betterstack** / **UptimeRobot** | Uptime monitoring | Alert when `/api/health` returns 0 jobs |
| **Supabase Analytics** | Query performance | Free, built-in — monitor slow queries |

### 8.5 Embedding Model Upgrade Path

| Model | Dims | Size | Quality | Notes |
|-------|------|------|---------|-------|
| `BAAI/bge-small-en-v1.5` (current) | 384 | 33 MB | Good | ONNX via fastembed |
| `BAAI/bge-base-en-v1.5` | 768 | 110 MB | Better | Too large for 512 MB free tier |
| `nomic-embed-text-v1.5` | 768 | 80 MB | Better | Available in fastembed |
| `all-MiniLM-L6-v2` | 384 | 22 MB | Comparable | Slightly faster, smaller |

**Recommendation:** Stay with `bge-small-en-v1.5` until moving off the Render free tier. On a paid instance (1 GB RAM), upgrade to `nomic-embed-text-v1.5` for better semantic quality.

---

## Summary of Recommended Actions

### Do Now (Zero Code / Config-Only)
1. Add 50+ Lever company slugs to `company_boards.json` — massive coverage increase
2. Add 20+ Greenhouse company slugs (MongoDB, Snowflake, Dropbox, etc.)
3. Add 20+ Ashby company slugs (Groq, ElevenLabs, Mistral, etc.)
4. Change `JOB_RETENTION_DAYS` from 2 to 14 in `.github/workflows/ingest.yml`

### Do Soon (Low Effort, High Value)
5. Add Jobicy API scraper (~60 lines, same pattern as Arbeitnow)
6. Add Remote OK RSS scraper (~50 lines using `feedparser`)
7. Add `tenacity` retry wrapper in `indexer.py`
8. Add per-source metrics logging to a Supabase `ingest_runs` table
9. Add SimplifyJobs internship URL as second call in `simplify_github.py`

### Medium Term (Schema/Architecture)
10. Add `jobs` table to Supabase for persistent job storage with soft deletes
11. Parse salary into `salary_min` / `salary_max` integer fields
12. Add Qdrant payload indexes for company, location, salary_min, remote, company_stage
13. Add `company_stages.json` static mapping for known companies
14. Add Level-2 deduplication using `rapidfuzz`

### Long Term (Significant Effort)
15. Rewrite `indexer.py` to use incremental indexing (skip already-indexed jobs)
16. Replace HackerNews regex parser with LLM-based structured extraction
17. Add Sentry for scraper error tracking
18. Add Wellfound scraper using Playwright (best source for early-stage startup equity jobs)
19. Normalize locations using `pycountry`/`geopy`

---

*Report generated by codebase analysis of D:\Role\ on 2026-04-03*
