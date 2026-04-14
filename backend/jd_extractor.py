"""
Job description extraction from a URL.
Fetches the page, strips HTML, and extracts job details via Cerebras.
"""
import json
import re
import logging
from typing import Dict, Any

import requests
from bs4 import BeautifulSoup

from config import settings

logger = logging.getLogger(__name__)

_EXTRACT_PROMPT = """You are a job description parser. Extract the job details from this web page text.

Page text:
{page_text}

Extract these fields:
- title: job title (string)
- company: company name (string)
- description: full job description text (string — preserve as much detail as possible)
- requirements: list of requirement strings (array of strings)
- location: office location or "Remote" (string)
- remote: true if the role is remote-friendly, false otherwise (boolean)

Return ONLY valid JSON, no markdown or code fences:
{{
  "title": "...",
  "company": "...",
  "description": "...",
  "requirements": ["..."],
  "location": "...",
  "remote": false
}}"""


def fetch_and_extract(url: str) -> Dict[str, Any]:
    """Fetch a job posting URL, strip HTML, and extract structured job details."""
    try:
        resp = requests.get(
            url,
            timeout=15,
            headers={"User-Agent": "Mozilla/5.0 (compatible; DirectBot/1.0)"},
        )
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Could not fetch URL: {e}")

    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()
    page_text = re.sub(r"\s+", " ", soup.get_text(separator="\n")).strip()

    if not settings.cerebras_api_key:
        # Fallback: return raw text without LLM parsing
        return {
            "title": "",
            "company": "",
            "description": page_text[:4000],
            "requirements": [],
            "location": "",
            "remote": False,
        }

    from cerebras.cloud.sdk import Cerebras
    client = Cerebras(api_key=settings.cerebras_api_key)

    prompt = _EXTRACT_PROMPT.format(page_text=page_text[:6000])
    try:
        response = client.chat.completions.create(
            model=settings.cerebras_model,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        logger.error(f"JD extraction LLM parsing failed: {e}")
        return {
            "title": "",
            "company": "",
            "description": page_text[:4000],
            "requirements": [],
            "location": "",
            "remote": False,
        }
