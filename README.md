# RoleGPT — Describe yourself. Find your next role.

> A semantic job search engine that understands who you are, not just what you type. Built using the same principles that power AI recruiting platforms like PeopleGPT — but from the candidate's perspective.

## How it works

1. **You describe yourself** in natural language — skills, experience, what you're looking for
2. **Semantic search** embeds your description and finds similar job listings using vector similarity (Qdrant + `all-MiniLM-L6-v2`)
3. **LLM re-ranking** (Gemini 2.0 Flash) re-orders results by fit and generates a 1-sentence explanation for each match
4. **Match analysis** breaks down your strengths, gaps, and gives actionable suggestions for each role

## Architecture

```
Candidate describes themselves
        ↓
  Embed query (all-MiniLM-L6-v2)
        ↓
  Vector search (Qdrant, top-20)
        ↓
  LLM re-rank + explain (Gemini 2.0 Flash)
        ↓
  Ranked results with match scores + reasons
```

**Two-stage retrieval** mirrors how modern AI recruiting platforms work:
- Stage 1: Fast, high-recall vector search
- Stage 2: Slow, high-precision LLM re-ranking

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | FastAPI (Python) |
| Embeddings | `all-MiniLM-L6-v2` (sentence-transformers) |
| Vector DB | Qdrant (in-memory dev / Docker prod) |
| LLM | Google Gemini 2.0 Flash |
| Data | HN Who's Hiring + Arbeitnow + Remotive APIs |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### Setup

```bash
git clone https://github.com/yourusername/rolegpt
cd rolegpt

# One-command setup (installs deps, seeds the DB)
bash scripts/setup.sh
```

Then add your Gemini API key to `backend/.env`:
```
GEMINI_API_KEY=your_key_here
```

### Run

```bash
# Terminal 1 — Backend
cd backend
uvicorn app:app --reload
# → http://localhost:8000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

### Ingest fresh job data (optional)

```bash
bash scripts/ingest.sh
```

Pulls from HN "Who's Hiring", Arbeitnow, and Remotive APIs.

### Docker (full stack)

```bash
cp backend/.env.example backend/.env
# Add GEMINI_API_KEY to backend/.env
docker compose up
# → http://localhost:5173
```

## Project Structure

```
rolegpt/
├── backend/
│   ├── app.py              # FastAPI: /search, /explain, /health
│   ├── config.py           # Settings + env vars
│   ├── models.py           # Pydantic schemas
│   ├── indexer.py          # Embed + index pipeline
│   ├── search/
│   │   ├── embedder.py     # sentence-transformers wrapper
│   │   ├── vector_store.py # Qdrant client wrapper
│   │   ├── reranker.py     # Gemini re-ranking + explanation
│   │   └── pipeline.py     # Orchestrator
│   ├── scraper/
│   │   ├── hackernews.py   # HN Who's Hiring scraper
│   │   ├── arbeitnow.py    # Arbeitnow API
│   │   └── remotive.py     # Remotive API
│   └── data/
│       └── seed_jobs.json  # 50 curated jobs (Juicebox, Anthropic, Linear, etc.)
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── components/     # SearchBar, ResultCard, JobDetail, etc.
│       ├── hooks/useSearch.js
│       └── utils/api.js
└── docker-compose.yml
```

## API

```
POST /api/search
{
  "query": "Full-stack engineer with React + Python, interested in AI startups",
  "top_k": 10
}

POST /api/explain
{
  "query": "...",
  "job_id": "job-001"
}

GET /api/health
```

---

Built to demonstrate the candidate-side mirror of PeopleGPT — same semantic search + LLM re-ranking architecture, flipped for job seekers.
