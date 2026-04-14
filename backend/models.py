from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any, Dict


# ── Search ─────────────────────────────────────────────────────────────────────

class SearchFilters(BaseModel):
    remote: Optional[bool] = None
    location: Optional[str] = None
    stream: Optional[str] = None  # engineering | data | product | other


class SearchRequest(BaseModel):
    query: str
    top_k: int = Field(10, ge=1, le=50)
    offset: int = Field(0, ge=0)
    filters: Optional[SearchFilters] = None


class SaveJobRequest(BaseModel):
    job_id: str


class JobResult(BaseModel):
    id: str
    title: str
    company: str
    location: str
    remote: bool
    description: str
    requirements: List[str]
    salary_range: Optional[str] = None
    company_stage: Optional[str] = None
    source: str
    source_url: Optional[str] = None
    posted_date: Optional[str] = None
    tags: List[str]
    match_score: Optional[float] = None
    match_reason: Optional[str] = None
    job_is_saved: Optional[bool] = False


class SearchResponse(BaseModel):
    results: List[JobResult]
    total: int
    query: str
    search_id: Optional[int] = None


class Job(BaseModel):
    id: str
    title: str
    company: str
    location: str
    remote: bool
    description: str
    requirements: List[str]
    salary_range: Optional[str] = None
    company_stage: Optional[str] = None
    source: str
    source_url: Optional[str] = None
    posted_date: Optional[str] = None
    tags: List[str]


# ── Explain ────────────────────────────────────────────────────────────────────

class ExplainRequest(BaseModel):
    query: str
    job_id: str


class StrengthItem(BaseModel):
    area: str
    detail: str


class GapItem(BaseModel):
    area: str
    detail: str
    severity: str = "medium"  # low | medium | high


class ExplainResponse(BaseModel):
    match_score: float
    strengths: List[Any]
    gaps: List[Any]
    suggestion: str


# ── Resume ─────────────────────────────────────────────────────────────────────

class ResumeProfileResponse(BaseModel):
    id: int
    parsed_profile: Dict[str, Any]
    uploaded_at: str


# ── Pitch ──────────────────────────────────────────────────────────────────────

class PitchRequest(BaseModel):
    job_id: str
    pitch_type: str = "cover_letter_hook"  # cover_letter_hook | cold_email | why_interested


class KeyMapping(BaseModel):
    jd_requirement: str
    your_experience: str


class PitchResponse(BaseModel):
    pitch: str
    key_mappings: List[Any]
    framing_advice: str
    pitch_type: str
    warning: Optional[str] = None  # set when match_score < 40


# ── Gap Analysis ───────────────────────────────────────────────────────────────

class SkillGap(BaseModel):
    skill: str
    demanded_by: int
    percentage: int
    priority: Optional[str] = None
    status: Optional[str] = None


class GapAnalysisResponse(BaseModel):
    total_jobs_analyzed: int
    missing_skills: List[SkillGap]
    strong_skills: List[SkillGap]
    insight: str


# ── Application Tracker ────────────────────────────────────────────────────────

class TrackRequest(BaseModel):
    job_id: str
    job_title: str = ""
    company: str = ""
    match_score: Optional[float] = None
    status: str = "saved"  # saved | applied | interviewing | offered | rejected | withdrawn
    notes: Optional[str] = None
    pitch: Optional[str] = None
    applied_date: Optional[str] = None


class TrackedJob(BaseModel):
    job_id: str
    job_title: Optional[str]
    company: Optional[str]
    status: str
    match_score: Optional[float]
    notes: Optional[str]
    pitch: Optional[str]
    applied_date: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]


class TrackerStats(BaseModel):
    saved: int = 0
    applied: int = 0
    interviewing: int = 0
    offered: int = 0
    rejected: int = 0
    withdrawn: int = 0


class TrackerResponse(BaseModel):
    stats: TrackerStats
    jobs: List[TrackedJob]


# ── Watch / Digest ─────────────────────────────────────────────────────────────

class WatchRequest(BaseModel):
    min_match_score: float = 70
    keywords: List[str] = []
    locations: List[str] = []
    company_stages: List[str] = []
    target_companies: List[str] = []  # F7: company watchlist


class DigestJob(BaseModel):
    id: str
    title: str
    company: str
    match_score: float
    match_reason: str
    posted_date: Optional[str]
    source: str
    job_is_saved: Optional[bool] = False


class DigestResponse(BaseModel):
    since: Optional[str]
    new_matches: int
    jobs: List[DigestJob]
    newly_indexed_count: int = 0


# ── Invite ──────────────────────────────────────────────────────────────────────

class InviteRequest(BaseModel):
    email: EmailStr


# ── JD Extraction (F2) ─────────────────────────────────────────────────────────

class JDExtractRequest(BaseModel):
    url: str
    query: Optional[str] = None


class JDExtractResponse(BaseModel):
    job_text: str
    title: str
    company: str
    location: str
    remote: bool
    match_score: Optional[float] = None
    pitch_suggestion: Optional[str] = None


# ── STAR Story Bank (F4) ───────────────────────────────────────────────────────

class StoryCreate(BaseModel):
    situation: str
    task: str
    action: str
    result: str
    skills_demonstrated: List[str] = []


class Story(BaseModel):
    id: int
    situation: str
    task: str
    action: str
    result: str
    skills_demonstrated: List[str]
    created_at: Optional[str] = None
