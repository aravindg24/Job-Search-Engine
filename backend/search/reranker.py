"""
Cerebras-powered re-ranking of job search results.
Falls back gracefully to vector-score ordering if Cerebras is unavailable.
"""
import json
import logging
import re
from typing import List, Dict, Any
from config import settings

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    global _client
    if _client is None and settings.cerebras_api_key:
        from cerebras.cloud.sdk import Cerebras
        _client = Cerebras(api_key=settings.cerebras_api_key)
    return _client


RERANK_PROMPT = """You are an expert job matching assistant. Given a candidate's self-description and a list of job postings, re-rank the jobs by how well they match the candidate.

Candidate description:
{query}

Jobs to rank:
{jobs_list}

Instructions:
- Analyze how well each job matches the candidate's skills, experience, location preferences, and interests
- Consider both explicit matches (mentioned skills) and implicit matches (related experience)
- Return a re-ranked list with match scores and explanations

Return ONLY a valid JSON array with NO markdown or code blocks, structured exactly like this:
[{{"job_id": "job-001", "rank": 1, "match_score": 92, "reason": "Strong React + Python fit with AI focus matching their interests"}}]

Include ALL {count} jobs in your response. match_score should be 0-100."""

EXPLAIN_PROMPT = """You are an expert technical recruiter evaluating a candidate's fit for a specific job.

Candidate profile:
{candidate_context}

Job details:
Title: {title}
Company: {company}
Description: {description}
Requirements: {requirements}

Analyze fit by comparing the candidate's actual skills, experience, and projects against what this role requires.
- Strengths must reference specific skills or experiences the candidate actually has that match the role.
- Gaps must reference specific requirements the role asks for that are missing or thin in the candidate's profile.
- Do not invent skills the candidate doesn't have, and do not echo back job description language as strengths.

Return ONLY valid JSON with NO markdown or code blocks:
{{
  "match_score": <number 0-100>,
  "strengths": ["<specific matching skill or experience>", "<another concrete match>", "<third match if applicable>"],
  "gaps": ["<missing or thin requirement>", "<second gap if applicable>"],
  "suggestion": "<one actionable sentence on how to position themselves for this specific role>"
}}"""


def rerank(query: str, candidates: List[Dict[str, Any]], resume_profile: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Re-rank candidates using Cerebras. Falls back to original ordering on failure.
    candidates: list of {id, score, payload}
    Returns: candidates with match_score and match_reason added, sorted by rank.
    """
    client = _get_client()
    if not client or not candidates:
        for i, c in enumerate(candidates):
            c["match_score"] = round(c["score"] * 100, 1)
            c["match_reason"] = "Matched based on semantic similarity to your description."
        return candidates

    jobs_list = "\n".join([
        f"{i+1}. ID: {c['id']} | {c['payload'].get('title')} at {c['payload'].get('company')} | "
        f"{c['payload'].get('location')} | {c['payload'].get('description', '')[:200]}..."
        for i, c in enumerate(candidates)
    ])

    candidate_context = query
    if resume_profile:
        import json as _json
        candidate_context = f"Resume Profile:\n{_json.dumps(resume_profile, indent=2)[:1500]}\n\nSearch intent: {query}"

    prompt = RERANK_PROMPT.format(
        query=candidate_context,
        jobs_list=jobs_list,
        count=len(candidates)
    )

    try:
        response = client.chat.completions.create(
            model=settings.cerebras_model,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.choices[0].message.content.strip()

        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)

        ranked = json.loads(text)

        id_to_candidate = {c["id"]: c for c in candidates}
        result = []
        for item in ranked:
            job_id = item.get("job_id")
            if job_id in id_to_candidate:
                c = id_to_candidate[job_id].copy()
                c["match_score"] = item.get("match_score", 50)
                c["match_reason"] = item.get("reason", "")
                result.append(c)

        ranked_ids = {item.get("job_id") for item in ranked}
        for c in candidates:
            if c["id"] not in ranked_ids:
                c["match_score"] = round(c["score"] * 100, 1)
                c["match_reason"] = "Matched based on semantic similarity."
                result.append(c)

        return result

    except Exception as e:
        logger.warning(f"Cerebras rerank failed: {e}. Using fallback ordering.")
        for c in candidates:
            c["match_score"] = round(c["score"] * 100, 1)
            c["match_reason"] = "Matched based on semantic similarity to your description."
        return candidates


def explain(query: str, job: Dict[str, Any], resume_profile: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get detailed match explanation for a single job."""
    client = _get_client()

    fallback = {
        "match_score": 70,
        "strengths": ["Skills align with job requirements", "Experience level matches"],
        "gaps": ["Some requirements may need further assessment"],
        "suggestion": "Tailor your application to highlight the most relevant experience for this role."
    }

    if not client:
        return fallback

    if resume_profile:
        skills = resume_profile.get("skills", {})
        all_skills = (
            skills.get("languages", []) +
            skills.get("frameworks", []) +
            skills.get("ml_ai", []) +
            skills.get("cloud", []) +
            skills.get("databases", []) +
            skills.get("other", [])
        )
        work = "; ".join(
            f"{w.get('role')} at {w.get('company')} ({w.get('duration')})"
            for w in resume_profile.get("work_history", [])[:3]
        )
        projects = "; ".join(
            f"{p.get('name')} ({', '.join(p.get('tech', [])[:4])}): {p.get('description', '')}"
            for p in resume_profile.get("projects", [])[:3]
        )
        edu_parts = [
            "{} in {} from {}".format(e.get("degree", ""), e.get("field", ""), e.get("school", ""))
            for e in resume_profile.get("education", [])[:2]
        ]
        education = "; ".join(edu_parts) or "N/A"
        candidate_context = (
            f"Name: {resume_profile.get('name', 'Candidate')}\n"
            f"Summary: {resume_profile.get('summary', '')}\n"
            f"Skills: {', '.join(all_skills)}\n"
            f"Experience: {resume_profile.get('experience_years', '?')} years\n"
            f"Work history: {work or 'N/A'}\n"
            f"Projects: {projects or 'N/A'}\n"
            f"Education: {education}"
        )
    else:
        candidate_context = f"Search intent: {query}"

    prompt = EXPLAIN_PROMPT.format(
        candidate_context=candidate_context,
        title=job.get("title", ""),
        company=job.get("company", ""),
        description=job.get("description", "")[:600],
        requirements=", ".join(job.get("requirements", []))
    )

    try:
        response = client.chat.completions.create(
            model=settings.cerebras_model,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.choices[0].message.content.strip()
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
        return json.loads(text)
    except Exception as e:
        logger.warning(f"Cerebras explain failed: {e}. Using fallback.")
        return fallback
