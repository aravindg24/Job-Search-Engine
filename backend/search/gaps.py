"""
Aggregate skill gap analysis across a set of job results.
Compares job requirements against the candidate's resume profile.
"""
import json
import re
import logging
from typing import List, Dict, Any, Optional
from collections import Counter

from config import settings

logger = logging.getLogger(__name__)

_INSIGHT_PROMPT = """Given a candidate's skills and the skill demands across their top {n} job matches:

Candidate has: {skills_list}
Most demanded skills they're missing: {missing_with_counts}
Most demanded skills they have: {present_with_counts}

Write ONE actionable insight sentence about their job search positioning.
Be specific and strategic, not generic. Start with "Your" and reference specific skills."""


def analyze_gaps(
    jobs: List[Dict[str, Any]],
    resume_profile: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    n = len(jobs)
    if n == 0:
        return {"total_jobs_analyzed": 0, "missing_skills": [], "strong_skills": [], "insight": ""}

    skill_job_sets: Counter = Counter()
    for job in jobs:
        payload = job.get("payload", job)
        reqs = payload.get("requirements", [])
        tags = payload.get("tags", [])
        job_skills = set(s.strip().lower() for s in reqs + tags if s.strip())
        for skill in job_skills:
            skill_job_sets[skill] += 1

    skill_counts = skill_job_sets

    candidate_skills: set = set()
    if resume_profile:
        skills_dict = resume_profile.get("skills", {})
        for skill_list in skills_dict.values():
            if isinstance(skill_list, list):
                candidate_skills.update(s.lower() for s in skill_list)

    missing: List[Dict[str, Any]] = []
    strong: List[Dict[str, Any]] = []

    for skill, count in skill_counts.most_common(30):
        pct = min(round(count / n * 100), 100)
        if pct < 10:
            continue
        display = _canonical(skill)
        if display is None:
            continue
        has_skill = any(skill in cs or cs in skill for cs in candidate_skills)
        entry = {"skill": display, "demanded_by": count, "percentage": pct}
        if has_skill:
            entry["status"] = "you have this"
            strong.append(entry)
        else:
            entry["priority"] = "high" if pct >= 50 else ("medium" if pct >= 30 else "low")
            missing.append(entry)

    insight = _generate_insight(n, candidate_skills, missing, strong)

    return {
        "total_jobs_analyzed": n,
        "missing_skills": missing[:8],
        "strong_skills": strong[:6],
        "insight": insight,
    }


_SKIP_TAGS = {"remote", "startup", "scale", "hiring", "jobs", "work", "team", "senior", "junior"}

def _canonical(skill: str) -> Optional[str]:
    if skill.lower() in _SKIP_TAGS:
        return None
    overrides = {
        "python": "Python", "javascript": "JavaScript", "typescript": "TypeScript",
        "react": "React", "golang": "Go/Golang", "go": "Go/Golang",
        "kubernetes": "Kubernetes", "docker": "Docker", "postgresql": "PostgreSQL",
        "graphql": "GraphQL", "kafka": "Kafka", "llm": "LLM/RAG", "rag": "LLM/RAG",
        "llms": "LLMs", "aws": "AWS", "gcp": "GCP", "pytorch": "PyTorch",
        "tensorflow": "TensorFlow", "redis": "Redis", "mongodb": "MongoDB",
        "ai": "AI/ML", "ml": "ML", "sql": "SQL", "nosql": "NoSQL",
        "api": "REST APIs", "ci/cd": "CI/CD", "full-stack": "Full-Stack",
        "node.js": "Node.js", "next.js": "Next.js",
    }
    return overrides.get(skill.lower(), skill.title())


def _generate_insight(n: int, candidate_skills: set, missing: List[Dict], strong: List[Dict]) -> str:
    if not settings.cerebras_api_key:
        if strong:
            top_strong = ", ".join(s["skill"] for s in strong[:3])
            top_missing = ", ".join(s["skill"] for s in missing[:2]) if missing else None
            if top_missing:
                return f"Your {top_strong} stack covers your top matches. Adding {top_missing} would open more opportunities."
            return f"Your {top_strong} skills are well-aligned with your top matches."
        return "Upload your resume to get personalized skill gap insights."

    from cerebras.cloud.sdk import Cerebras
    client = Cerebras(api_key=settings.cerebras_api_key)

    skills_list = ", ".join(sorted(candidate_skills)[:20]) or "Not specified"
    missing_with_counts = ", ".join(f"{s['skill']} ({s['demanded_by']}/{n})" for s in missing[:5]) or "None identified"
    present_with_counts = ", ".join(f"{s['skill']} ({s['demanded_by']}/{n})" for s in strong[:5]) or "None identified"

    prompt = _INSIGHT_PROMPT.format(
        n=n, skills_list=skills_list,
        missing_with_counts=missing_with_counts,
        present_with_counts=present_with_counts,
    )

    try:
        response = client.chat.completions.create(
            model=settings.cerebras_model,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Gap insight generation failed: {e}")
        return f"Your top skills are well-represented. Consider adding {missing[0]['skill'] if missing else 'more skills'} to expand your opportunities."
