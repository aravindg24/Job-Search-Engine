# Direct Search Pipeline — Complete Breakdown

## Overview
When a user searches **"I want to see AI engineer roles in Arizona"**, here's exactly what happens at each stage and how results are weighted:

---

## Stage 1: Query Intent Parsing
**File:** `backend/search/query_parser.py`

### What happens:
- The raw query is parsed by Cerebras (or regex fallback) to extract **three components**:
  - `clean_query`: "AI engineer" (role/intent, stripped of filler)
  - `location`: "Arizona" (geographic filter)
  - `remote`: null (not mentioned)

### Weighting:
- **Filler words removed** ("I want to see", "show me") — these add noise to embedding
- **Location extracted** — later applied as a hard post-filter, not passed to embedding
- **Clean query prioritized** — only "AI engineer" goes to the embedding model for better semantic precision

### Example transformations:
| User Query | Clean Query | Location | Remote |
|---|---|---|---|
| "I want to see AI engineer roles in Arizona" | "AI engineer" | "Arizona" | null |
| "Find me remote Python developer jobs" | "Python developer" | null | true |
| "senior backend engineer at a startup in San Francisco" | "senior backend engineer startup" | "San Francisco" | null |
| "machine learning researcher" | "machine learning researcher" | null | null |

---

## Stage 2: Embedding & Vector Search
**Files:** `backend/search/embedder.py`, `backend/search/vector_store.py`, `backend/search/pipeline.py`

### What happens:
1. **Clean query is embedded** using `all-MiniLM-L6-v2` (384-dimensional)
   - Model: `BAAI/bge-small-en-v1.5`
   - Special handling: BGE query prefix `"Represent this sentence for searching relevant passages: "` is **automatically applied** to search queries
   - This makes the embedding optimized for retrieval (finding relevant documents)

2. **Vector similarity search in Qdrant**
   - Distance metric: **Cosine Similarity** (0 = opposite, 1 = identical)
   - Fetch amount: `top_k * 4` candidates (e.g., fetch 40 jobs to find top 10)
     - Higher multiplier (4x) when location filter is active (to ensure enough survive the filter)
     - Lower multiplier (2x) when no location filter
   - Applied filters (hard constraints):
     - `remote=true/false` (if explicitly set)
     - `stream` (engineering/data/product)

### Weighting at this stage:
| Factor | Weight | How it works |
|---|---|---|
| Semantic similarity to clean query | **Primary** | Cosine distance to embedding. "AI engineer" matches jobs with similar title/description regardless of wording |
| Exact field matches | N/A | Vector search doesn't do keyword matching — it's purely semantic |
| TF-IDF or BM25 | None | This uses pure vector similarity, not text ranking |
| Location | **None at this stage** | Filtered out in Stage 3, not used here |
| Remote preference | **Hard filter** | Included/excluded before vector search (not ranked, just filtered) |
| Stream (eng/data/product) | **Hard filter** | Included/excluded before vector search (not ranked, just filtered) |

### Example:
Query: "AI engineer"
- **Cosine = 0.87** → Job: "AI/ML Engineer — Build scalable systems" ✓ High match
- **Cosine = 0.82** → Job: "Machine Learning Engineer — NLP focus" ✓ Still high (related)
- **Cosine = 0.45** → Job: "DevOps Engineer — Infrastructure" ✗ Low (different focus)

---

## Stage 3: Location Post-Filter
**File:** `backend/search/pipeline.py` (lines ~37-42)

### What happens:
After vector search returns top candidates, jobs are filtered by location:

```python
if location_filter:
    candidates = [
        c for c in candidates
        if location_lower in job_location.lower()
        or job.get("remote", False)
    ]
```

### Weighting:
| Condition | Result |
|---|---|
| Job location contains "arizona" (case-insensitive) | ✓ Keep |
| Job location does NOT contain "arizona" BUT `remote=true` | ✓ Keep (remote jobs accessible from anywhere) |
| Job location does NOT contain "arizona" AND `remote=false` | ✗ Remove |

