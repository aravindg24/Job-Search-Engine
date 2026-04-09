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
- stream: the candidate's primary career stream — exactly one of: "engineering", "data", "product", "other"
  - engineering: software engineers, backend/frontend/fullstack, devops, ML engineers, mobile, security
  - data: data scientists, data analysts, data engineers, BI, research scientists, quant analysts
  - product: product managers, UX/UI designers, user researchers, product marketers, program managers
  - other: anything else (sales, finance, legal, ops, etc.)
- summary: 2-sentence professional summary
- skills: object with these keys (each an array of strings, use whichever apply):
  - languages: programming languages (Python, SQL, JavaScript, R, etc.)
  - frameworks: code frameworks and libraries (React, FastAPI, PyTorch, dbt, Airflow, etc.)
  - ml_ai: ML/AI concepts and tools (LLMs, RAG, embeddings, fine-tuning, computer vision, etc.)
  - cloud: cloud and infra tools (AWS, GCP, Azure, Docker, Kubernetes, Terraform, etc.)
  - databases: data stores (PostgreSQL, BigQuery, Snowflake, Redshift, MongoDB, etc.)
  - tools: product/design/analytics tools (Figma, Notion, Mixpanel, Amplitude, Tableau, Looker, Jira, Productboard, etc.)
  - methodologies: practices and skills (A/B testing, user research, roadmapping, OKRs, agile, data modeling, statistical analysis, SQL analysis, etc.)
  - other: anything else relevant
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
                      "scala", "kotlin", "swift", "ruby", "r", "sql", "matlab", "bash", "shell"],
        "frameworks": ["react", "angular", "vue", "fastapi", "flask", "django", "express",
                       "spring", "nextjs", "next.js", "nodejs", "node.js", "langchain",
                       "pytorch", "tensorflow", "sklearn", "scikit-learn", "pandas", "numpy",
                       "dbt", "airflow", "spark", "kafka"],
        "ml_ai": ["llm", "rag", "gpt", "bert", "transformer", "fine-tuning", "yolo", "clip",
                  "diffusion", "embedding", "vector search", "nlp", "computer vision",
                  "machine learning", "deep learning", "reinforcement learning"],
        "cloud": ["aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ci/cd",
                  "github actions", "jenkins", "vercel", "render", "railway", "heroku",
                  "bigquery", "redshift", "snowflake", "databricks"],
        "databases": ["postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite",
                      "dynamodb", "supabase", "qdrant", "pinecone", "elasticsearch"],
        "tools": ["figma", "notion", "jira", "confluence", "mixpanel", "amplitude",
                  "tableau", "looker", "power bi", "productboard", "linear", "asana",
                  "miro", "invision", "zeplin", "pendo", "fullstory", "hotjar",
                  "google analytics", "segment", "heap"],
        "methodologies": ["a/b testing", "user research", "usability testing", "roadmapping",
                          "okrs", "agile", "scrum", "kanban", "data modeling", "statistical analysis",
                          "hypothesis testing", "cohort analysis", "funnel analysis",
                          "customer discovery", "design thinking", "sprint planning"],
        "other": ["graphql", "rest", "grpc", "microservices", "git", "linux"],
    }

    # Detect stream from keyword presence
    stream = "other"
    engineering_signals = ["engineer", "developer", "backend", "frontend", "devops", "sre", "mobile"]
    data_signals = ["data scientist", "data analyst", "data engineer", "analytics", "business intelligence"]
    product_signals = ["product manager", "product designer", "ux ", "ui designer", "user researcher", "program manager"]
    if any(s in text_lower for s in data_signals):
        stream = "data"
    elif any(s in text_lower for s in product_signals):
        stream = "product"
    elif any(s in text_lower for s in engineering_signals):
        stream = "engineering"

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
        "stream": stream,
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

    stream = profile.get("stream", "")
    stream_clause = f"Stream: {stream}. " if stream else ""

    return (
        f"Candidate: {profile.get('name', '')}. "
        f"{stream_clause}"
        f"{profile.get('summary', '')} "
        f"Skills: {', '.join(all_skills[:20])}. "
        f"Projects: {', '.join(project_names[:5])}. "
        f"Experience: {work_summary}. "
        f"Years of experience: {profile.get('experience_years', 0)}."
    )
