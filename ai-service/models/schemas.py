"""
models/schemas.py
-----------------
Pydantic request and response models for the CareerConnect AI service.

All route handlers import from here so the data contracts are defined
in one place and never duplicated across files.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ── Request models ────────────────────────────────────────────────────────────

class MatchRequest(BaseModel):
    """
    Body for POST /api/ai/match.
    Both IDs are MongoDB ObjectId strings — the route handler resolves
    the actual documents from the database.
    """
    applicant_id: str
    job_id: str


class RecommendRequest(BaseModel):
    """
    Body for POST /api/ai/recommend (unused — recommend is a GET endpoint,
    kept here for completeness and future use).
    """
    applicant_id: str
    threshold: float = Field(default=60.0, ge=0.0, le=100.0)


class SearchRequest(BaseModel):
    """
    Body for POST /api/ai/search.
    Runs A* graph search over all active jobs to find the best match
    above the given threshold.
    """
    applicant_id: str
    threshold: float = Field(default=90.0, ge=0.0, le=100.0)


class ExtractRequest(BaseModel):
    """
    Body for POST /api/ai/extract-resume.
    Triggers PDF extraction from GridFS for the given applicant.
    """
    applicant_id: str


# ── Response models ───────────────────────────────────────────────────────────

class MatchResponse(BaseModel):
    """
    Response for POST /api/ai/match.
    matchScore is 0–100 (percentage).
    """
    matchScore: float
    resumeScore: float
    skillScore: float
    skillsMatched: list[str]
    skillsMissing: list[str]
    atsRecommendations: list[str]


class RecommendedJob(BaseModel):
    """A single job entry in the recommendation list."""
    job_id: str
    title: str
    company: str
    location: str
    workMode: str
    matchScore: float


class SearchResponse(BaseModel):
    """
    Response for POST /api/ai/search.
    Includes the best-matching job, the score, traversal metadata,
    and an algorithm label for report documentation.
    """
    found: Optional[dict]
    score: float
    steps: int
    explored: list
    algorithm: str = "A*"


class StatusResponse(BaseModel):
    """Generic success/failure envelope used for simple confirmations."""
    message: str
    success: bool
