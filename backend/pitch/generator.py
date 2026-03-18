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

_PITCH_PROMPT = """You are a career strategist. Given a candidate's resume profile and a job description, write a {pitch_type_label}.

Rules:
- Map SPECIFIC projects/experience to SPECIFIC job requirements
- Never be generic — every sentence should reference something concrete
- Keep it to 2-4 sentences
- Sound confident and natural, not desperate or robotic

Candidate Resume Profile:
{resume_profile}

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
) -> Dict[str, Any]:
    """Generate a tailored pitch for a specific job + pitch type."""
    if not settings.cerebras_api_key:
        return _fallback_pitch(job, pitch_type)

    from cerebras.cloud.sdk import Cerebras
    client = Cerebras(api_key=settings.cerebras_api_key)

    pitch_label = PITCH_TYPE_LABELS.get(pitch_type, PITCH_TYPE_LABELS["cover_letter_hook"])
    description = job.get("description", "")[:3000]

    prompt = _PITCH_PROMPT.format(
        pitch_type_label=pitch_label,
        resume_profile=json.dumps(resume_profile, indent=2)[:2000],
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
