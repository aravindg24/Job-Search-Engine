# RoleGPT — Your AI-Powered Job Search Command Center

## Project Vision

Build "RoleGPT" — a semantic job search engine and job search command center where candidates upload their resume once, describe what they want in natural language, and get AI-ranked job matches with explanations, gap analysis, tailored pitches, application tracking, and daily alerts for new matches.

This is NOT just a search engine — it's the entire job search workflow in one tool.

---

## Core Value Propositions

1. **Find roles by FIT, not keywords** — Semantic search surfaces roles you'd miss by keyword-searching "ML Engineer" (e.g., "Software Engineer" at an AI company where the ML work is buried in the JD)
2. **Know if you're qualified BEFORE spending 45 minutes tailoring** — Instant match score + strengths/gaps so you can skip bad fits
3. **Get told exactly how to position yourself** — AI reads the JD against your resume and generates a tailored pitch highlighting the right projects and framing
4. **See strategic skill gaps across your entire search** — If 8/15 top matches want Kubernetes and you don't have it, that's a career signal
5. **Stop refreshing LinkedIn** — Watch mode alerts you when new high-match roles appear
6. **Track everything in one place** — Saved, Applied, Interviewing, Rejected — your job search command center

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Search   │ │ Results  │ │ Job      │ │ Dashboard     │   │
│  │ + Resume │ │ + Match  │ │ Detail   │ │ (Gaps, Track, │   │
│  │ Upload   │ │ Cards    │ │ + Pitch  │ │  Digest)      │   │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼─────────────────────────────────────┐
│                    BACKEND (FastAPI)                           │
│                                                               │
│  ┌─────────────────── API Endpoints ───────────────────────┐ │
│  │ POST /search          — semantic job search              │ │
│  │ POST /explain         — detailed match breakdown         │ │
│  │ POST /pitch           — tailored pitch generator         │ │
│  │ POST /resume/upload   — parse & store resume             │ │
│  │ GET  /resume/profile  — get parsed resume profile        │ │
│  │ GET  /gaps            — aggregate gap analysis           │ │
│  │ POST /track           — save/update application status   │ │
│  │ GET  /track           — get all tracked applications     │ │
│  │ GET  /digest          — new matches since last check     │ │
│  │ POST /watch           — set watch preferences            │ │
│  │ GET  /health          — health check                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────── Core Pipeline ───────────────────────┐ │
│  │  1. Parse resume → structured profile (skills, exp...)   │ │
│  │  2. Embed query + resume context (sentence-transformers) │ │
│  │  3. Vector search (Qdrant)                               │ │
│  │  4. LLM re-rank + explain (Gemini API)                   │ │
│  │  5. Gap analysis aggregation                             │ │
│  │  6. Pitch generation per role                            │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                      DATA LAYER                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ Qdrant      │  │ SQLite       │  │ Job Data (JSON)     │ │
│  │ (job vecs)  │  │ (user state: │  │ scraped from public │ │
│  │             │  │  resume,     │  │ sources             │ │
│  │             │  │  tracking,   │  │                     │ │
│  │             │  │  watches)    │  │                     │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer        | Technology                                | Why                                                      |
| ------------ | ----------------------------------------- | -------------------------------------------------------- |
| Frontend     | React 18 + Vite + TailwindCSS             | Fast, modern, component-based                            |
| Backend      | FastAPI (Python)                           | Async, great for ML pipelines                            |
| Embeddings   | `all-MiniLM-L6-v2` (sentence-transformers)| Lightweight, runs locally, no API cost                   |
| Vector DB    | Qdrant (in-memory → Docker for prod)      | Excellent for semantic search                            |
| LLM          | Google Gemini API (gemini-2.0-flash)       | Free tier available, fast                                |
| State DB     | SQLite (via aiosqlite)                     | Zero-config, perfect for single-user app state           |
| Resume Parse | PyMuPDF (fitz) + Gemini                    | Extract text from PDF, then LLM structures it            |
| Scraping     | requests + BeautifulSoup                   | For collecting public job listings                       |

---

## Feature Specifications

### Feature A: Resume-Aware Search

**How it works:**
1. User uploads resume (PDF) once via the UI
2. Backend extracts text with PyMuPDF, then sends to Gemini to parse into structured profile:

```json
{
  "name": "Aravind Gudikandula",
  "summary": "MS CS student with focus on RAG systems, LLM fine-tuning, and full-stack development",
  "skills": {
    "languages": ["Python", "Java", "JavaScript", "TypeScript", "C++", "Golang"],
    "frameworks": ["React", "Angular", "FastAPI", "Flask", "Spring Boot", "Express.js"],
    "ml_ai": ["PyTorch", "TensorFlow", "LangChain", "RAG", "LLM Fine-tuning", "YOLOv8", "CLIP"],
    "cloud": ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform"],
    "databases": ["PostgreSQL", "MongoDB", "Qdrant", "MySQL", "DynamoDB"]
  },
  "experience_years": 2,
  "education": [{"degree": "MS", "field": "Software Engineering", "school": "SJSU", "year": 2025}],
  "projects": [
    {"name": "ConRAC", "tech": ["RAG", "FAISS", "LLaMA", "GPT-4"], "description": "..."},
    {"name": "Resolve AI", "tech": ["React", "Gemini", "GCP", "Docker"], "description": "..."}
  ],
  "work_history": [
    {"company": "Hitachi Vantara", "role": "Associate Software Engineer", "duration": "1 year"}
  ]
}
```

