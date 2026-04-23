"""
Natural language job search query parser.
Extracts structured intent from free-form queries.
Uses Cerebras when available; falls back to regex heuristics.
"""
import re
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

_PARSE_PROMPT = """Extract the structured search intent from this job search query.

Query: "{query}"

Return ONLY valid JSON with NO markdown or code fences:
{{
  "clean_query": "<core role/skill search intent — strip filler words, location phrases, and conversational fluff>",
  "location": "<city, state, or country if mentioned, otherwise null>",
  "remote": <true if remote work is mentioned, false if on-site mentioned, null if not mentioned>,
  "experience_level": "<entry|junior|mid|senior|staff|principal or null>",
  "skills": ["<main keyword or skill>"],
  "company_stages": ["<startup|Series A|Series B|enterprise|scaleup>"],
  "role_type": "<full-time|contract|internship|part-time|freelance or null>",
  "salary_min": <number or null>,
  "salary_max": <number or null>,
  "excludes": ["<negative keyword>"]
}}

Rules:
- clean_query should be 2-8 words capturing the role and key context (e.g. "AI engineer", "senior backend engineer startup", "data scientist machine learning")
- Do not include location, filler phrases ("I want to see", "show me", "find me"), or conversational text in clean_query
- location should be the place name exactly as mentioned (e.g. "Arizona", "San Francisco", "New York")
- skills should capture the most important technologies or terms from the query (e.g. "Python", "React", "LLM")
- company_stages should include explicit preferences like "startup", "Series A", "enterprise"
- excludes should capture negative constraints like "no banking", "not FAANG", "without Excel"

Examples:
- "I want to see AI engineer roles in Arizona" → {{"clean_query": "AI engineer", "location": "Arizona", "remote": null, "skills": ["AI", "Engineer"], "company_stages": [], "role_type": null, "salary_min": null, "salary_max": null, "excludes": []}}
- "Find me remote Python developer jobs" → {{"clean_query": "Python developer", "location": null, "remote": true, "skills": ["Python"], "company_stages": [], "role_type": null, "salary_min": null, "salary_max": null, "excludes": []}}
- "Senior backend engineer at a startup in San Francisco" → {{"clean_query": "senior backend engineer startup", "location": "San Francisco", "remote": null, "skills": ["backend", "engineer"], "company_stages": ["startup"], "role_type": null, "salary_min": null, "salary_max": null, "excludes": []}}
- "machine learning researcher" → {{"clean_query": "machine learning researcher", "location": null, "remote": null, "skills": ["Machine Learning"], "company_stages": [], "role_type": null, "salary_min": null, "salary_max": null, "excludes": []}}
- "show me data science roles in New York that are on-site" → {{"clean_query": "data scientist", "location": "New York", "remote": false, "skills": ["data science"], "company_stages": [], "role_type": null, "salary_min": null, "salary_max": null, "excludes": []}}"""


# ── Regex fallback ─────────────────────────────────────────────────────────────

_LOCATION_RE = re.compile(
    r"\b(?:in|near|at|around|based in|located in|from)\s+((?:[A-Z][\w'.-]*\s+)*[A-Z][\w'.-]*)",
)
_REMOTE_RE = re.compile(r'\b(?:remote|work from home|wfh|work remotely|fully remote|distributed)\b', re.IGNORECASE)
_ONSITE_RE = re.compile(r'\b(?:on-?site|in-?office|in person|in-?person)\b', re.IGNORECASE)
_FILLER_RE = re.compile(
    r'\b(?:i want to(?: see)?|show me|find me|looking for|search for|'
    r"i(?:'m| am) looking for|can you find|please find|give me|suggest|"
    r'i need|are there any|do you have)\b',
    re.IGNORECASE,
)

_EXPERIENCE_PATTERNS = {
    "principal": re.compile(r'\bprincipal\b', re.IGNORECASE),
    "staff": re.compile(r'\bstaff\b', re.IGNORECASE),
    "senior": re.compile(r'\bsenior|sr\.?\b', re.IGNORECASE),
    "mid": re.compile(r'\bmid(?:-?level)?\b', re.IGNORECASE),
    "junior": re.compile(r'\bjunior|jr\.?\b', re.IGNORECASE),
    "entry": re.compile(r'\bentry(?:-?level)?\b|\bnew grad\b|\bgraduate\b', re.IGNORECASE),
}

