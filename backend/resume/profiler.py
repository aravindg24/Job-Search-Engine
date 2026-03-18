"""
Cerebras-based structured profile extraction from resume text.
"""
import json
import re
import logging
from typing import Dict, Any, Optional

from config import settings

logger = logging.getLogger(__name__)

_PARSE_PROMPT = """Parse the following resume text into a structured JSON profile.

Extract:
- name: full name
- summary: 2-sentence professional summary
- skills: object with keys: languages, frameworks, ml_ai, cloud, databases, other (each an array of strings)
- experience_years: integer years of total professional experience
- education: array of {{degree, field, school, year}}
- projects: array of {{name, tech (array), description (1 sentence)}}
- work_history: array of {{company, role, duration}}

Resume text:
{text}

Return ONLY valid JSON, no markdown formatting, no code fences."""


def parse_profile(resume_text: str) -> Dict[str, Any]:
    """Send resume text to Cerebras and return structured profile dict."""
    if not settings.cerebras_api_key:
        logger.warning("No Cerebras API key — returning minimal profile")
        return _fallback_profile(resume_text)

    from cerebras.cloud.sdk import Cerebras
    client = Cerebras(api_key=settings.cerebras_api_key)

    prompt = _PARSE_PROMPT.format(text=resume_text[:8000])

    try:
        response = client.chat.completions.create(
            model=settings.cerebras_model,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        profile = json.loads(raw)
        logger.info(f"Parsed resume profile for: {profile.get('name', 'Unknown')}")
        return profile
    except Exception as e:
        logger.error(f"Cerebras profile parsing failed: {e}")
        return _fallback_profile(resume_text)


def _fallback_profile(resume_text: str) -> Dict[str, Any]:
    """Regex-based fallback when Cerebras is unavailable."""
    text_lower = resume_text.lower()

    name = "Unknown"
    for line in resume_text.splitlines():
        line = line.strip()
        if line and len(line.split()) <= 5 and not any(c in line for c in ["@", "http", "|", "+"]):
            name = line
            break

    skill_map = {
        "languages": ["python", "javascript", "typescript", "java", "c++", "golang", "go", "rust",
                      "scala", "kotlin", "swift", "ruby", "r", "matlab", "bash", "shell"],
        "frameworks": ["react", "angular", "vue", "fastapi", "flask", "django", "express",
                       "spring", "nextjs", "next.js", "nodejs", "node.js", "langchain",
                       "pytorch", "tensorflow", "sklearn", "scikit-learn", "pandas", "numpy"],
        "ml_ai": ["llm", "rag", "gpt", "bert", "transformer", "fine-tuning", "yolo", "clip",
                  "diffusion", "embedding", "vector search", "nlp", "computer vision",
                  "machine learning", "deep learning", "reinforcement learning"],
        "cloud": ["aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ci/cd",
                  "github actions", "jenkins", "vercel", "render", "railway", "heroku"],
        "databases": ["postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite",
                      "dynamodb", "supabase", "qdrant", "pinecone", "elasticsearch", "kafka"],
        "other": ["graphql", "rest", "grpc", "microservices", "agile", "scrum", "git",
                  "linux", "spark", "airflow", "dbt"],
    }

    found: Dict[str, list] = {k: [] for k in skill_map}
    for category, keywords in skill_map.items():
        for kw in keywords:
            if kw in text_lower:
                display = kw.upper() if len(kw) <= 3 else kw.title()
                if display not in found[category]:
                    found[category].append(display)

    years = 0
    for m in re.finditer(r"(\d+)\+?\s*(?:years?|yrs?)", text_lower):
        y = int(m.group(1))
        if 1 <= y <= 20:
            years = max(years, y)

    return {
        "name": name,
        "summary": "Profile extracted from resume text (AI parsing unavailable).",
        "skills": found,
        "experience_years": years,
        "education": [],
        "projects": [],
        "work_history": [],
        "_raw_snippet": resume_text[:500],
    }


def build_search_context(profile: Dict[str, Any]) -> str:
    """Build a concise text block from a parsed profile for query enrichment."""
    skills = profile.get("skills", {})
    all_skills = []
    for v in skills.values():
        if isinstance(v, list):
            all_skills.extend(v)

    projects = profile.get("projects", [])
    project_names = [p.get("name", "") for p in projects if p.get("name")]

    work = profile.get("work_history", [])
    work_summary = ", ".join(
        f"{w.get('role', '')} at {w.get('company', '')}" for w in work[:3]
    )

    return (
        f"Candidate: {profile.get('name', '')}. "
        f"{profile.get('summary', '')} "
        f"Skills: {', '.join(all_skills[:20])}. "
        f"Projects: {', '.join(project_names[:5])}. "
        f"Experience: {work_summary}. "
        f"Years of experience: {profile.get('experience_years', 0)}."
    )