3. Profile is stored in SQLite and automatically injected into every search query as context
4. User can now search with short queries like "remote AI startups" or "fintech data engineering" — the system already knows who they are

**Search query construction:**
```
When a resume profile exists:
  enriched_query = f"""
  Candidate Profile: {resume_summary}
  Key Skills: {top_skills}
  Experience Level: {years} years
  
  Looking for: {user_search_query}
  """
  
  This enriched query gets embedded and searched against job vectors.
  The LLM re-ranker also receives the full profile for accurate scoring.
```

**Resume parsing prompt for Gemini:**
```
Parse the following resume text into a structured JSON profile.
Extract: name, summary (2 sentences), skills (categorized), years of experience,
education, key projects (name + tech + 1-line description), work history.

Resume text:
{extracted_text}

Return ONLY valid JSON, no markdown formatting.
```

---

### Feature B: Gap Analysis Dashboard

**How it works:**
1. After any search, the backend collects requirements from all top-matched jobs
2. Compares against the user's resume profile
3. Aggregates which skills/requirements appear most frequently but are MISSING from the profile

**Endpoint: GET /api/gaps?from_search={search_id}**

```json
{
  "total_jobs_analyzed": 15,
  "missing_skills": [
    {"skill": "Kubernetes", "demanded_by": 8, "percentage": 53, "priority": "high"},
    {"skill": "Go/Golang", "demanded_by": 6, "percentage": 40, "priority": "medium"},
    {"skill": "GraphQL", "demanded_by": 4, "percentage": 27, "priority": "medium"},
    {"skill": "Kafka", "demanded_by": 3, "percentage": 20, "priority": "low"}
  ],
  "strong_skills": [
    {"skill": "Python", "demanded_by": 14, "percentage": 93, "status": "you have this"},
    {"skill": "React", "demanded_by": 11, "percentage": 73, "status": "you have this"},
    {"skill": "LLM/RAG", "demanded_by": 9, "percentage": 60, "status": "you have this"}
  ],
  "insight": "Your Python + React + LLM stack covers 80% of your top matches. Adding Kubernetes experience would unlock 8 more strong-fit roles."
}
```

**Implementation:**
1. For each job in search results, extract required skills using Gemini (or parse from structured fields)
2. Cross-reference against `resume_profile.skills`
3. Count frequency of missing vs. present skills
4. Generate insight summary via Gemini

**LLM prompt for gap insight:**
```
Given a candidate's skills and the skill demands across their top {n} job matches:

Candidate has: {skills_list}
Most demanded skills they're missing: {missing_with_counts}
Most demanded skills they have: {present_with_counts}

Write ONE actionable insight sentence about their job search positioning.
Be specific and strategic, not generic.
```

---

### Feature C: Tailored Pitch Generator

**How it works:**
1. User clicks "Generate Pitch" on any matched job
2. Backend sends the full JD + the user's resume profile to Gemini
3. Returns a 2-4 sentence pitch mapping specific resume items to specific JD requirements

**Endpoint: POST /api/pitch**

```json
// Request
{
  "job_id": "uuid-string",
  "pitch_type": "cover_letter_hook" | "cold_email" | "why_interested"
}

// Response
{
  "pitch": "Your search ranking team caught my attention — I recently built ConRAC, a retrieval-augmented classification system that uses the same embed-retrieve-rerank pipeline to classify documents across security levels. I also shipped Resolve AI, a full-stack React + Gemini app deployed on GCP, so I can contribute across your stack from day one.",
  "key_mappings": [
    {"jd_requirement": "LLM-powered features", "your_experience": "ConRAC — RAG pipeline with LLaMA and GPT-4"},
    {"jd_requirement": "Full-stack development", "your_experience": "Resolve AI — React 19 + Express + GCP deployment"},
    {"jd_requirement": "Search and ranking", "your_experience": "Qdrant vector search + cross-encoder reranking in ConRAC"}
  ],
  "framing_advice": "Lead with your retrieval/search work since that's their core product. Mention the IEEE publication to signal research depth."
}
```

**Pitch types:**
- `cover_letter_hook` — Opening 2-3 sentences for a cover letter
- `cold_email` — Brief pitch for a cold outreach email (less formal)
- `why_interested` — Answer to "Why are you interested in this role?" interview question

