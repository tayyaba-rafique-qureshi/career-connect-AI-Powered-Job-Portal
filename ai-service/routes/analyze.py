"""
routes/analyze.py
-----------------
FastAPI router for all AI endpoints in the CareerConnect AI service.

This file handles HTTP only:
  - Parse and validate request bodies (via Pydantic schemas)
  - Fetch documents from MongoDB
  - Delegate all computation to services/
  - Return structured responses or raise HTTPException

No business logic lives here.  No database calls live in services/.
"""

import io
import pdfplumber
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from models.schemas import (
    ExtractRequest,
    MatchRequest,
    MatchResponse,
    SearchRequest,
    SearchResponse,
    StatusResponse,
)
from services.preprocessing import preprocess_job, preprocess_resume
from services.similarity import (
    build_job_graph,
    calculate_cosine_similarity,
    run_astar_search,
)
from utils.text_utils import get_skill_overlap

router = APIRouter()


# ── Dependency helper ─────────────────────────────────────────────────────────

def get_db() -> Database:
    """
    FastAPI dependency that returns the MongoDB database instance.
    Injected by main.py at startup via app.dependency_overrides.
    Raises a 503 if the database is not yet available.
    """
    # Overridden in main.py — this body is only reached if the override
    # was never set (e.g. during isolated unit tests).
    raise HTTPException(status_code=503, detail="Database not available")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_object_id(raw_id: str, label: str) -> ObjectId:
    """
    Convert a string to a MongoDB ObjectId, raising a 400 on bad format.

    Parameters
    ----------
    raw_id : str   — the string to convert
    label  : str   — human-readable name used in the error message
    """
    try:
        return ObjectId(raw_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid {label}: '{raw_id}'")


def _get_applicant(db: Database, applicant_id: str) -> dict:
    """Fetch an applicant document or raise 404."""
    oid = _parse_object_id(applicant_id, "applicant_id")
    doc = db["users"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Applicant '{applicant_id}' not found")
    return doc


def _get_job(db: Database, job_id: str) -> dict:
    """Fetch a job document or raise 404."""
    oid = _parse_object_id(job_id, "job_id")
    doc = db["jobs"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return doc


def _applicant_skills(applicant: dict) -> list[str]:
    """
    Extract a flat list of skill name strings from an applicant document.
    Handles both the structured {name, level} format and plain strings.
    """
    raw = applicant.get("applicantProfile", {}).get("skills", []) or []
    result = []
    for s in raw:
        if isinstance(s, dict):
            result.append(s.get("name", ""))
        elif isinstance(s, str):
            result.append(s)
    return [s for s in result if s]


# ── POST /match ───────────────────────────────────────────────────────────────

@router.post("/match", response_model=MatchResponse)
async def match(payload: MatchRequest, db: Database = Depends(get_db)):
    """
    Calculate the AI match score between an applicant and a specific job.

    Steps:
      1. Fetch applicant and job from MongoDB.
      2. Extract resume text and skills from the applicant profile.
      3. Preprocess both resume and job text.
      4. Compute TF-IDF cosine similarity (0–100).
      5. Compute skill overlap (matched / missing).
      6. Return MatchResponse.

    Returns 400 if the applicant has no resume text.
    """
    print(f"[/match] applicant_id={payload.applicant_id}  job_id={payload.job_id}")

    applicant = _get_applicant(db, payload.applicant_id)
    job       = _get_job(db, payload.job_id)

    # ── Resume text ──────────────────────────────────────────────────────────
    resume_text: str = (
        applicant.get("applicantProfile", {})
        .get("resume", {})
        .get("rawText", "")
        or ""
    )
    if not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Applicant has no resume text. Please upload and extract a resume first.",
        )

    # ── Skills ───────────────────────────────────────────────────────────────
    applicant_skills = _applicant_skills(applicant)
    job_skills: list[str] = job.get("requiredSkills") or job.get("skills") or []

    # ── Preprocessing ────────────────────────────────────────────────────────
    clean_resume = preprocess_resume(resume_text)
    clean_job    = preprocess_job(job.get("description", ""), job_skills)

    # ── Similarity ───────────────────────────────────────────────────────────
    score = calculate_cosine_similarity(clean_resume, clean_job)

    # ── Skill overlap ────────────────────────────────────────────────────────
    matched, missing = get_skill_overlap(applicant_skills, job_skills)

    print(f"[/match] score={score}  matched={len(matched)}  missing={len(missing)}")

    return MatchResponse(
        matchScore=score,
        skillsMatched=matched,
        skillsMissing=missing,
    )


# ── GET /recommend/{applicant_id} ─────────────────────────────────────────────

@router.get("/recommend/{applicant_id}")
async def recommend(
    applicant_id: str,
    threshold: float = 60.0,
    db: Database = Depends(get_db),
):
    """
    Return the top 20 active jobs ranked by match score for an applicant.

    Filtering applied (when applicant preferences are available):
      - jobType  : must overlap with applicant's preferred job types
      - workMode : must match applicant's preferred work mode
      - location : soft filter — jobs matching preferred locations ranked higher

    Jobs below the threshold are excluded from results.

    Parameters
    ----------
    applicant_id : str   — MongoDB ObjectId string
    threshold    : float — minimum match score to include (default 60.0)
    """
    print(f"[/recommend] applicant_id={applicant_id}  threshold={threshold}")

    applicant = _get_applicant(db, applicant_id)

    # ── Applicant data ───────────────────────────────────────────────────────
    resume_text: str = (
        applicant.get("applicantProfile", {})
        .get("resume", {})
        .get("rawText", "")
        or ""
    )
    applicant_skills = _applicant_skills(applicant)
    prefs = applicant.get("applicantProfile", {}).get("preferences", {}) or {}
    pref_job_types: list[str] = [t.lower() for t in (prefs.get("jobType") or [])]
    pref_work_mode: str       = (prefs.get("workMode") or "").lower()
    pref_locations: list[str] = [l.lower() for l in (prefs.get("preferredLocations") or [])]

    clean_resume = preprocess_resume(resume_text) if resume_text.strip() else ""

    # ── Fetch active jobs ────────────────────────────────────────────────────
    jobs = list(db["jobs"].find({"status": "active"}))
    if not jobs:
        return {"jobs": [], "total": 0}

    # ── Score each job ───────────────────────────────────────────────────────
    results = []
    for job in jobs:
        job_skills: list[str] = job.get("requiredSkills") or job.get("skills") or []

        # Preference filters — skip jobs that clearly don't match
        if pref_job_types:
            job_types = [t.lower() for t in (job.get("jobType") or [])]
            if job_types and not set(pref_job_types) & set(job_types):
                continue
        if pref_work_mode and job.get("workMode", "").lower() != pref_work_mode:
            continue

        # Compute similarity
        if clean_resume:
            clean_job = preprocess_job(job.get("description", ""), job_skills)
            score = calculate_cosine_similarity(clean_resume, clean_job)
        else:
            # Fall back to pure skill overlap when no resume text is available
            matched, _ = get_skill_overlap(applicant_skills, job_skills)
            score = round((len(matched) / max(len(job_skills), 1)) * 100, 2)

        if score < threshold:
            continue

        # Location bonus: +5 if job location matches a preferred location
        job_location = (job.get("location") or "").lower()
        if pref_locations and any(loc in job_location for loc in pref_locations):
            score = min(score + 5.0, 100.0)

        results.append({
            "job_id":    str(job["_id"]),
            "title":     job.get("title", ""),
            "company":   job.get("company", ""),
            "location":  job.get("location", ""),
            "workMode":  job.get("workMode", ""),
            "matchScore": round(score, 2),
        })

    # Sort descending, cap at 20
    results.sort(key=lambda x: x["matchScore"], reverse=True)
    top = results[:20]

    print(f"[/recommend] returning {len(top)} jobs (from {len(jobs)} active)")
    return {"jobs": top, "total": len(top)}


# ── POST /search ──────────────────────────────────────────────────────────────

@router.post("/search", response_model=SearchResponse)
async def search(payload: SearchRequest, db: Database = Depends(get_db)):
    """
    Use A* graph search to find the best-matching active job for an applicant.

    The job graph connects jobs that share at least one required skill.
    A* uses h(n) = 100 - match_score as an admissible heuristic, so it
    always finds the optimal path to a job above the threshold.

    Returns the found job (or None), the score, the number of nodes
    explored, the full exploration path, and an algorithm label for
    report documentation.
    """
    print(f"[/search] applicant_id={payload.applicant_id}  threshold={payload.threshold}")

    applicant = _get_applicant(db, payload.applicant_id)
    applicant_skills = _applicant_skills(applicant)

    # Fetch all active jobs
    jobs = list(db["jobs"].find({"status": "active"}))
    if not jobs:
        return SearchResponse(found=None, score=0.0, steps=0, explored=[], algorithm="A*")

    # Stringify ObjectIds so the graph and response are JSON-serialisable
    for job in jobs:
        job["_id"] = str(job["_id"])

    graph = build_job_graph(jobs)
    result = run_astar_search(applicant_skills, jobs, graph, payload.threshold)

    print(
        f"[/search] steps={result['steps']}  "
        f"found={'yes' if result['found'] else 'no'}  "
        f"score={result['score']}"
    )

    return SearchResponse(
        found=result["found"],
        score=result["score"],
        steps=result["steps"],
        explored=result["explored"],
        algorithm="A*",
    )


# ── POST /extract-resume ──────────────────────────────────────────────────────

@router.post("/extract-resume", response_model=StatusResponse)
async def extract_resume(payload: ExtractRequest, db: Database = Depends(get_db)):
    """
    Extract text from an applicant's PDF resume stored in MongoDB GridFS,
    clean it, and persist it back to user.applicantProfile.resume.rawText.

    Steps:
      1. Fetch the applicant document.
      2. Locate the GridFS file ID from applicantProfile.resume.fileUrl
         or a dedicated gridfsId field.
      3. Stream the PDF bytes from GridFS.
      4. Extract all text page-by-page using pdfplumber.
      5. Clean the text via the preprocessing service.
      6. Update the user document in MongoDB.
      7. Return a StatusResponse with the character count.

    Returns 400 if no resume file reference is found on the applicant.
    Returns 404 if the GridFS file does not exist.
    """
    print(f"[/extract-resume] applicant_id={payload.applicant_id}")

    applicant = _get_applicant(db, payload.applicant_id)

    # ── Locate the GridFS file reference ────────────────────────────────────
    resume_info = (applicant.get("applicantProfile") or {}).get("resume") or {}
    gridfs_id_raw = resume_info.get("gridfsId") or resume_info.get("fileId")

    if not gridfs_id_raw:
        raise HTTPException(
            status_code=400,
            detail="No resume file found for this applicant. Please upload a PDF first.",
        )

    gridfs_oid = _parse_object_id(str(gridfs_id_raw), "gridfsId")

    # ── Stream PDF from GridFS ───────────────────────────────────────────────
    import gridfs as gridfs_module
    fs = gridfs_module.GridFS(db)

    try:
        grid_out = fs.get(gridfs_oid)
    except gridfs_module.errors.NoFile:
        raise HTTPException(
            status_code=404,
            detail=f"GridFS file '{gridfs_id_raw}' not found.",
        )

    pdf_bytes = grid_out.read()

    # ── Extract text with pdfplumber ─────────────────────────────────────────
    raw_pages: list[str] = []
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    raw_pages.append(page_text)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse PDF: {exc}",
        )

    raw_text = "\n".join(raw_pages)
    if not raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="PDF was parsed but contained no extractable text (may be image-based).",
        )

    # ── Clean and persist ────────────────────────────────────────────────────
    clean = preprocess_resume(raw_text)

    applicant_oid = _parse_object_id(payload.applicant_id, "applicant_id")
    db["users"].update_one(
        {"_id": applicant_oid},
        {"$set": {"applicantProfile.resume.rawText": clean}},
    )

    char_count = len(clean)
    print(f"[/extract-resume] extracted {char_count} chars for applicant {payload.applicant_id}")

    return StatusResponse(
        message=f"Resume extracted and saved successfully ({char_count} characters).",
        success=True,
    )
