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

    file_id      : GridFS ObjectId string passed directly from the Node.js
                   onboarding controller.  This is the preferred path because
                   the fileId is available immediately after the GridFS upload,
                   before it has been persisted to the user document.
    applicant_id : Optional.  When provided without file_id the handler looks
                   up the user document to find their stored fileId.  Kept so
                   the endpoint can still be tested manually via /docs.
    """
    file_id:      str | None = None   # GridFS file ID passed directly from Node.js
    applicant_id: str | None = None   # optional, kept for manual testing via /docs


# ── Score breakdown ───────────────────────────────────────────────────────────

class ScoreBreakdown(BaseModel):
    """
    Contribution of a single scoring component to the final match score.

    Attributes
    ----------
    score        : float — raw score for this component (0–100)
    weight       : float — weight applied to this component (0–1, sums to 1.0
                           across all components in a MatchResponse breakdown)
    contribution : float — weighted contribution = score * weight (0–100)
    """
    score: float
    weight: float
    contribution: float


# ── Experience schemas ────────────────────────────────────────────────────────

class WorkExperienceEntry(BaseModel):
    """A single work experience entry from the applicant's profile."""
    role:        str
    company:     str | None = None
    years:       float | None = None
    startDate:   str | None = None
    endDate:     str | None = None
    current:     bool = False
    description: str | None = None


class ExperienceSummary(BaseModel):
    """Aggregated experience summary computed from work history."""
    totalYears:        float
    seniorityLevel:    str                        # entry/mid/senior/lead
    primaryRole:       str | None = None
    experienceEntries: list[WorkExperienceEntry] = []
    source:            str                        # "resume_text" | "onboarding" | "structured"


# ── Response models ───────────────────────────────────────────────────────────

class MatchResponse(BaseModel):
    """
    Response for POST /api/ai/match.

    matchScore is the final weighted score (0–100).
    breakdown maps component names to their score/weight/contribution details.
    feedback is a human-readable summary sentence.
    experienceMatch indicates alignment: 'good', 'underqualified', 'overqualified', 'unknown'.
    experienceSummary provides structured experience data when available.
    applicantFeedback / recruiterFeedback carry explainable AI feedback dicts.
    atsKeywordsMatched / atsKeywordsMissing / atsTotalKeywords expose the
    ATS keyword analysis for the UI and report documentation.
    """
    matchScore:         float
    skillsMatched:      list[str]
    skillsMissing:      list[str]
    breakdown:          dict
    feedback:           str
    experienceMatch:    str
    experienceSummary:  ExperienceSummary | None = None
    applicantFeedback:  dict | None = None
    recruiterFeedback:  dict | None = None
    atsKeywordsMatched: list[str] = []
    atsKeywordsMissing: list[str] = []
    atsTotalKeywords:   int       = 0


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


# ── Recommendation response models ────────────────────────────────────────────

class RecommendationItem(BaseModel):
    """
    A single job recommendation entry returned by GET /recommendations/{applicant_id}.

    job              : the full job document (title, company, location, etc.)
    matchScore       : boosted final score after preference adjustments (0–100)
    skillsMatched    : job skills the applicant already has
    skillsMissing    : job skills the applicant lacks
    applicantFeedback: explainable AI feedback dict from feedback_generator
    """
    job: dict
    matchScore: float
    skillsMatched: list[str]
    skillsMissing: list[str]
    applicantFeedback: dict


class RecommendationsResponse(BaseModel):
    """
    Response envelope for GET /api/ai/recommendations/{applicant_id}.

    applicantId           : the queried applicant's ID string
    totalJobsAnalyzed     : number of active jobs scored before filtering
    recommendationsFound  : number of jobs that passed the threshold
    threshold             : the threshold value used for this request
    recommendations       : ordered list of RecommendationItem (max 20)
    """
    applicantId: str
    totalJobsAnalyzed: int
    recommendationsFound: int
    threshold: float
    recommendations: list[RecommendationItem]