**LLM prompt:**
```
You are a career strategist. Given a candidate's resume and a job description, write a {pitch_type}.

Rules:
- Map SPECIFIC projects/experience to SPECIFIC job requirements
- Never be generic — every sentence should reference something concrete
- Keep it to 2-4 sentences
- Sound confident and natural, not desperate or robotic

Candidate Resume Profile:
{resume_profile_json}

Job Description:
{job_description}

Also return:
- key_mappings: array of {jd_requirement, your_experience} pairs
- framing_advice: one sentence on what to emphasize

Return as JSON.
```

---

### Feature D: Daily Digest / Watch Mode

**How it works:**
1. User sets watch preferences (role types, locations, company stages, minimum match %)
2. Backend periodically scrapes new jobs from all sources
3. New jobs are embedded and matched against the user's stored resume profile
4. Jobs above the match threshold are collected into a digest
5. Frontend shows a "New Matches" notification badge and digest view

**Endpoint: POST /api/watch**

```json
// Set watch preferences
{
  "min_match_score": 70,
  "keywords": ["AI", "LLM", "search", "full-stack"],
  "locations": ["San Francisco", "Remote"],
  "company_stages": ["Seed", "Series A", "Series B"],
  "notify": true
}
```

**Endpoint: GET /api/digest**

```json
{
  "since": "2025-12-28T00:00:00Z",
  "new_matches": 7,
  "jobs": [
    {
      "id": "...",
      "title": "Software Engineer",
      "company": "Perplexity",
      "match_score": 88,
      "match_reason": "Strong LLM + search infrastructure fit",
      "posted_date": "2025-12-29",
      "source": "hackernews"
    }
  ]
}
```

**Implementation:**
- Store watch preferences in SQLite
- `scripts/refresh_jobs.py` — standalone script that scrapes new listings, embeds them, upserts to Qdrant with a `indexed_at` timestamp
- `GET /api/digest` filters Qdrant for jobs indexed after the user's last check, runs them through the re-ranker against the stored resume profile, and returns matches above threshold
- Frontend polls `/api/digest` on load (or you can run `refresh_jobs.py` as a cron job)
- For the MVP, this can be a manual "Check for new matches" button rather than true push notifications

---

### Feature E: Application Tracker

**How it works:**
1. From any search result or job detail, user can click "Save" or "Mark as Applied"
2. Tracked jobs are stored in SQLite with status and timestamps
3. Dashboard view shows all tracked jobs organized by status columns (Kanban-style)
4. Each tracked job retains its match score, pitch, and gap analysis

**Endpoint: POST /api/track**

```json
{
  "job_id": "uuid-string",
  "status": "saved" | "applied" | "interviewing" | "offered" | "rejected" | "withdrawn",
  "notes": "Applied via Ashby, used the cold email pitch",
  "applied_date": "2025-12-30"
}
```

**Endpoint: GET /api/track**

```json
{
  "stats": {
    "saved": 12,
    "applied": 8,
    "interviewing": 3,
    "offered": 1,
    "rejected": 2,
    "withdrawn": 0
  },
  "jobs": [
    {
      "job_id": "...",
      "title": "Software Engineer",
      "company": "Juicebox",
      "status": "applied",
      "match_score": 92,
      "applied_date": "2025-12-30",
      "notes": "Cold emailed Ishan directly",
      "days_since_applied": 3
    }
  ]
}
```

**SQLite Schema:**

```sql
CREATE TABLE resume_profiles (
    id INTEGER PRIMARY KEY,
    raw_text TEXT NOT NULL,
    parsed_profile JSON NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tracked_jobs (
    id INTEGER PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    job_title TEXT,
    company TEXT,
    match_score REAL,
    status TEXT DEFAULT 'saved',
    notes TEXT,
    pitch TEXT,
    applied_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE watch_preferences (
    id INTEGER PRIMARY KEY,
    min_match_score REAL DEFAULT 70,
    keywords JSON,
    locations JSON,
    company_stages JSON,
    last_checked_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE search_history (
    id INTEGER PRIMARY KEY,
    query TEXT NOT NULL,
    results_count INTEGER,
    top_match_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Phase 1: Data Collection & Ingestion

### Step 1.1 — Job Data Scraper

Create `backend/scraper/` with scrapers for these FREE public sources:

1. **Hacker News "Who's Hiring"** (monthly threads)
   - Source: `https://hacker-news.firebaseio.com/v0/item/{thread_id}.json`
   - Parse top-level comments from the latest "Ask HN: Who is hiring?" thread
   - Use HN Algolia API: `http://hn.algolia.com/api/v1/search?query=who+is+hiring&tags=ask_hn`

2. **Arbeitnow API** (free, no auth)
   - Endpoint: `https://www.arbeitnow.com/api/job-board-api`
   - Returns JSON with title, description, company, location, tags

3. **Remotive API** (free, remote jobs)
   - Endpoint: `https://remotive.com/api/remote-jobs`
   - Good for remote-first tech roles

