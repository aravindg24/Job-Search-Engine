"""
Search pipeline: embed → vector search → LLM re-rank → format response.
"""
from typing import List, Optional, Dict, Any
from search.embedder import embed_query
from search.vector_store import search
from search.reranker import rerank, explain as reranker_explain
from models import JobResult, SearchFilters
import logging

logger = logging.getLogger(__name__)


def run_search(
    query: str,
    top_k: int = 10,
    filters: Optional[SearchFilters] = None,
    resume_profile: Optional[Dict[str, Any]] = None,
) -> List[JobResult]:
    """Full search pipeline: embed → search → rerank → return."""
    # Step 1: Embed the query (BGE query prefix applied inside embed_query)
    query_vector = embed_query(query)

    # Step 2: Vector search — fetch 2x for re-ranking headroom
    filter_dict = None
    if filters:
        filter_dict = {}
        if filters.remote is not None:
            filter_dict["remote"] = filters.remote

    candidates = search(query_vector, top_k=top_k * 2, filters=filter_dict)

    if not candidates:
        return []

    # Step 3: LLM re-rank (pass resume profile for richer scoring)
    reranked = rerank(query, candidates, resume_profile=resume_profile)

    # Step 4: Take top_k and format
    results = []
    for item in reranked[:top_k]:
        payload = item["payload"]
        results.append(JobResult(
            id=item["id"],
            title=payload.get("title", ""),
            company=payload.get("company", ""),
            location=payload.get("location", ""),
            remote=payload.get("remote", False),
            description=payload.get("description", ""),
            requirements=payload.get("requirements", []),
            salary_range=payload.get("salary_range"),
            company_stage=payload.get("company_stage"),
            source=payload.get("source", ""),
            source_url=payload.get("source_url"),
            posted_date=payload.get("posted_date"),
            tags=payload.get("tags", []),
            match_score=item.get("match_score"),
            match_reason=item.get("match_reason"),
        ))

    return results


def run_explain(query: str, job_id: str) -> Optional[Dict[str, Any]]:
    """Get detailed match explanation for a specific job."""
    from search.vector_store import get_client, _to_uuid
    from config import settings

    client = get_client()
    results = client.retrieve(
        collection_name=settings.qdrant_collection,
        ids=[_to_uuid(job_id)],
        with_payload=True,
    )

    if not results:
        return None

    job = results[0].payload
    return reranker_explain(query, job)
