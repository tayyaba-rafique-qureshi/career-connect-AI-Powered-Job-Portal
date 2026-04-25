from fastapi import APIRouter
from models.schemas import AnalyzeRequest, AnalyzeResponse
from services.similarity import compute_similarity

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    """
    Accepts a resume and job description, returns a cosine similarity score (0–1).
    Called by the Node.js backend when a user applies to a job.
    """
    score = compute_similarity(payload.resume, payload.job_description)
    return AnalyzeResponse(score=round(score, 4))