4. **Static seed data** (fallback)
   - Create `backend/data/seed_jobs.json` with 50-100 manually curated job listings from public Ashby/Lever/Greenhouse boards

### Job Data Schema

```json
{
  "id": "uuid-string",
  "title": "Software Engineer",
  "company": "Juicebox",
  "location": "San Francisco, CA",
  "remote": true,
  "description": "Full job description text...",
  "requirements": ["Python", "LLMs", "React"],
  "salary_range": "$120K - $180K",
  "company_stage": "Series A",
  "source": "hackernews",
  "source_url": "https://...",
  "posted_date": "2025-12-01",
  "indexed_at": "2025-12-30T10:00:00Z",
  "tags": ["ai", "search", "full-stack"]
}
```

### Step 1.2 — Embedding & Indexing Pipeline

File: `backend/indexer.py`

```
For each job listing:
  1. Combine title + company + description + requirements into a single text block
  2. Generate embedding using sentence-transformers (all-MiniLM-L6-v2)
  3. Upsert into Qdrant collection "jobs" with payload = full job metadata + indexed_at timestamp
```

Qdrant collection config:
- Collection name: `jobs`
- Vector size: 384 (MiniLM output dimension)
- Distance: Cosine

---

## Phase 2: Search Backend

### Step 2.1 — Resume Upload & Parsing

```
POST /api/resume/upload
Body: multipart form with PDF file

Pipeline:
  1. Extract text from PDF using PyMuPDF (fitz)
  2. Send extracted text to Gemini with structured parsing prompt
  3. Store raw text + parsed JSON profile in SQLite
  4. Return parsed profile to frontend for confirmation
```

### Step 2.2 — Core Search Endpoint

```
POST /api/search
Body: {
  "query": "remote AI startups",
  "top_k": 20,
  "filters": {         // optional
    "remote": true,
    "location": "San Francisco"
  }
}

Pipeline:
  1. Load resume profile from SQLite (if exists)
  2. Construct enriched query: resume context + user's search text
  3. Embed the enriched query using all-MiniLM-L6-v2
  4. Vector similarity search in Qdrant (top_k * 2 for re-ranking headroom)
  5. Pass top results + original query + resume profile to Gemini for re-ranking
  6. Gemini returns re-ranked list with match scores (0-100) and explanations
  7. Extract required skills from each matched job for gap analysis
  8. Store search in search_history table
  9. Return ranked results + gap analysis data
```

### Step 2.3 — LLM Re-Ranking Prompt

```
You are a job matching assistant. Given a candidate's profile and a list of job postings, re-rank the jobs by relevance.

Candidate Profile:
{resume_profile_json OR raw_query if no resume}

Search Intent: {user_query}

Jobs:
{numbered list of job titles + companies + brief descriptions}

For each job, return:
- rank (1 = best match)
- match_score (0-100)
- reason (1 sentence explaining why this matches or doesn't)
- strengths (skills/experience that match)
- gaps (requirements the candidate is missing)

Return ONLY valid JSON array, no other text:
[{"job_id": "...", "rank": 1, "match_score": 92, "reason": "...", "strengths": ["..."], "gaps": ["..."]}]
```

### Step 2.4 — Match Explanation Endpoint

```
POST /api/explain
Body: {
  "job_id": "uuid-string"
}

Returns: {
  "match_score": 87,
  "strengths": [
    {"area": "RAG Systems", "detail": "ConRAC project directly maps to their search pipeline"},
    {"area": "Full-Stack", "detail": "React + Express + GCP deployment experience"}
  ],
  "gaps": [
    {"area": "Vue.js", "detail": "Job uses Vue.js, your experience is React-based", "severity": "low"},
    {"area": "3+ years production", "detail": "You have ~1 year at Hitachi", "severity": "medium"}
  ],
  "overall_advice": "Strong technical fit. Frame your RAG research as production search experience."
}
```

### Step 2.5 — Pitch Generation Endpoint

```
POST /api/pitch
Body: {
  "job_id": "uuid-string",
  "pitch_type": "cover_letter_hook" | "cold_email" | "why_interested"
}

Returns: {
  "pitch": "...",
  "key_mappings": [...],
  "framing_advice": "..."
}
```

### Step 2.6 — Gap Analysis Endpoint

```
GET /api/gaps?search_id={id}

Aggregates gaps across all results from a given search.
Returns missing skills ranked by frequency + insight sentence.
```

### Step 2.7 — Application Tracking Endpoints

```
POST /api/track    — save or update a tracked job
GET  /api/track    — get all tracked jobs with stats
DELETE /api/track/{job_id} — remove from tracker
```

### Step 2.8 — Watch / Digest Endpoints

```
POST /api/watch    — set watch preferences
GET  /api/digest   — get new matches since last check
POST /api/digest/refresh — manually trigger job re-scrape + matching
```

---

## Phase 3: Frontend

### Design Direction

