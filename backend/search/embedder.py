from sentence_transformers import SentenceTransformer
from config import settings
from typing import List
import logging
import threading

logger = logging.getLogger(__name__)

# BGE models use an instruction prefix on the QUERY side only.
# Documents (job listings) are embedded without any prefix.
BGE_QUERY_PREFIX = "Represent this job search query for matching relevant positions: "

_model: SentenceTransformer | None = None
_model_lock = threading.Lock()


def get_model() -> SentenceTransformer:
    """
    Return the singleton embedding model, loading it on first call.

    The lock prevents the OOM crash that occurs when the dashboard fires
    /api/gaps, /api/digest, and /api/search simultaneously on a cold server:
    without the lock all three requests see _model=None and each starts a
    ~130 MB model load concurrently, pushing a 512 MB Render instance over
    its limit.  With the lock only the first request loads; the rest wait
    and reuse the already-loaded model.
    """
    global _model
    if _model is None:
        with _model_lock:
            # Double-checked locking — re-check after acquiring the lock
            # because another thread may have loaded it while we waited.
            if _model is None:
                logger.info(f"Loading embedding model: {settings.embedding_model}")
                _model = SentenceTransformer(settings.embedding_model)
                logger.info("Embedding model loaded.")
    return _model


def warmup() -> None:
    """
    Pre-load the model into memory.
    Call this once at server startup so the model is ready before any
    request arrives, eliminating the first-request latency spike.
    """
    get_model()


def embed_query(text: str) -> List[float]:
    """Embed a search query — prepends BGE instruction prefix for better retrieval."""
    model = get_model()
    prefixed = BGE_QUERY_PREFIX + text
    vector = model.encode(prefixed, normalize_embeddings=True)
    return vector.tolist()


def embed_document(text: str) -> List[float]:
    """Embed a document (job listing) — no prefix."""
    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def embed(text: str) -> List[float]:
    """Backward-compatible alias — used for document embedding."""
    return embed_document(text)


def embed_batch(texts: List[str]) -> List[List[float]]:
    """Batch embed documents (job listings) — no prefix."""
    model = get_model()
    vectors = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return vectors.tolist()
