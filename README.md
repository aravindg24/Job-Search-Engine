# Direct — Fast-track your job search.

> A semantic job search engine and command center. Upload your resume once, describe what you want in plain English, and get AI-ranked matches with explanations, gap analysis, tailored pitches, and application tracking.

**Live:** [direct-jobs.vercel.app](https://job-search-engine-eta.vercel.app/) &nbsp;·&nbsp; **Backend:** Render &nbsp;·&nbsp; **Auth:** Supabase

---

## What It Does

**Direct** finds roles by fit — not keywords. It understands who you are from your resume and matches meaning, not exact words.

| Feature | Description |
|---|---|
| **Resume-aware search** | Upload your PDF once; every search is automatically enriched with your profile context |
| **Semantic matching** | BAAI/bge embeddings + Qdrant vector search — "ML Engineer" queries surface "Software Engineer" roles at AI companies |
| **AI match scores** | Cerebras LLM re-ranks results and explains why each role fits (or doesn't), with strengths and gaps |
| **Skill gap analysis** | See which skills your top matches demand that you're missing, with a strategic one-line insight |
| **Pitch generator** | 3-format AI pitches (cover letter hook, cold email, why interested) mapped to the specific JD |
| **Application tracker** | Kanban board — Saved / Applied / Interviewing / Offered / Rejected |
| **Watch mode / digest** | Set preferences and check for new high-match jobs since your last visit |
| **Multi-user auth** | Supabase Auth + JWT middleware — every user's resume, tracker, and preferences are completely private |

---

## Architecture

```
Resume PDF → extract (PyMuPDF) → parse (Cerebras LLM) → profile stored in Supabase
                                                                  ↓
Query + resume context → embed (BAAI/bge-small-en-v1.5) → Qdrant Cloud vector search (top-20)
                                                                  ↓
                                          Cerebras LLM re-rank + explain (llama3.1-8b)
                                                                  ↓
                                          Ranked results with match scores + reasons + gaps
```

Two-stage retrieval: fast vector recall (Qdrant) → precise LLM scoring (Cerebras).
BGE asymmetric embeddings: query prefix `"Represent this job search query…"` for queries, plain text for job documents.

---

## Tech Stack

| Layer        | Technology                                       |
|--------------|--------------------------------------------------|
| Frontend     | React 18 + Vite + TailwindCSS + React Router v6  |
| Backend      | FastAPI (Python 3.11)                            |
| Embeddings   | `BAAI/bge-small-en-v1.5` (384-dim, baked into Docker image) |
| Vector DB    | Qdrant Cloud (cosine, 384 dims)                  |
| LLM          | Cerebras `llama3.1-8b` — fast inference, pay-per-use |
| Auth         | Supabase Auth + PyJWT middleware (HS256)         |
| State DB     | Supabase (resume profiles, tracker, watch prefs) |
| Hosting      | Vercel (frontend) + Render (backend)             |
| Job ingestion| GitHub Actions cron — daily 6 AM UTC             |

---

## Data Sources

Jobs are scraped daily and indexed into Qdrant:

| Source | Notes |
|---|---|
| **SimplifyJobs** (GitHub) | New-grad positions, filtered to last 7 days, with direct apply URLs |
| **Remotive** | Remote-first tech roles |
| **Arbeitnow** | International tech jobs |
| **HN Who's Hiring** | Monthly Hacker News hiring threads |
| **Seed data** | 50+ curated roles from Anthropic, Perplexity, Vercel, Linear, Ramp, Modal, etc. |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- [Cerebras API key](https://cloud.cerebras.ai)
- [Supabase](https://supabase.com) project
- [Qdrant Cloud](https://cloud.qdrant.io) cluster (free tier)

### 1. Clone & install

```bash
git clone https://github.com/aravindg24/Job-Search-Engine
cd Job-Search-Engine
```

```bash
# Backend
cd backend
pip install -r requirements.txt
```

```bash
# Frontend
cd frontend
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
CEREBRAS_API_KEY=your_cerebras_api_key
CEREBRAS_MODEL=llama3.1-8b

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
SUPABASE_JWT_SECRET=your-jwt-secret   # Settings → API → JWT → Legacy JWT Secret

QDRANT_CLOUD_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION=jobs

CORS_ORIGINS=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_URL=http://localhost:8000
```

### 3. Set up Supabase

Run `supabase_schema.sql` in your [Supabase SQL editor](https://supabase.com/dashboard/project/_/sql).
This creates the tables (`resume_profiles`, `tracked_jobs`, `watch_preferences`, `search_history`) with RLS policies.

### 4. Seed job data & run

```bash
# Terminal 1 — Backend
cd backend
python indexer.py        # embed + index seed jobs into Qdrant
uvicorn app:app --reload # API at http://localhost:8000

# Terminal 2 — Frontend
cd frontend
npm run dev              # UI at http://localhost:5173
```

Open `http://localhost:5173` → sign up → go to **Profile** → upload your resume → **Search**.

### Ingest fresh job data

```bash
python scripts/refresh_jobs.py
```

Pulls from SimplifyJobs (7-day filter), Remotive, Arbeitnow, and HN Who's Hiring, then re-indexes into Qdrant.

### Docker (full stack)

```bash
cp backend/.env.example backend/.env
# Fill in all env vars
docker compose up
# UI at http://localhost:5173
```

---

## Deployment

| Service | Config |
|---|---|
| **Render** (backend) | `render.yaml` in root — auto-deploys on push to `main` |
| **Vercel** (frontend) | Root directory: `frontend`, framework: Vite |
| **GitHub Actions** | `.github/workflows/ingest.yml` — daily cron at 6 AM UTC |

Required env vars on Render: `CEREBRAS_API_KEY`, `CEREBRAS_MODEL`, `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_JWT_SECRET`, `QDRANT_CLOUD_URL`, `QDRANT_API_KEY`, `QDRANT_COLLECTION`, `CORS_ORIGINS`.

Required env vars on Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.

---

## API Reference

All endpoints (except `/api/health`) require `Authorization: Bearer <supabase_jwt>`.

```
POST /api/search          — semantic search with resume context
POST /api/explain         — detailed match breakdown for a job
POST /api/resume/upload   — parse and store resume PDF
GET  /api/resume/profile  — fetch parsed resume profile
POST /api/pitch           — generate tailored pitch (cover_letter_hook | cold_email | why_interested)
GET  /api/gaps            — aggregate skill gap analysis across top matches
POST /api/track           — save/update application status
GET  /api/track           — get all tracked applications with stats
DELETE /api/track/{id}    — remove from tracker
POST /api/watch           — save watch preferences
GET  /api/watch           — get current watch preferences
GET  /api/digest          — new matches since last check
POST /api/digest/refresh  — re-scrape and re-index jobs
GET  /api/health          — health check
```

---

## Project Structure

```
direct/
├── backend/
│   ├── app.py              # All FastAPI endpoints + JWT middleware
│   ├── config.py           # Settings + env vars (Pydantic BaseSettings)
│   ├── models.py           # Pydantic request/response schemas
│   ├── database.py         # Supabase CRUD helpers (all user-scoped)
│   ├── indexer.py          # Embed + index pipeline
│   ├── Dockerfile          # Bakes BGE model at build time
│   ├── search/
│   │   ├── embedder.py     # BAAI/bge-small-en-v1.5 wrapper (asymmetric prefixes)
│   │   ├── vector_store.py # Qdrant Cloud client + payload index
│   │   ├── reranker.py     # Cerebras LLM re-ranking + explanation
│   │   ├── pipeline.py     # Search orchestrator
│   │   └── gaps.py         # Gap analysis logic
│   ├── resume/
│   │   ├── parser.py       # PyMuPDF text extraction (in-memory, no disk write)
│   │   └── profiler.py     # LLM structured profile parsing
│   ├── pitch/
│   │   └── generator.py    # Pitch generation (3 types)
│   ├── scraper/
│   │   ├── simplify_github.py  # SimplifyJobs GitHub README (7-day filter)
│   │   ├── hackernews.py       # HN Who's Hiring scraper
│   │   ├── arbeitnow.py        # Arbeitnow API
│   │   └── remotive.py         # Remotive API
│   └── data/
│       └── seed_jobs.json  # Curated seed jobs (Anthropic, Perplexity, Vercel, Linear, etc.)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.jsx     # Public marketing page
│       │   ├── FeaturesPage.jsx    # /features — feature deep-dives
│       │   ├── HowItWorksPage.jsx  # /how-it-works — 5-step guide
│       │   ├── LoginPage.jsx       # Sign in / Sign up
│       │   ├── SearchPage.jsx      # Main search (protected)
│       │   ├── JobDetailPage.jsx   # Job detail + pitch generator (protected)
│       │   ├── DashboardPage.jsx   # Gaps + tracker + digest (protected)
│       │   └── ProfilePage.jsx     # Resume profile + watch settings (protected)
│       ├── components/
│       │   ├── layout/
│       │   │   ├── PublicNav.jsx   # Shared nav for public pages
│       │   │   └── Header.jsx      # App nav (authenticated)
│       │   ├── search/             # SearchBar, ResultCard, SkillTag, etc.
│       │   ├── job/                # MatchBreakdown, PitchGenerator, JobDescription
│       │   ├── dashboard/          # GapChart, TrackerBoard, DigestPanel
│       │   ├── profile/            # ResumeUpload, ParsedProfile, WatchSettings
│       │   └── shared/             # AuthGuard, Toast, Modal, MatchBadge
│       ├── hooks/                  # useSearch, useResume, useTracker, useAuth, useTheme
│       └── utils/
│           ├── api.js              # Axios wrapper + Supabase JWT interceptor
│           └── supabase.js         # Supabase client
├── scripts/
│   ├── setup.sh            # One-command setup
│   ├── ingest.sh           # Run scrapers + re-index
│   └── refresh_jobs.py     # Standalone job refresh (used by GitHub Actions cron)
├── .github/
│   └── workflows/
│       └── ingest.yml      # Daily cron: 6 AM UTC — scrape + index
├── render.yaml             # Render deployment config
├── supabase_schema.sql     # Tables + RLS policies — run in Supabase SQL editor
└── docker-compose.yml      # Full stack (backend + frontend)
```

---

## Design

Clean, editorial, purposeful — Linear meets a Bloomberg terminal for job seekers.

- **Background:** `#FFFEF2` light / `#0F0F0E` dark (warm tones, not pure black/white)
- **Accent:** `#FCAA2D` (amber gold)
- **Typography:** Instrument Serif (headings) + Inter (body) + JetBrains Mono (scores/stats)
- **Match colors:** green `#22C55E` ≥ 85% · amber `#FCAA2D` 70–84% · gray < 70%
- **Dark/light mode:** CSS variables throughout, persisted to `localStorage`