**Aesthetic:** Dark, editorial, purposeful. Think: Linear meets Raycast meets a Bloomberg terminal for job seekers. NOT generic AI purple gradients.

**Color Palette:**
- Background: `#09090B` (near-black)
- Surface: `#131316` (dark card)
- Surface hover: `#1A1A1F`
- Primary accent: `#E8FF47` (electric lime — memorable, unique)
- Success: `#22C55E` (match strengths)
- Warning: `#F59E0B` (gaps)
- Danger: `#EF4444` (low match / rejected)
- Text primary: `#FAFAFA`
- Text secondary: `#71717A`
- Border: `#27272A`

**Typography:**
- Headings: `"Instrument Serif"` from Google Fonts (editorial, distinctive)
- Body: `"Geist"` or `"Satoshi"` (clean, technical)
- Mono: `"JetBrains Mono"` (match scores, tags, stats)

### Page Structure & Routes

```
/                  — Search page (main view)
/dashboard         — Dashboard (gap analysis + application tracker + digest)
/job/:id           — Job detail (match breakdown + pitch generator)
/profile           — Resume profile view + edit
```

#### 1. Search Page (`/`)

```
┌──────────────────────────────────────────────────────────┐
│  RoleGPT                    [Dashboard] [Profile] [GitHub]│
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 📄 Resume loaded: Aravind G. (Edit)               │   │
│  │                                                    │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ remote AI startups with search focus       │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                   [Search] 🔍     │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  Try: "fintech data engineering"                          │
│       "Bay Area AI companies, Series A-B"                 │
│       "remote full-stack with LLM work"                   │
│                                                           │
│  ── 24 matches found ── Gap Analysis ↗ ────────────────  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 🟢 92%  Software Engineer — Juicebox              │   │
│  │ San Francisco · Series A · $150-200K · Remote OK  │   │
│  │                                                    │   │
│  │ "Your RAG pipeline and LLM fine-tuning experience │   │
│  │  maps directly to their search ranking work."     │   │
│  │                                                    │   │
│  │ ✅ Python  ✅ LLMs  ✅ React  ⚠️ Vue.js           │   │
│  │                                                    │   │
│  │ [Save] [Generate Pitch] [Details →]               │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 🟡 78%  Full-Stack Engineer — Ramp                │   │
│  │ New York · Series C · $140-190K                   │   │
│  │ ...                                               │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Key interactions:**
- If no resume uploaded, show upload prompt instead of "Resume loaded" bar
- Search bar is pre-contextualized with resume — short queries work
- Each result card shows inline skill match indicators (✅ have / ⚠️ missing)
- "Save" button adds to application tracker
- "Generate Pitch" opens a modal with pitch options
- "Gap Analysis ↗" link goes to dashboard with this search's aggregate gaps

#### 2. Job Detail Page (`/job/:id`)

```
┌──────────────────────────────────────────────────────┐
│  ← Back to results                                    │
│                                                       │
│  Software Engineer                                    │
│  Juicebox · San Francisco                             │
│                                                       │
│  ████████████████████░░░  92% match                   │
│                                                       │
│  ── Why You Match ───────────────────────────────    │
│  ✅ RAG system experience → their search pipeline     │
│  ✅ LLM fine-tuning (LLaMA) → model training work    │
│  ✅ Full-stack React + Python → end-to-end shipping   │
│  ✅ Qdrant/vector search → core infrastructure        │
│                                                       │
│  ── Gaps to Address ─────────────────────────────    │
│  ⚠️ Vue.js (they use Vue, you know React — low risk)  │
│  ⚠️ 3+ years production (you have ~1yr — medium risk) │
│                                                       │
│  ── Strategic Advice ────────────────────────────    │
│  "Lead with ConRAC retrieval work. Frame Qdrant       │
│   experience as production search infrastructure.     │
│   The React→Vue gap is minimal for someone            │
│   strong in JS frameworks."                           │
│                                                       │
│  ── Generate Pitch ──────────────────────────────    │
│  [Cover Letter Hook] [Cold Email] [Why Interested]   │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ "Your search ranking team caught my attention  │  │
│  │  — I recently built ConRAC, a retrieval-       │  │
│  │  augmented classification system that uses     │  │
│  │  the same embed-retrieve-rerank pipeline..."   │  │
│  │                                    [Copy 📋]   │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ── Full Job Description ────────────────────────    │
│  As a software engineer you'll play a key role...    │
│                                                       │
│  [Apply ↗] [Save to Tracker] [Mark as Applied]       │
└──────────────────────────────────────────────────────┘
```

#### 3. Dashboard Page (`/dashboard`)

```
┌──────────────────────────────────────────────────────────┐
│  RoleGPT Dashboard                        [Search] [Prof]│
│                                                           │
│  ┌─── New Matches (3) ──────────────────────────────┐   │
│  │ 🔔 3 new matches since yesterday                  │   │
│  │                                                    │   │
│  │ 🟢 88% ML Engineer — Perplexity (posted 2h ago)   │   │
│  │ 🟢 82% SWE — Vercel (posted 6h ago)               │   │
│  │ 🟡 74% Backend Eng — Linear (posted 1d ago)       │   │
│  │                                                    │   │
│  │ [Check for more]              Last checked: 2h ago │   │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─── Skill Gap Analysis ───────────────────────────┐   │
│  │ Based on your top 15 matches:                     │   │
│  │                                                    │   │
│  │ You're strong in:                                  │   │
│  │ Python ████████████████████████ 93% (14/15 want)  │   │
│  │ React  ████████████████████    73% (11/15 want)   │   │
│  │ LLM/RAG ██████████████████     60% (9/15 want)   │   │
│  │                                                    │   │
│  │ Consider learning:                                 │   │
│  │ Kubernetes ████████████         53% (8/15 want)   │   │
│  │ Go/Golang  ████████             40% (6/15 want)   │   │
│  │ GraphQL    ██████               27% (4/15 want)   │   │
│  │                                                    │   │
│  │ 💡 "Your Python + React + LLM stack covers 80%    │   │
│  │    of your top matches. Adding Kubernetes would    │   │
│  │    unlock 8 more strong-fit roles."                │   │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─── Application Tracker ──────────────────────────┐   │
│  │                                                    │   │
│  │ Saved (12)  Applied (8)  Interview (3)  Offer (1) │   │
│  │ ─────────  ──────────  ───────────────  ────────  │   │
│  │ Linear     Juicebox    Perplexity (R2)  Ramp     │   │
│  │ Vercel     Anthropic   Vercel (Tech)    ────────  │   │
│  │ Modal      Ramp        Anyscale (HM)    Rejected  │   │
│  │ Anyscale   OpenAI      ───────────────  ────────  │   │
│  │ Weights&B  Perplexity                   OpenAI   │   │
│  │ ...        ...                          Stripe   │   │
│  │                                                    │   │
│  │ 📊 Applied 8 · Avg match: 84% · Avg wait: 5 days │   │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

