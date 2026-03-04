"""
RoleGPT FastAPI backend.
Run: uvicorn app:app --reload
"""
import logging
import sys
from pathlib import Path
from contextlib import asynccontextmanager

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import SearchRequest, SearchResponse, ExplainRequest, ExplainResponse
from search.vector_store import create_collection, count
from search.pipeline import run_search, run_explain
from indexer import main as run_indexer

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """On startup: ensure Qdrant collection exists and is populated."""
    create_collection()
    if count() == 0:
        logger.info("No jobs indexed yet. Running indexer...")
        run_indexer()
    else:
        logger.info(f"Qdrant has {count()} jobs indexed.")
    yield


app = FastAPI(title="RoleGPT API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "jobs_indexed": count()}


@app.post("/api/search", response_model=SearchResponse)
async def search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    results = run_search(
        query=req.query,
        top_k=req.top_k,
        filters=req.filters,
    )

    return SearchResponse(
        results=results,
        total=len(results),
        query=req.query,
    )


@app.post("/api/explain", response_model=ExplainResponse)
async def explain(req: ExplainRequest):
    result = run_explain(query=req.query, job_id=req.job_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Job {req.job_id} not found.")

    return ExplainResponse(
        match_score=result.get("match_score", 70),
        strengths=result.get("strengths", []),
        gaps=result.get("gaps", []),
        suggestion=result.get("suggestion", ""),
    )
