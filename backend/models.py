from pydantic import BaseModel
from typing import Optional, List


class SearchFilters(BaseModel):
    remote: Optional[bool] = None
    location: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    filters: Optional[SearchFilters] = None


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


class SearchResponse(BaseModel):
    results: List[JobResult]
    total: int
    query: str


class ExplainRequest(BaseModel):
    query: str
    job_id: str


class ExplainResponse(BaseModel):
    match_score: float
    strengths: List[str]
    gaps: List[str]
    suggestion: str


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