#### 4. Profile Page (`/profile`)

```
┌────────────────────────────────────────────────┐
│  Your Profile                     [Re-upload]  │
│                                                 │
│  Aravind Gudikandula                           │
│  MS CS, SJSU · 2 years experience              │
│                                                 │
│  ── Parsed Skills ──────────────────────────   │
│  Languages: Python, Java, JavaScript, TS, C++  │
│  ML/AI: PyTorch, TensorFlow, RAG, LLMs, YOLO  │
│  Cloud: AWS, GCP, Azure, Docker, Terraform     │
│  Databases: PostgreSQL, MongoDB, Qdrant        │
│                                                 │
│  ── Key Projects ───────────────────────────   │
│  ConRAC — RAG pipeline, FAISS, LLaMA, GPT-4   │
│  Resolve AI — React, Gemini, GCP, Docker       │
│  Medical RAG — BioMistral, Qdrant, LangChain   │
│  CV Framework — YOLOv8, Stable Diffusion, CLIP │
│                                                 │
│  ── Watch Preferences ──────────────────────   │
│  Min match: 70%                                 │
│  Keywords: AI, LLM, search, full-stack          │
│  Locations: San Francisco, Remote               │
│  Stages: Seed, Series A, Series B               │
│  [Save Preferences]                             │
└────────────────────────────────────────────────┘
```

### Frontend Component Structure

```
src/
├── App.jsx                     # Router + layout
├── index.css                   # Tailwind + custom styles + fonts
├── pages/
│   ├── SearchPage.jsx          # Main search view
│   ├── DashboardPage.jsx       # Dashboard with gaps + tracker + digest
│   ├── JobDetailPage.jsx       # Full job detail + pitch generator
│   └── ProfilePage.jsx         # Resume profile + watch settings
├── components/
│   ├── layout/
│   │   ├── Header.jsx          # Nav bar with page links
│   │   └── PageContainer.jsx   # Consistent page wrapper
│   ├── search/
│   │   ├── SearchBar.jsx       # Textarea + resume context indicator + submit
│   │   ├── ExampleQueries.jsx  # Clickable example searches
│   │   ├── ResultCard.jsx      # Job card with match %, reason, skill tags
│   │   ├── ResultsList.jsx     # Sorted list with loading skeletons
│   │   └── SkillTag.jsx        # Inline ✅/⚠️ skill indicator
│   ├── job/
│   │   ├── MatchBreakdown.jsx  # Strengths + gaps + advice
│   │   ├── PitchGenerator.jsx  # Pitch type selector + generated output + copy
│   │   └── JobDescription.jsx  # Collapsible full JD
│   ├── dashboard/
│   │   ├── DigestPanel.jsx     # New matches notification list
│   │   ├── GapChart.jsx        # Bar chart of skill gaps/strengths
│   │   ├── GapInsight.jsx      # AI-generated insight card
│   │   ├── TrackerBoard.jsx    # Kanban-style columns by status
│   │   ├── TrackerCard.jsx     # Individual tracked job card
│   │   └── TrackerStats.jsx    # Summary stats bar
│   ├── profile/
│   │   ├── ResumeUpload.jsx    # Drag-and-drop PDF upload
│   │   ├── ParsedProfile.jsx   # Displays parsed resume data
│   │   └── WatchSettings.jsx   # Watch preference form
│   └── shared/
│       ├── MatchBadge.jsx      # Color-coded match % (green/yellow/red)
│       ├── LoadingState.jsx    # Skeleton cards
│       ├── Modal.jsx           # Reusable modal
│       └── Toast.jsx           # Success/error notifications
├── hooks/
│   ├── useSearch.js            # Search API with loading/error
│   ├── useResume.js            # Resume upload + profile state
│   ├── useTracker.js           # Application tracking CRUD
│   ├── useDigest.js            # Digest polling / manual refresh
│   └── useGaps.js              # Gap analysis data
└── utils/
    ├── api.js                  # Axios/fetch wrapper for all endpoints
    ├── colors.js               # Match score → color mapping
    └── format.js               # Date formatting, truncation helpers
```

