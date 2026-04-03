from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from config import settings
from typing import List, Dict, Any, Optional
import logging
import uuid

_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # UUID namespace DNS

logger = logging.getLogger(__name__)

VECTOR_SIZE = 384  # bge-small-en-v1.5 and MiniLM both output 384 dims

_client: QdrantClient | None = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        if settings.qdrant_cloud_url:
            # Production: Qdrant Cloud
            logger.info(f"Connecting to Qdrant Cloud: {settings.qdrant_cloud_url}")
            _client = QdrantClient(
                url=settings.qdrant_cloud_url,
                api_key=settings.qdrant_api_key,
            )
        else:
            # Local development: in-memory
            logger.info("Using Qdrant in-memory mode (local dev)")
            _client = QdrantClient(":memory:")
    return _client


def create_collection() -> None:
    """Drop and recreate the collection so every indexer run starts with only live jobs."""
    client = get_client()
    collections = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection in collections:
        client.delete_collection(settings.qdrant_collection)
        logger.info(f"Dropped existing collection: {settings.qdrant_collection}")
    client.create_collection(
        collection_name=settings.qdrant_collection,
        vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
    )
    logger.info(f"Created fresh collection: {settings.qdrant_collection}")


def _to_uuid(job_id: str) -> str:
    """Convert any string ID to a deterministic UUID5."""
    try:
        uuid.UUID(job_id)
        return job_id  # already a valid UUID
    except ValueError:
        return str(uuid.uuid5(_NAMESPACE, job_id))


def upsert(job_id: str, vector: List[float], payload: Dict[str, Any]) -> None:
    client = get_client()
    payload = {**payload, "original_id": job_id}
    client.upsert(
        collection_name=settings.qdrant_collection,
        points=[PointStruct(id=_to_uuid(job_id), vector=vector, payload=payload)],
    )


def upsert_batch(points: List[Dict[str, Any]]) -> None:
    """points: list of {id, vector, payload}"""
    client = get_client()
    structs = [
        PointStruct(
            id=_to_uuid(p["id"]),
            vector=p["vector"],
            payload={**p["payload"], "original_id": p["id"]},
        )
        for p in points
    ]
    client.upsert(collection_name=settings.qdrant_collection, points=structs)
    logger.info(f"Upserted {len(structs)} points into Qdrant.")


def search(
    query_vector: List[float],
    top_k: int = 20,
    filters: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    client = get_client()

    qdrant_filter = None
    if filters:
        conditions = []
        if filters.get("remote") is not None:
            conditions.append(FieldCondition(key="remote", match=MatchValue(value=filters["remote"])))
        if conditions:
            qdrant_filter = Filter(must=conditions)

    results = client.search(
        collection_name=settings.qdrant_collection,
        query_vector=query_vector,
        limit=top_k,
        query_filter=qdrant_filter,
        with_payload=True,
    )

    return [
        {"score": r.score, "payload": r.payload, "id": r.payload.get("original_id", str(r.id))}
        for r in results
    ]



def count() -> int:
    client = get_client()
    return client.count(collection_name=settings.qdrant_collection).count
