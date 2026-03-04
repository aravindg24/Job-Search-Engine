import uuid
from typing import Optional
import re


def make_id(prefix: str = "job") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def clean_text(text: str) -> str:
    """Remove excess whitespace and HTML entities."""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&\w+;", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_remote(text: str) -> bool:
    keywords = ["remote", "work from home", "wfh", "distributed team", "anywhere"]
    return any(k in text.lower() for k in keywords)