---

## Phase 4: Project Structure

```
rolegpt/
├── CLAUDE.md                   # THIS FILE
├── README.md                   # Setup instructions, screenshots, architecture
├── docker-compose.yml          # Qdrant + backend + frontend
│
├── backend/
│   ├── requirements.txt        # fastapi, uvicorn, qdrant-client, sentence-transformers,
│   │                           # google-generativeai, beautifulsoup4, requests, pydantic,
│   │                           # aiosqlite, pymupdf, python-multipart
│   ├── app.py                  # FastAPI app — all endpoint routes
│   ├── config.py               # Env vars, API keys, DB paths
│   ├── models.py               # Pydantic models for all request/response schemas
│   ├── database.py             # SQLite setup, table creation, CRUD helpers
│   ├── search/
│   │   ├── embedder.py         # Sentence-transformer wrapper
│   │   ├── vector_store.py     # Qdrant client (connect, upsert, search)
│   │   ├── reranker.py         # Gemini re-ranking + explanation
│   │   ├── pipeline.py         # Full search orchestration
│   │   └── gaps.py             # Aggregate gap analysis logic
│   ├── resume/
│   │   ├── parser.py           # PDF text extraction (PyMuPDF)
│   │   └── profiler.py         # Gemini-based structured profile extraction
│   ├── pitch/
│   │   └── generator.py        # Pitch generation for different formats
│   ├── scraper/
│   │   ├── base.py             # Base scraper with common parsing
│   │   ├── hackernews.py       # HN "Who's Hiring" scraper
│   │   ├── arbeitnow.py        # Arbeitnow API client
│   │   └── remotive.py         # Remotive API client
│   ├── indexer.py              # Scrape → embed → index pipeline
│   └── data/
│       └── seed_jobs.json      # Fallback seed data (50-100 curated listings)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── public/
│   │   └── favicon.svg
│   └── src/                    # See component structure above
│
└── scripts/
    ├── setup.sh                # One-command setup
    ├── ingest.sh               # Run scraper + indexer
    └── refresh_jobs.py         # Standalone: scrape new jobs + match against profile
```

---

## Phase 5: Implementation Order

### Sprint 1: Backend Foundation (Day 1)
1. Set up FastAPI project with `config.py`, `models.py`, `database.py`
2. Create SQLite tables (resume_profiles, tracked_jobs, watch_preferences, search_history)
3. Implement `embedder.py` — load `all-MiniLM-L6-v2`, expose `embed(text) -> list[float]`
4. Implement `vector_store.py` — Qdrant in-memory with `create_collection()`, `upsert()`, `search()`
5. Create `seed_jobs.json` with 50+ real job listings
6. Implement `indexer.py` — load seed data, embed, store in Qdrant
7. Implement basic `POST /api/search` (embed → Qdrant → return raw results, no re-ranking yet)
8. Test with curl

### Sprint 2: Resume + LLM Intelligence (Day 1-2)
1. Implement `resume/parser.py` — PyMuPDF text extraction
2. Implement `resume/profiler.py` — Gemini structured parsing
3. Implement `POST /api/resume/upload` and `GET /api/resume/profile`
4. Implement `reranker.py` — Gemini re-ranking with resume context
5. Implement `pipeline.py` — full search orchestration with resume-aware enrichment
6. Implement `POST /api/explain` — detailed match breakdown
7. Update `POST /api/search` to use full pipeline
8. Test end-to-end: upload resume → search → get ranked results with explanations