### Example:
User searched: "Arizona" location filter
- Job: "Phoenix, AZ" → Keep ✓
- Job: "Tempe, Arizona" → Keep ✓
- Job: "Remote" → Keep ✓ (remote jobs included)
- Job: "San Francisco, CA" → Remove ✗

---

## Stage 4: LLM Re-ranking (Cerebras)
**File:** `backend/search/reranker.py`

### What happens:
The remaining candidates (after location filter) are sent to Cerebras for **intelligent re-ranking**.

### Input to Cerebras:
1. **Candidate profile** (if user has resume uploaded):
   - Positioning: "Backend engineer with 4 years experience"
   - Differentiators: ["Led zero-downtime DB migration", "Contributed to PyTorch"]
   - Skills: Python, Go, Kubernetes, etc.
   - Work history: Previous roles + companies
   - Projects: Key projects with tech stack
   
2. **Job list** (top 40 candidates from vector search):
   - Title, company, location
   - Description (first 200 chars)
   - Requirements list

3. **Re-rank prompt** instructs Cerebras to:
   > "Use the candidate's positioning and differentiators to understand what kind of role is the best fit — don't just match keywords."

### Weighting at this stage:
Cerebras produces a `match_score` (0-100) based on:

| Factor | Weight | Example |
|---|---|---|
| **Skills Match** | High | Candidate has Python + Kubernetes; job requires both |
| **Experience Match** | High | Candidate: 5 years backend; Job: Senior backend role (good level) |
| **Positioning Alignment** | High | Candidate: "moving toward staff engineer"; Job: "Staff engineer role" |
| **Differentiators** | High | Candidate's standout achievements align with job's novel challenges |
| **Culture Fit** | Medium | Candidate's company stage preference matches company stage |
| **Growth Potential** | Medium | Job offers growth beyond candidate's current level |
| **Red Flags** | High (negative) | Key requirement missing from candidate's profile |
| **Keyword matches** | Low | Explicit mentions of same tools/technologies (least important) |

### Example output:
```json
[
  {
    "job_id": "job-001",
    "rank": 1,
    "match_score": 92,
    "reason": "Strong backend + Kubernetes fit with clear growth path toward staff engineer"
  },
  {
    "job_id": "job-002",
    "rank": 2,
    "match_score": 78,
    "reason": "Python skills match but missing Kubernetes experience"
  },
  {
    "job_id": "job-003",
    "rank": 3,
    "match_score": 64,
    "reason": "Frontend role; significant skill gap despite Python overlap"
  }
]
```

### Fallback (if Cerebras unavailable):
If no Cerebras API key, results are sorted by the **vector similarity score** from Stage 2:
```python
match_score = round(vector_score * 100)
```
This is purely semantic matching without resume context.

---

## Stage 5: Result Formatting & Return
**File:** `backend/app.py`, `backend/search/pipeline.py`

### What's returned:
```json
{
  "results": [
    {
      "id": "job-123",
      "title": "Senior AI Engineer",
      "company": "OpenAI",
      "location": "San Francisco, CA",
      "remote": false,
      "match_score": 92,
      "match_reason": "Strong ML + Python fit with growth to principal engineer",
      "description": "...",
      "requirements": ["Python", "PyTorch", "Distributed systems"],
      "salary_range": "$250k–$350k",
      "source": "LinkedIn"
    }
  ],
  "total": 25,
  "query": "I want to see AI engineer roles in Arizona"
}
```

---

## Complete Flow Diagram

```
User Input: "I want to see AI engineer roles in Arizona"
    ↓
[Stage 1] Query Intent Parser
    → clean_query: "AI engineer"
    → location: "Arizona"  
    → remote: null
    ↓
[Stage 2] Embedding & Vector Search
    → Embed("AI engineer") using BGE-small
    → Search Qdrant with cosine similarity
    → Fetch top 40 candidates (4x multiplier because location filter active)
    → Results sorted by similarity score
    ↓
[Stage 3] Location Post-Filter
    → Keep jobs where:
       - location contains "arizona" OR
       - remote = true
    → Remove jobs in other states
    → Results: ~12 jobs from Arizona + remote jobs
    ↓
[Stage 4] LLM Re-ranking (Cerebras)
    → For each job, evaluate against resume profile:
       - Skills match? Seniority match?
       - Positioning aligned? Differentiators relevant?
       - Red flags?
    → Produce match_score (0-100) and reason
    → Re-sort by match_score descending
    ↓
[Stage 5] Take Top 10 & Return
    → Return top 10 jobs with scores and explanations
    → User sees ranked results with match reasons
```