_ROLE_TYPE_PATTERNS = {
    "contract": re.compile(r'\bcontract(?:or)?\b', re.IGNORECASE),
    "internship": re.compile(r'\bintern(?:ship|s)?\b', re.IGNORECASE),
    "part-time": re.compile(r'\bpart[- ]?time\b', re.IGNORECASE),
    "freelance": re.compile(r'\bfreelance\b', re.IGNORECASE),
    "full-time": re.compile(r'\bfull[- ]?time\b|\bfte\b', re.IGNORECASE),
}

_COMPANY_STAGE_PATTERNS = {
    "startup": re.compile(r'\bstartup|start-up\b', re.IGNORECASE),
    "pre-seed": re.compile(r'\bpre[- ]seed\b', re.IGNORECASE),
    "seed": re.compile(r'\bseed\b', re.IGNORECASE),
    "series a": re.compile(r'\bseries\s*a\b', re.IGNORECASE),
    "series b": re.compile(r'\bseries\s*b\b', re.IGNORECASE),
    "series c": re.compile(r'\bseries\s*c\b', re.IGNORECASE),
    "scaleup": re.compile(r'\bscale[- ]?up\b', re.IGNORECASE),
    "enterprise": re.compile(r'\benterprise\b', re.IGNORECASE),
}

_COMMON_SKILL_ALIASES = {
    "backend": "Backend",
    "frontend": "Frontend",
    "fullstack": "Fullstack",
    "devops": "DevOps",
    "platform": "Platform",
    "infrastructure": "Infrastructure",
    "security": "Security",
    "cloud": "Cloud",
    "data": "Data",
    "mobile": "Mobile",
    "product": "Product",
    "ai": "AI",
    "js": "JavaScript",
    "ts": "TypeScript",
    "python": "Python",
    "react": "React",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "node": "Node.js",
    "nodejs": "Node.js",
    "go": "Go",
    "golang": "Go",
    "rust": "Rust",
    "java": "Java",
    "sql": "SQL",
    "postgres": "Postgres",
    "postgresql": "Postgres",
    "aws": "AWS",
    "gcp": "GCP",
    "azure": "Azure",
    "llm": "LLM",
    "ml": "ML",
    "machine learning": "Machine Learning",
    "kubernetes": "Kubernetes",
    "docker": "Docker",
    "terraform": "Terraform",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "spark": "Spark",
    "airflow": "Airflow",
    "kafka": "Kafka",
    "redis": "Redis",
    "graphql": "GraphQL",
    "api": "API",
    "llama": "LLM",
}

_COMMON_SKILL_PATTERNS = sorted(_COMMON_SKILL_ALIASES.keys(), key=len, reverse=True)

_SALARY_RANGE_RE = re.compile(
    r'(?P<min>\d{2,3}(?:\.\d+)?)\s*(?P<min_suffix>k|K)?\s*(?:-|to|and)\s*(?P<max>\d{2,3}(?:\.\d+)?)\s*(?P<max_suffix>k|K)?',
    re.IGNORECASE,
)
_SALARY_AT_LEAST_RE = re.compile(r'(?:(?:above|over|at least|minimum of|min(?:imum)?))\s*\$?(?P<min>\d{2,3}(?:\.\d+)?)\s*(?P<suffix>k|K)?', re.IGNORECASE)
_SALARY_AT_MOST_RE = re.compile(r'(?:(?:up to|under|below|max(?:imum)? of|no more than))\s*\$?(?P<max>\d{2,3}(?:\.\d+)?)\s*(?P<suffix>k|K)?', re.IGNORECASE)
_EXCLUDE_RE = re.compile(r'\b(?:no|not|without|exclude|excluding)\s+([^,.;]+)', re.IGNORECASE)
_SALARY_CLAUSE_RE = re.compile(r'\b(?:paying|salary|compensation|comp(?:\s+range)?)\b[^,.;]*', re.IGNORECASE)
_SENIORITY_WORDS = {"entry", "junior", "mid", "senior", "staff", "principal", "sr", "jr"}
_GENERIC_ROLE_WORDS = {
    "engineer", "developer", "analyst", "scientist", "manager", "architect",
    "specialist", "lead", "head", "intern", "consultant", "designer", "administrator",
}
_SKILL_STOPWORDS = {
    "and", "or", "with", "for", "the", "a", "an", "to", "of", "in", "on", "at", "from",
    "roles", "role", "jobs", "job", "positions", "position", "work", "find", "show", "want",
    "see", "looking", "search", "please", "give", "need", "remote", "onsite", "on-site",
    "startup", "start-up", "seed", "series", "enterprise", "scaleup", "full-time", "contract",
    "internship", "part-time", "freelance", "senior", "junior", "mid", "staff", "principal",
}
_CLEAN_JOB_WORDS = re.compile(r'\b(?:jobs?|roles?|positions?|openings?|opportunities?|gigs?)\b', re.IGNORECASE)