### Sprint 3: Pitch + Gaps + Tracking (Day 2)
1. Implement `pitch/generator.py` with three pitch types
2. Implement `POST /api/pitch` endpoint
3. Implement `search/gaps.py` — aggregate gap analysis
4. Implement `GET /api/gaps` endpoint
5. Implement `POST /api/track`, `GET /api/track`, `DELETE /api/track/{id}` endpoints
6. Implement watch preferences `POST /api/watch`
7. Implement `GET /api/digest` and `scripts/refresh_jobs.py`
8. Test all endpoints

### Sprint 4: Scrapers (Day 2-3)
1. Implement HN "Who's Hiring" scraper
2. Implement Arbeitnow + Remotive scrapers
3. Create `ingest.sh` that runs all scrapers → indexer
4. Run full pipeline with real data

### Sprint 5: Frontend — Core Flow (Day 3-4)
1. Scaffold React + Vite + Tailwind + React Router
2. Import fonts (Instrument Serif + Geist/Satoshi + JetBrains Mono)
3. Build shared components (MatchBadge, LoadingState, Modal, Toast)
4. Build SearchPage — SearchBar + ResumeContext indicator + ResultsList + ResultCard
5. Build ProfilePage — ResumeUpload (drag-and-drop) + ParsedProfile display
6. Connect search flow end-to-end: upload resume → search → see ranked results

### Sprint 6: Frontend — Features (Day 4-5)
1. Build JobDetailPage — MatchBreakdown + PitchGenerator + copy-to-clipboard
2. Build DashboardPage layout with three panels
3. Build GapChart (bar chart using recharts) + GapInsight card
4. Build TrackerBoard (Kanban columns) + TrackerCard + TrackerStats
5. Build DigestPanel with manual refresh
6. Add animations — staggered card entrance, search loading, page transitions
7. Responsive design pass

### Sprint 7: Polish & Deploy (Day 5-6)
1. Error handling everywhere — graceful Gemini failures, empty states, network errors
2. Docker Compose for full stack
3. Write README with screenshots, architecture diagram, setup instructions
4. Deploy frontend to Vercel, backend to Railway/Render
5. Record 30-second GIF/video demo

---

## Environment Variables

```env
# backend/.env
GEMINI_API_KEY=your_gemini_api_key
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION=jobs
EMBEDDING_MODEL=all-MiniLM-L6-v2
SQLITE_DB_PATH=./data/rolegpt.db
CORS_ORIGINS=http://localhost:5173
```

---

## Key Technical Decisions

1. **Qdrant in-memory mode** for development, Docker for production:
   ```python
   from qdrant_client import QdrantClient
   client = QdrantClient(":memory:")  # Dev
   # client = QdrantClient(host="localhost", port=6333)  # Prod
   ```

2. **Two-stage retrieval**: Vector search (fast recall) → LLM re-rank (precise scoring). This is the industry-standard pattern for semantic search.

3. **SQLite for user state**: Zero-config, single file, perfect for a single-user job search tool. No need for Postgres complexity.

4. **Gemini free tier** has 15 RPM / 1M tokens/day — sufficient for personal use. Batch re-ranking (send 10 jobs per call). Fall back to vector-only results if API is unavailable.

5. **Streaming UX**: Return vector search results immediately to the frontend, then update with re-ranked scores as Gemini responds. Keeps the UI feeling snappy.

6. **Resume profile caching**: Parse resume once, cache structured profile in SQLite. Only re-parse on new upload.

---

## README Tagline

> **RoleGPT** — Describe yourself. Find your next role.
>
> A semantic job search engine that understands who you are, not just what you type. Natural language in, ranked job matches out — with AI-powered explanations of why each role fits.

---

## Quick Start Commands (for README)

```bash
# Clone
git clone https://github.com/yourusername/rolegpt.git
cd rolegpt

# Backend
cd backend
pip install -r requirements.txt
python indexer.py                # Seed the vector database
uvicorn app:app --reload         # Start API at localhost:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                      # Start UI at localhost:5173

# Open http://localhost:5173, upload your resume, and search!
```

---

## Notes for Claude Code

- Prioritize getting a working end-to-end flow FIRST: resume upload → search → ranked results with explanations. Then layer on pitch, gaps, tracker, digest.
- Use Qdrant in-memory mode initially to avoid Docker friction.
- The seed_jobs.json is critical — curate REAL job listings from public Ashby/Lever boards for companies like Ramp, Perplexity, Vercel, Linear, Anthropic, OpenAI, Anyscale, Modal, Weights & Biases. Real data makes the product feel real.
- For Gemini, use gemini-2.0-flash (fast + cheap). Fall back gracefully if API is unavailable.
- Frontend should feel fast — skeleton loading, staggered card animations, optimistic UI updates for tracker.
- Match score colors: 80-100% green (#22C55E), 60-79% yellow (#F59E0B), below 60% gray (#71717A).
- The gap analysis chart can use recharts (already available in React artifacts).
- Application tracker should support drag-and-drop between status columns if time allows, otherwise simple dropdown status changes.
- Every Gemini prompt should have a fallback — if the LLM call fails, return raw vector results / generic explanation / no pitch rather than crashing.