---

## Key Insights: What Matters Most?

### For search without resume:
1. **Semantic similarity** (vector embedding) — 80% of ranking
2. **Location filter** — hard boundary
3. **Remote preference** — hard boundary
4. **Keyword overlap** — not explicitly considered

### For search with resume (uploaded):
1. **Positioning alignment** — 30% (does the job match where they're headed?)
2. **Skill match** — 25% (do they have the required skills?)
3. **Experience level** — 20% (seniority appropriate?)
4. **Differentiators** — 15% (do their standout achievements matter for this role?)
5. **Red flags** — 10% (missing critical requirements?)

### What does NOT affect ranking:
- Company size (unless in resume's culture_fit criteria)
- Salary amount (only shown, never ranked)
- How many applicants (not exposed to search engine)
- Job posting date (except in digest — last 7 days)
- Source (LinkedIn vs Indeed — doesn't affect matching)

---

## Example Walkthroughs

### Example 1: Search WITHOUT Resume
```
User: "machine learning engineer Python"
Resume: None

Vector search vector similarity, no resume context:
1. "ML Engineer, PyTorch focus" — cosine=0.89 → match_score = 89
2. "AI/ML Research Engineer" — cosine=0.85 → match_score = 85
3. "Data Scientist, Python" — cosine=0.71 → match_score = 71
4. "Backend Engineer, Python" — cosine=0.60 → match_score = 60

Result: Jobs ranked purely by embedding similarity to "machine learning engineer Python"
```

### Example 2: Search WITH Resume
```
User: "AI engineer roles in Arizona"
Resume: Backend engineer, 5 years, skills=[Python, Go, Kubernetes], differentiators=[led migration, pytorch contrib]

Stage 2 vector search (top 40):
→ Fetches 40 AI/ML + backend roles in/near Arizona

Stage 3 location filter:
→ 40 → 18 jobs (Phoenix, Tempe, Scottsdale, + remote)

Stage 4 Cerebras re-rank:
→ Job A: "Senior ML Engineer, Kubernetes, Arizona"
   match_score = 95 (skills perfect match, seniority good, growth potential clear)
   reason: "Strong ML + Kubernetes background with clear path to staff engineer role"

→ Job B: "AI Engineer, PyTorch, Remote"
   match_score = 88 (no Kubernetes, but PyTorch matches differentiator)
   reason: "Excellent PyTorch fit matching your research background"

→ Job C: "Backend Lead, Arizona"
   match_score = 71 (skills match but role is lateral, not growth)
   reason: "Solid technical fit but limited growth potential toward ML focus"

Result: User sees Jobs A > B > C with detailed reasons
```

---

## Performance Notes

- **Vector search**: ~100ms (Qdrant, ~15k jobs)
- **Location filter**: <1ms (in-memory, just substring matching)
- **Cerebras re-rank**: ~2-3 seconds (LLM call)
- **Total end-to-end**: 2-4 seconds per search

---

## Limitations & Future Improvements

| Limitation | Current Behavior | Potential Fix |
|---|---|---|
| Location matching is substring-only | "Arizona" matches "Arizona" but misses "Phoenix, AZ" if scraped data is inconsistent | Standardize location data in indexer |
| Remote jobs always included in location filter | "Arizona" search returns all remote jobs | Add a `prefer_onsite` flag to filters |
| No salary filtering in search | Salary shown but not ranked | Add `salary_range` filter to SearchFilters |
| No company size/stage filtering | Not exposed in vector search | Add `company_stage`, `company_size` to filters |
| Cerebras re-rank uses only top 40 candidates | Can miss good matches further down | Increase fetch multiplier (cost/performance tradeoff) |
| No temporal weighting | Old jobs ranked same as fresh jobs | Use `posted_date` in scoring |

