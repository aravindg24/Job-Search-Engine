"""
Natural language job search query parser.
Extracts structured intent (role, location, remote) from free-form queries.
Uses Cerebras when available; falls back to regex heuristics.
"""
import re
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

_PARSE_PROMPT = """Extract the structured search intent from this job search query.

Query: "{query}"

Return ONLY valid JSON with NO markdown or code fences:
{{
  "clean_query": "<core role/skill search intent — strip filler words, location phrases, and conversational fluff>",
  "location": "<city, state, or country if mentioned, otherwise null>",
  "remote": <true if remote work is mentioned, false if on-site mentioned, null if not mentioned>
}}

Rules:
- clean_query should be 2-8 words capturing the role and key context (e.g. "AI engineer", "senior backend engineer startup", "data scientist machine learning")
- Do not include location, filler phrases ("I want to see", "show me", "find me"), or conversational text in clean_query
- location should be the place name exactly as mentioned (e.g. "Arizona", "San Francisco", "New York")

Examples:
- "I want to see AI engineer roles in Arizona" → {{"clean_query": "AI engineer", "location": "Arizona", "remote": null}}
- "Find me remote Python developer jobs" → {{"clean_query": "Python developer", "location": null, "remote": true}}
- "Senior backend engineer at a startup in San Francisco" → {{"clean_query": "senior backend engineer startup", "location": "San Francisco", "remote": null}}
- "machine learning researcher" → {{"clean_query": "machine learning researcher", "location": null, "remote": null}}
- "show me data science roles in New York that are on-site" → {{"clean_query": "data scientist", "location": "New York", "remote": false}}"""


# ── Regex fallback ─────────────────────────────────────────────────────────────

_LOCATION_RE = re.compile(
    r'\b(?:in|near|at|around|based in|located in|from)\s+([A-Z][a-zA-Z ]+?)(?=\s*$|\s*[,.]|\s+(?:job|role|position|opening|opportunit|that|which|and\b))',
    re.IGNORECASE,
)
_REMOTE_RE   = re.compile(r'\b(?:remote|work from home|wfh|work remotely|fully remote|distributed)\b', re.IGNORECASE)
_ONSITE_RE   = re.compile(r'\b(?:on-?site|in-?office|in person|in-?person)\b', re.IGNORECASE)
_FILLER_RE   = re.compile(
    r'\b(?:i want to(?: see)?|show me|find me|looking for|search for|'
    r"i(?:'m| am) looking for|can you find|please find|give me|suggest|"
    r'i need|are there any|do you have)\b',
    re.IGNORECASE,
)


def _regex_parse(query: str) -> Dict[str, Any]:
    location = None
    m = _LOCATION_RE.search(query)
    if m:
        location = m.group(1).strip().title()

    remote = None
    if _REMOTE_RE.search(query):
        remote = True
    elif _ONSITE_RE.search(query):
        remote = False

    # Strip filler and location phrases to get a clean embedding query
    clean = _FILLER_RE.sub('', query)
    if location:
        clean = re.sub(
            rf'\b(?:in|near|at|around|based in|located in)\s+{re.escape(location)}\b',
            '', clean, flags=re.IGNORECASE,
        )
    if _REMOTE_RE.search(query):
        clean = _REMOTE_RE.sub('', clean)
    clean = re.sub(r'\s+', ' ', clean).strip(' ,.')
    if not clean:
        clean = query  # nothing left — use original

    return {"clean_query": clean, "location": location, "remote": remote}


# ── Main entry point ───────────────────────────────────────────────────────────

def parse_intent(query: str) -> Dict[str, Any]:
    """
    Parse a natural language query into structured search intent.

    Returns:
        clean_query: str   — role/skill query for semantic embedding
        location:    str | None — extracted location filter
        remote:      bool | None — True = remote only, False = on-site, None = any
    """
    from config import settings

    if not settings.cerebras_api_key:
        return _regex_parse(query)

    try:
        from cerebras.cloud.sdk import Cerebras
        client = Cerebras(api_key=settings.cerebras_api_key)
        response = client.chat.completions.create(
            model=settings.cerebras_model,
            messages=[{"role": "user", "content": _PARSE_PROMPT.format(query=query)}],
        )
        text = response.choices[0].message.content.strip()
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        result = json.loads(text)
        return {
            "clean_query": (result.get("clean_query") or query).strip() or query,
            "location":    result.get("location"),
            "remote":      result.get("remote"),
        }
    except Exception as e:
        logger.warning(f"Query intent parsing via Cerebras failed, using regex fallback: {e}")
        return _regex_parse(query)
