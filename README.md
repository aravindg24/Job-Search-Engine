# RoleGPT — Describe yourself. Find your next role.

> A semantic job search engine and job search command center. Upload your resume once, describe what you want in natural language, and get AI-ranked matches with explanations, gap analysis, tailored pitches, application tracking, and daily alerts.

---

## What It Does

**RoleGPT** is a full-stack job search tool built around semantic understanding — not keyword matching.

| Feature | Description |
|---|---|
| **Resume-aware search** | Upload your PDF once; every search is automatically enriched with your profile context |
| **AI match scores** | LLM re-ranks results and explains why each role fits (or doesn't) |
| **Skill gap analysis** | See which skills your top matches demand that you're missing, with a strategic insight |
| **Pitch generator** | 3-format AI-written pitches (cover letter hook, cold email, why interested) mapped to the specific JD |
| **Application tracker** | Kanban board — Saved / Applied / Interviewing / Offered / Rejected |
| **Watch mode / digest** | Set preferences and check for new high-match jobs since your last visit |

---

## Architecture

```
Resume PDF → extract (PyMuPDF) → parse (LLM) → profile stored in Supabase
                                                          ↓
Query + resume context → embed (all-MiniLM-L6-v2) → Qdrant vector search (top-20)
                                                          ↓
                                      LLM re-rank + explain (Cerebras / Gemini)
                                                          ↓
                                      Ranked results with match scores + reasons
```

Two-stage retrieval: fast vector recall → precise LLM scoring.

---

## Tech Stack

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Frontend     | React 18 + Vite + TailwindCSS               |
| Backend      | FastAPI (Python)                            |
| Embeddings   | `all-MiniLM-L6-v2` (sentence-transformers)  |
| Vector DB    | Qdrant (in-memory dev / Docker prod)        |
| LLM          | Cerebras (llama3.1-8b) — fast inference     |
| State DB     | Supabase (resume, tracker, watch prefs)     |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- [Cerebras API key](https://cloud.cerebras.ai) (free)
- [Supabase](https://supabase.com) project (free tier)

### 1. Clone & install

```bash
git clone https://github.com/aravindg24/Job-Search-Engine
cd Job-Search-Engine
bash scripts/setup.sh
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
```

### 3. Set up Supabase tables

Run `supabase_schema.sql` in your [Supabase SQL editor](https://supabase.com/dashboard/project/_/sql).

### 4. Seed job data & run

```bash
# Terminal 1 — Backend
cd backend
python indexer.py        # seed Qdrant with job data
uvicorn app:app --reload # API at http://localhost:8000

# Terminal 2 — Frontend
cd frontend
npm run dev              # UI at http://localhost:5173
```

Open `http://localhost:5173`, go to **Profile**, upload your resume, then search.

### Ingest fresh job data (optional)

```bash
bash scripts/ingest.sh
```

Pulls from HN "Who's Hiring", Arbeitnow, and Remotive APIs and re-indexes everything.

### Docker (full stack)

```bash
cp backend/.env.example backend/.env
# Fill in CEREBRAS_API_KEY, SUPABASE_URL, SUPABASE_KEY
docker compose up
# UI at http://localhost:5173
```

---

## API Reference

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
rolegpt/
├── backend/
│   ├── app.py              # All FastAPI endpoints
│   ├── config.py           # Settings + env vars
│   ├── models.py           # Pydantic schemas
│   ├── database.py         # Supabase CRUD helpers
│   ├── indexer.py          # Embed + index pipeline
│   ├── search/
│   │   ├── embedder.py     # sentence-transformers wrapper
│   │   ├── vector_store.py # Qdrant client
│   │   ├── reranker.py     # LLM re-ranking + explanation
│   │   ├── pipeline.py     # Search orchestrator
│   │   └── gaps.py         # Gap analysis logic
│   ├── resume/
│   │   ├── parser.py       # PyMuPDF text extraction
│   │   └── profiler.py     # LLM structured profile parsing
│   ├── pitch/
│   │   └── generator.py    # Pitch generation (3 types)
│   ├── scraper/
│   │   ├── hackernews.py   # HN Who's Hiring scraper
│   │   ├── arbeitnow.py    # Arbeitnow API
│   │   └── remotive.py     # Remotive API
│   └── data/
│       └── seed_jobs.json  # Curated seed jobs (Juicebox, Anthropic, Linear, etc.)
├── frontend/
│   └── src/
│       ├── pages/          # SearchPage, JobDetailPage, DashboardPage, ProfilePage
│       ├── components/     # layout/, search/, job/, dashboard/, profile/, shared/
│       ├── hooks/          # useSearch, useResume, useTracker, useDigest, useGaps
│       └── utils/          # api.js, colors.js, format.js
├── scripts/
│   ├── setup.sh            # One-command setup
│   ├── ingest.sh           # Run scrapers + re-index
│   └── refresh_jobs.py     # Standalone job refresh script
├── supabase_schema.sql     # Run in Supabase SQL editor
└── docker-compose.yml      # Full stack (Qdrant + backend + frontend)
```

---

## Design

Dark editorial aesthetic — think Linear meets a Bloomberg terminal for job seekers.

- Background: `#09090B` (near-black)
- Accent: `#E8FF47` (electric lime)
- Typography: Instrument Serif (headings) + Geist (body) + JetBrains Mono (stats)
- Match colors: green ≥80%, yellow 60–79%, gray <60%
