from sentence_transformers import SentenceTransformer
from config import settings
from typing import List
import logging

logger = logging.getLogger(__name__)

# BGE models use an instruction prefix on the QUERY side only.
# Documents (job listings) are embedded without any prefix.
BGE_QUERY_PREFIX = "Represent this job search query for matching relevant positions: "

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {settings.embedding_model}")
        _model = SentenceTransformer(settings.embedding_model)
        logger.info("Embedding model loaded.")
    return _model


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
