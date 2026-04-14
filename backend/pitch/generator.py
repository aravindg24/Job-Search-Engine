"""
Tailored pitch generator — maps candidate resume to job requirements via Cerebras.
"""
import json
import re
import logging
from typing import Dict, Any, Optional

from config import settings

logger = logging.getLogger(__name__)

PITCH_TYPE_LABELS = {
    "cover_letter_hook": "opening 2-3 sentences for a cover letter",
    "cold_email": "brief 2-3 sentence pitch for a cold outreach email (less formal, punchy)",
    "why_interested": "a 2-3 sentence answer to the interview question 'Why are you interested in this role?'",
}

_PITCH_PROMPT = """You are a career strategist. Given a candidate's professional profile and a job description, write a {pitch_type_label}.

Rules:
- Map SPECIFIC projects/experience to SPECIFIC job requirements
- Never be generic — every sentence should reference something concrete
- Keep it to 2-4 sentences
- Sound confident and natural, not desperate or robotic
- Draw from the candidate's positioning and differentiators to make the pitch feel authentic to who they actually are

Candidate Profile:
Positioning: {positioning}
What makes them stand out:
{differentiators_text}
Skills: {skills_flat}
Work history: {work_history}
Projects: {projects}
{stories_block}
Job Title: {job_title}
Company: {company}
Job Description:
{job_description}

Return ONLY valid JSON with this exact shape (no markdown, no code fences):
{{
  "pitch": "...",
  "key_mappings": [
    {{"jd_requirement": "...", "your_experience": "..."}}
  ],
  "framing_advice": "One sentence on what to emphasize."
}}"""


def generate_pitch(
    resume_profile: Dict[str, Any],
    job: Dict[str, Any],
    pitch_type: str = "cover_letter_hook",
    stories: Optional[list] = None,
) -> Dict[str, Any]:
    """Generate a tailored pitch for a specific job + pitch type."""
    if not settings.cerebras_api_key:
        return _fallback_pitch(job, pitch_type)

    from cerebras.cloud.sdk import Cerebras
    client = Cerebras(api_key=settings.cerebras_api_key)

    pitch_label = PITCH_TYPE_LABELS.get(pitch_type, PITCH_TYPE_LABELS["cover_letter_hook"])
    description = job.get("description", "")[:3000]

    # Build structured candidate context
    positioning = resume_profile.get("positioning", resume_profile.get("summary", ""))
    differentiators = resume_profile.get("differentiators", [])
    diff_text = "\n".join(f"- {d}" for d in differentiators[:5]) if differentiators else "- Not specified"

    skills = resume_profile.get("skills", {})
    all_skills = []
    for v in skills.values():
        if isinstance(v, list):
            all_skills.extend(v)
    skills_flat = ", ".join(all_skills[:20]) or "N/A"

    work = "; ".join(
        f"{w.get('role')} at {w.get('company')} ({w.get('duration', '')})"
        for w in resume_profile.get("work_history", [])[:3]
    ) or "N/A"

    projects = "; ".join(
        f"{p.get('name')} ({', '.join(p.get('tech', [])[:3])}): {p.get('description', '')}"
        for p in resume_profile.get("projects", [])[:3]
    ) or "N/A"

    # Pick top 2 relevant STAR stories by skills_demonstrated overlap
    stories_block = ""
    if stories:
        job_req_text = " ".join(job.get("requirements", [])).lower()
        def _story_relevance(s):
            return sum(1 for sk in s.get("skills_demonstrated", []) if sk.lower() in job_req_text)
        top_stories = sorted(stories, key=_story_relevance, reverse=True)[:2]
        if top_stories:
            parts = [
                f"STAR Story: S: {s['situation']} | T: {s['task']} | A: {s['action']} | R: {s['result']}"
                for s in top_stories
            ]
            stories_block = (
                "\nRelevant STAR Stories (weave the most applicable one in naturally):\n"
                + "\n".join(parts) + "\n"
            )

    prompt = _PITCH_PROMPT.format(
        pitch_type_label=pitch_label,
        positioning=positioning,
        differentiators_text=diff_text,
        skills_flat=skills_flat,
        work_history=work,
        projects=projects,
        stories_block=stories_block,
        job_title=job.get("title", ""),
        company=job.get("company", ""),
        job_description=description,
    )

    try:
        response = client.chat.completions.create(
            model=settings.cerebras_model,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        result = json.loads(raw)
        return result
    except Exception as e:
        logger.error(f"Pitch generation failed: {e}")
        return _fallback_pitch(job, pitch_type)


def _fallback_pitch(job: Dict[str, Any], pitch_type: str) -> Dict[str, Any]:
    return {
        "pitch": f"I'm excited about the {job.get('title', 'role')} position at {job.get('company', 'your company')}. My background aligns well with your requirements and I'd love to contribute to your team.",
        "key_mappings": [],
        "framing_advice": "Highlight your most relevant project and connect it directly to the job description.",
    }
