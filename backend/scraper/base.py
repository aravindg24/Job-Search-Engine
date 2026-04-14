import uuid
import re
import requests
import logging
from typing import Optional, Tuple
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # DNS namespace


def make_id(prefix: str = "job") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def make_deterministic_id(source_url: str) -> str:
    """Generate a stable UUID from a job's source URL — safe to call repeatedly."""
    return str(uuid.uuid5(_NAMESPACE, source_url))


def clean_text(text: str) -> str:
    """Remove excess whitespace and HTML entities."""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&\w+;", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_remote(text: str) -> bool:
    keywords = ["remote", "work from home", "wfh", "distributed team", "anywhere"]
    return any(k in text.lower() for k in keywords)


@retry(
    retry=retry_if_exception_type(requests.exceptions.RequestException),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
def fetch_with_retry(url: str, timeout: int = 15, **kwargs) -> requests.Response:
    """HTTP GET with exponential-backoff retry (3 attempts, 2–10 s waits)."""
    resp = requests.get(url, timeout=timeout, **kwargs)
    resp.raise_for_status()
    return resp


def parse_salary(value) -> Tuple[Optional[int], Optional[int]]:
    """
    Parse a salary value into (salary_min, salary_max) integers (annual USD).
    Accepts:
      - int / float  → treated as annual figure
      - str          → extracts first 1–2 numbers, scales up if looks hourly (<500)
    Returns (None, None) if parsing fails.
    """
    if value is None:
        return None, None
    try:
        if isinstance(value, (int, float)):
            n = int(value)
            if n < 500:          # hourly rate → annualise (2080 hrs)
                n = n * 2080
            return n, n
        text = str(value).replace(",", "").replace("$", "")
        nums = [int(m) for m in re.findall(r"\d+", text)]
        if not nums:
            return None, None
        # Filter out numbers too small to be a salary or hourly rate (e.g. "10+ years")
        nums = [n for n in nums if n >= 15]
        if not nums:
            return None, None
        nums = [n * 2080 if n < 500 else n for n in nums]  # hourly → annual
        # Drop annualised values below a plausible minimum salary
        nums = [n for n in nums if n >= 15000]
        if not nums:
            return None, None
        return nums[0], nums[-1]
    except Exception:
        return None, None
