from fastembed import TextEmbedding
from config import settings
from typing import List
import logging

logger = logging.getLogger(__name__)

_model: TextEmbedding | None = None


def get_model() -> TextEmbedding:
    """Return the singleton embedding model, downloading on first call."""
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {settings.embedding_model}")
        _model = TextEmbedding(model_name=settings.embedding_model)
        logger.info("Embedding model ready.")
    return _model


def warmup() -> None:
    """
    Pre-load the model at server startup.
    fastembed downloads the ONNX model file (~33 MB) on first init and caches
    it to ~/.cache/fastembed. Subsequent starts load from cache in < 1 second.
    """
    get_model()


def embed_query(text: str) -> List[float]:
    """
    Embed a search query.
    fastembed automatically applies the BGE query instruction prefix
    ("Represent this sentence for searching relevant passages: ") when using
    query_embed(), which is the correct behaviour for retrieval workloads.
    """
    model = get_model()
    result = list(model.query_embed([text]))
    return result[0].tolist()


def embed_document(text: str) -> List[float]:
    """Embed a single document (job listing) without any query prefix."""
    model = get_model()
    result = list(model.embed([text]))
    return result[0].tolist()


def embed(text: str) -> List[float]:
    """Backward-compatible alias — used for document embedding."""
    return embed_document(text)


def embed_batch(texts: List[str]) -> List[List[float]]:
    """
    Batch embed documents (job listings).
    fastembed handles internal batching via ONNX — no batch_size tuning needed.
    """
    model = get_model()
    results = list(model.embed(texts))
    return [r.tolist() for r in results]
