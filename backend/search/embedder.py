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

# Serialise ALL PyTorch inference calls so only one encode() runs at a time.
# Without this, concurrent requests (dashboard fires gaps + digest + search
# simultaneously) each allocate ~80-100 MB of PyTorch activation tensors on
# top of the already-loaded 130 MB model, which pushes past Render's 512 MB
# limit and triggers an OOM kill.  Serialising inference keeps peak RAM flat:
# baseline (~380 MB) + one inference spike (~80 MB) = ~460 MB — safe margin.
_inference_lock = threading.Lock()


def get_model() -> SentenceTransformer:
    """Return the singleton embedding model, loading it on first call."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                logger.info(f"Loading embedding model: {settings.embedding_model}")
                _model = SentenceTransformer(settings.embedding_model)
                logger.info("Embedding model loaded.")
    return _model


def warmup() -> None:
    """
    Pre-load the model into memory.
    Call once at server startup so the model is ready before any request
    arrives, eliminating the first-request latency and memory spike.
    """
    get_model()


def embed_query(text: str) -> List[float]:
    """Embed a search query — prepends BGE instruction prefix for better retrieval."""
    model = get_model()
    prefixed = BGE_QUERY_PREFIX + text
    with _inference_lock:
        vector = model.encode(prefixed, normalize_embeddings=True, show_progress_bar=False)
    return vector.tolist()


def embed_document(text: str) -> List[float]:
    """Embed a document (job listing) — no prefix."""
    model = get_model()
    with _inference_lock:
        vector = model.encode(text, normalize_embeddings=True, show_progress_bar=False)
    return vector.tolist()


def embed(text: str) -> List[float]:
    """Backward-compatible alias — used for document embedding."""
    return embed_document(text)


def embed_batch(texts: List[str]) -> List[List[float]]:
    """Batch embed documents (job listings) — no prefix. Used by the indexer only."""
    model = get_model()
    with _inference_lock:
        vectors = model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)
    return vectors.tolist()