def _normalize_salary_value(value: str, suffix: Optional[str]) -> Optional[int]:
    try:
        number = float(value)
        if suffix:
            number *= 1000
        elif number < 1000:
            number *= 1000
        return int(number)
    except Exception:
        return None


def _dedupe_preserve_order(items: List[str]) -> List[str]:
    seen = set()
    output: List[str] = []
    for item in items:
        key = item.strip().lower()
        if key and key not in seen:
            seen.add(key)
            output.append(item.strip())
    return output


def _normalize_string_list(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    normalized = [str(item).strip() for item in value if str(item).strip()]
    return _dedupe_preserve_order(normalized)


def _extract_skills(query: str) -> List[str]:
    text = query.lower()
    found: List[str] = []
    location = _extract_location(query)
    location_tokens = set(re.split(r"\s+", location.lower())) if location else set()
    for pattern in _COMMON_SKILL_PATTERNS:
        if re.search(rf'\b{re.escape(pattern)}\b', text):
            found.append(_COMMON_SKILL_ALIASES[pattern])
    for token in re.findall(r"\b[A-Za-z][A-Za-z0-9+.#/-]{1,}\b", query):
        lowered = token.lower()
        if lowered in _SKILL_STOPWORDS or lowered in _SENIORITY_WORDS or lowered in _GENERIC_ROLE_WORDS:
            continue
        if lowered in _COMMON_SKILL_ALIASES:
            continue
        if lowered in location_tokens:
            continue
        if token[0].isupper() and len(token) > 1 and token.lower() not in {"senior", "junior", "mid", "staff", "principal"}:
            found.append(token)
    return _dedupe_preserve_order(found)


def _extract_location(query: str) -> Optional[str]:
    matches = list(_LOCATION_RE.finditer(query))
    if not matches:
        return None
    location = matches[-1].group(1).strip()
    location = re.sub(r'\s+(?:paying|salary|compensation|with|for|that|which|and|or|but|remote|onsite|on-site|in-office|available).*$', '', location, flags=re.IGNORECASE).strip(' ,.')
    return location.title() if location else None


def _extract_experience_level(query: str) -> Optional[str]:
    for level, pattern in _EXPERIENCE_PATTERNS.items():
        if pattern.search(query):
            return level
    return None


def _extract_role_type(query: str) -> Optional[str]:
    for role_type, pattern in _ROLE_TYPE_PATTERNS.items():
        if pattern.search(query):
            return role_type
    return None


def _extract_company_stages(query: str) -> List[str]:
    stages: List[str] = []
    for stage, pattern in _COMPANY_STAGE_PATTERNS.items():
        if pattern.search(query):
            stages.append(stage)
    return _dedupe_preserve_order(stages)


def _extract_salary_bounds(query: str) -> tuple[Optional[int], Optional[int]]:
    salary_min = None
    salary_max = None
    match = _SALARY_RANGE_RE.search(query)
    if match:
        salary_min = _normalize_salary_value(match.group("min"), match.group("min_suffix"))
        salary_max = _normalize_salary_value(match.group("max"), match.group("max_suffix"))
        return salary_min, salary_max

    match = _SALARY_AT_LEAST_RE.search(query)
    if match:
        salary_min = _normalize_salary_value(match.group("min"), match.group("suffix"))

    match = _SALARY_AT_MOST_RE.search(query)
    if match:
        salary_max = _normalize_salary_value(match.group("max"), match.group("suffix"))

    return salary_min, salary_max


def _extract_excludes(query: str) -> List[str]:
    excludes: List[str] = []
    for match in _EXCLUDE_RE.finditer(query):
        phrase = match.group(1)
        phrase = re.split(r'\b(?:and|or|but|,|;|\.|$)', phrase, maxsplit=1)[0]
        phrase = phrase.strip()
        if phrase:
            excludes.append(phrase)
    return _dedupe_preserve_order(excludes)


def _regex_parse(query: str) -> Dict[str, Any]:
    location = _extract_location(query)

    remote = None
    if _REMOTE_RE.search(query):
        remote = True
    elif _ONSITE_RE.search(query):
        remote = False

    clean = _FILLER_RE.sub('', query)
    if location:
        clean = re.sub(
            rf'\b(?:in|near|at|around|based in|located in)\s+{re.escape(location)}\b',
            '', clean, flags=re.IGNORECASE,
        )
    if _REMOTE_RE.search(query):
        clean = _REMOTE_RE.sub('', clean)
    clean = _SALARY_CLAUSE_RE.sub('', clean)
    clean = _SALARY_RANGE_RE.sub('', clean)
    clean = _SALARY_AT_LEAST_RE.sub('', clean)
    clean = _SALARY_AT_MOST_RE.sub('', clean)
    clean = _EXCLUDE_RE.sub('', clean)
    clean = _CLEAN_JOB_WORDS.sub('', clean)
    for stage in _COMPANY_STAGE_PATTERNS:
        clean = re.sub(rf'\b(?:at|in|near|around|from|based in|located in)?\s*(?:a|an|the)?\s*{re.escape(stage)}\b', '', clean, flags=re.IGNORECASE)
    if _extract_role_type(query):
        for role_type in _ROLE_TYPE_PATTERNS:
            clean = re.sub(rf'\b{re.escape(role_type)}\b', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\s+', ' ', clean).strip(' ,.')
    if not clean:
        clean = query

    salary_min, salary_max = _extract_salary_bounds(query)

    return {
        "clean_query": clean,
        "location": location,
        "remote": remote,
        "experience_level": _extract_experience_level(query),
        "skills": _extract_skills(query),
        "company_stages": _extract_company_stages(query),
        "role_type": _extract_role_type(query),
        "salary_min": salary_min,
        "salary_max": salary_max,
        "excludes": _extract_excludes(query),
    }


# ── Main entry point ───────────────────────────────────────────────────────────

def parse_intent(query: str) -> Dict[str, Any]:
    """
    Parse a natural language query into structured search intent.

    Returns:
        clean_query: str            — role/skill query for semantic embedding
        location:    str | None     — extracted location filter
        remote:      bool | None    — True = remote only, False = on-site, None = any
        experience_level: str|None  — extracted seniority cue
        skills:      list[str]      — main keywords and skills
        company_stages: list[str]   — startup / seed / Series A / enterprise cues
        role_type:   str | None     — full-time, contract, internship, etc.
        salary_min:  int | None     — minimum salary hint, in annual dollars if mentioned
        salary_max:  int | None     — maximum salary hint, in annual dollars if mentioned
        excludes:    list[str]      — negative constraints
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
            "location": result.get("location"),
            "remote": result.get("remote"),
            "experience_level": result.get("experience_level"),
            "skills": _normalize_string_list(result.get("skills")),
            "company_stages": _normalize_string_list(result.get("company_stages")),
            "role_type": result.get("role_type"),
            "salary_min": result.get("salary_min"),
            "salary_max": result.get("salary_max"),
            "excludes": _normalize_string_list(result.get("excludes")),
        }
    except Exception as e:
        logger.warning(f"Query intent parsing via Cerebras failed, using regex fallback: {e}")
        return _regex_parse(query)
