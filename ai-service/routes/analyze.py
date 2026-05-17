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

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException
=======
from pydantic import BaseModel as _BaseModel
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
from pymongo.database import Database

from models.schemas import (
    MatchRequest,
    MatchResponse,
    RecommendationsResponse,
    SearchRequest,
    SearchResponse,
)
from services.preprocessing import preprocess_job, preprocess_resume
from services.similarity import (
    build_job_graph,
    calculate_cosine_similarity,
    run_astar_search,
)
from services.matching_engine import calculate_match_score
from services.feedback_generator import (
    generate_applicant_feedback,
    generate_recruiter_feedback,
)
from services.recommendation_engine import get_recommendations
from services.graph_builder import build_job_graph as _build_graph, get_starting_nodes
from services.astar_search import run_astar
from services.career_advisor import get_career_recommendations
from utils.text_utils import get_skill_overlap

router = APIRouter()


# ── Utility: recursively stringify ObjectIds ──────────────────────────────────

def _stringify_ids(obj):
    """Recursively convert any ObjectId values to strings so Pydantic can serialize them."""
    if isinstance(obj, dict):
        return {k: _stringify_ids(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_stringify_ids(i) for i in obj]
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj



    # ── Delegate all scoring to the matching engine ───────────────────────────
    result = calculate_match_score(applicant_data=applicant, job_data=job)

    # ── Log each component score ──────────────────────────────────────────────
    bd = result["breakdown"]
    print(
        f"[/match] Skill: {bd['skillScore']['score']}% | "
        f"Semantic: {bd['semanticScore']['score']}% | "
        f"Experience: {bd['experienceScore']['score']}% | "
        f"Tools: {bd['toolsScore']['score']}%"
    )
    print(
        f"[/match] finalScore={result['finalScore']}  "
        f"matched={result['matchCount']}/{result['totalRequired']}  "
        f"expMatch={result['experienceMatch']}"
    )

    # ── Map matching_engine output to MatchResponse schema ────────────────────
    # MatchResponse.breakdown expects ScoreBreakdown-shaped dicts; the engine
    # already returns {score, weight, contribution} for each component.
    # response_model is not set on this endpoint so applicantFeedback and
    # recruiterFeedback are included without being stripped by Pydantic.

    # ── Generate explainable AI feedback ─────────────────────────────────────
    applicant_feedback = generate_applicant_feedback(
        match_result=result,
        job_data=job,
    )
    recruiter_feedback = generate_recruiter_feedback(
        match_result=result,
        applicant_data=applicant,
    )

    return {
        "matchScore":        result["finalScore"],
        "skillsMatched":     result["skillsMatched"],
        "skillsMissing":     result["skillsMissing"],
        "breakdown":         result["breakdown"],
        "feedback":          result["feedback"],
        "experienceMatch":   result["experienceMatch"],
        "applicantFeedback": applicant_feedback,
        "recruiterFeedback": recruiter_feedback,
    }


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


# ── GET /recommendations/{applicant_id} ───────────────────────────────────────

@router.get("/recommendations/{applicant_id}", response_model=RecommendationsResponse)
async def recommendations(
    applicant_id: str,
    threshold: float = 60.0,
    db: Database = Depends(get_db),
):
    """
    Return up to 20 personalised job recommendations for an applicant,
    ranked by the hybrid AI match score with preference boosts applied.

    Unlike the legacy /recommend endpoint (TF-IDF only), this endpoint
    uses the full four-component matching engine (skill match, semantic
    similarity, experience alignment, tools match) plus explainable
    applicant feedback for each result.

    Applicants with no resume text are handled gracefully — the engine
    falls back to skill-list semantic similarity automatically.

    Already-applied jobs are excluded from results.

    Parameters
    ----------
    applicant_id : str   — MongoDB ObjectId string
    threshold    : float — minimum match score to include (default 60.0)

    Returns
    -------
    RecommendationsResponse with:
        applicantId           : str
        totalJobsAnalyzed     : int
        recommendationsFound  : int
        threshold             : float
        recommendations       : list of up to 20 RecommendationItem
    """
    print(f"[/recommendations] applicant_id={applicant_id}  threshold={threshold}")

    applicant = _get_applicant(db, applicant_id)

    # ── Fetch all active jobs ─────────────────────────────────────────────────
    raw_jobs = list(db["jobs"].find({"status": "active"}))

    # Stringify ObjectIds so the engine and JSON serialiser never see BSON types
    for job in raw_jobs:
        job["_id"] = str(job["_id"])

    total_jobs = len(raw_jobs)

    # ── Fetch job IDs the applicant has already applied to ────────────────────
    applicant_oid = _parse_object_id(applicant_id, "applicant_id")
    applied_docs  = list(db["applications"].find(
        {"applicant": applicant_oid},
        {"job": 1, "_id": 0},
    ))
    applied_job_ids: list[str] = [str(doc["job"]) for doc in applied_docs if "job" in doc]

    # ── Delegate scoring + filtering to the recommendation engine ─────────────
    results = get_recommendations(
        applicant_data=applicant,
        all_jobs=raw_jobs,
        threshold=threshold,
        applied_job_ids=applied_job_ids,
    )

    print(
        f"Analyzing {total_jobs} jobs for applicant {applicant_id} "
        f"— {len(results)} passed threshold"
    )

    return RecommendationsResponse(
        applicantId=applicant_id,
        totalJobsAnalyzed=total_jobs,
        recommendationsFound=len(results),
        threshold=threshold,
        recommendations=results,
    )


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
    applicant_skills = get_combined_applicant_skills(applicant)

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
        found=_stringify_ids(result["found"]),
        score=result["score"],
        steps=result["steps"],
        explored=result["explored"],
        algorithm="A*",
    )


# ── POST /astar-search ───────────────────────────────────────────────────────

@router.post("/astar-search")
async def astar_search(payload: SearchRequest, db: Database = Depends(get_db)):
    """
    Run A* graph search over all active jobs to find the best match for
    an applicant above a configurable threshold.

    The job graph connects jobs that share at least one required skill.
    A* uses h(n) = 100 - match_score as its heuristic, prioritising nodes
    closer to a perfect match.  The response includes the full exploration
    path and efficiency metrics for assignment report documentation.

    Parameters
    ----------
    applicant_id : str   — MongoDB ObjectId string
    threshold    : float — goal score (default 90.0)

    Returns
    -------
    Full A* result dict including:
        algorithm, found, finalScore, goalThreshold,
        totalNodesExplored, totalNodesInGraph, efficiency,
        explorationPath, heuristicUsed
    """
    print(f"[/astar-search] applicant_id={payload.applicant_id}  threshold={payload.threshold}")

    applicant        = _get_applicant(db, payload.applicant_id)
    applicant_skills = get_combined_applicant_skills(applicant)

    # ── Fetch all active jobs and stringify ObjectIds ─────────────────────────
    raw_jobs = list(db["jobs"].find({"status": "active"}))
    for job in raw_jobs:
        job["_id"] = str(job["_id"])

    total_nodes = len(raw_jobs)

    if not raw_jobs:
        return {
            "algorithm":           "A*",
            "found":               None,
            "finalScore":          0.0,
            "goalThreshold":       payload.threshold,
            "totalNodesExplored":  0,
            "totalNodesInGraph":   0,
            "efficiency":          "100% nodes skipped",
            "explorationPath":     [],
            "heuristicUsed":       "h(n) = 100 - match_score",
        }

    # ── Build graph using the dedicated graph_builder module ──────────────────
    graph = _build_graph(raw_jobs)

    # ── Run A* using the dedicated astar_search module ────────────────────────
    result = run_astar(
        applicant_skills=applicant_skills,
        jobs=raw_jobs,
        graph=graph,
        threshold=payload.threshold,
    )

    # ── Required log line ─────────────────────────────────────────────────────
    explored = result["totalNodesExplored"]
    skipped  = total_nodes - explored
    pct      = round((skipped / total_nodes) * 100) if total_nodes else 0
    print(
        f"A* explored {explored}/{total_nodes} nodes ({pct}% efficient)"
    )

    return _stringify_ids(result)


# ── GET /career-advice/{applicant_id}/{job_id} ────────────────────────────────

@router.get("/career-advice/{applicant_id}/{job_id}")
async def career_advice(
    applicant_id: str,
    job_id: str,
    db: Database = Depends(get_db),
):
    """
    Generate personalised career path recommendations for an applicant
    relative to a specific job they want to qualify for.

    Fetches the applicant and job, runs the matching engine to get the
    current skill gap, then delegates to career_advisor for actionable
    advice: immediate learning actions, short-term goals, a career path
    suggestion, and an estimated score improvement.

    Parameters
    ----------
    applicant_id : str — MongoDB ObjectId string
    job_id       : str — MongoDB ObjectId string

    Returns
    -------
    dict with keys:
        applicantId              : str
        jobId                    : str
        jobTitle                 : str
        currentMatchScore        : float
        skillsMatched            : list[str]
        skillsMissing            : list[str]
        careerAdvice             : dict  — from career_advisor.get_career_recommendations()
    """
    print(f"[/career-advice] applicant_id={applicant_id}  job_id={job_id}")

    applicant = _get_applicant(db, applicant_id)
    job       = _get_job(db, job_id)

    # ── Run the matching engine to get current gap ────────────────────────────
    match_result = calculate_match_score(applicant_data=applicant, job_data=job)

    current_skills: list[str] = get_combined_applicant_skills(applicant)
    missing_skills: list[str] = match_result["skillsMissing"]

    # ── Generate career advice ────────────────────────────────────────────────
    advice = get_career_recommendations(
        missing_skills=missing_skills,
        current_skills=current_skills,
        job_data=job,
    )

    print(
        f"[/career-advice] score={match_result['finalScore']}  "
        f"missing={len(missing_skills)}  "
        f"path='{advice['careerPathSuggestion']}'"
    )

    return {
        "applicantId":       applicant_id,
        "jobId":             job_id,
        "jobTitle":          job.get("title", ""),
        "currentMatchScore": match_result["finalScore"],
        "skillsMatched":     match_result["skillsMatched"],
        "skillsMissing":     missing_skills,
        "careerAdvice":      advice,
    }


# ── POST /debug-skills ────────────────────────────────────────────────────────
# DEBUG ENDPOINT — remove before production

from pydantic import BaseModel as _BaseModel
from services.skill_extractor import (
    extract_skills_from_text,
    normalize_skills_list,
    calculate_skill_match,
    get_combined_applicant_skills,
)


class _DebugSkillsRequest(_BaseModel):
    applicant_id: str
    job_id: str


@router.post("/debug-skills")
async def debug_skills(payload: _DebugSkillsRequest, db: Database = Depends(get_db)):
    """
    Debug endpoint: shows every stage of skill extraction and matching for
    a given applicant/job pair so mismatches can be diagnosed quickly.

    Returns
    -------
    applicantSkillsRaw
        The raw skill entries exactly as stored in MongoDB
        (may be strings or {"name": ..., "level": ...} dicts).

    applicantSkillsNormalized
        The same list after normalize_skills_list() — flat strings only.
        This is what the matching engine actually uses.

    jobRequiredSkills
        requiredSkills (or legacy skills) from the job document.

    skillsExtractedFromResumeText
        Skills detected by regex scan of the applicant's stored resume
        text (applicantProfile.resume.rawText).  These SUPPLEMENT the
        structured profile skills — they never replace them.

    matchBreakdown
        Output of calculate_skill_match() comparing the union of
        (normalised profile skills + text-extracted skills) against
        the job's required skills.
    """
    print(f"[/debug-skills] applicant_id={payload.applicant_id}  job_id={payload.job_id}")

    applicant = _get_applicant(db, payload.applicant_id)
    job       = _get_job(db, payload.job_id)

    # ── Raw skills from applicant profile ────────────────────────────────────
    skills_raw = (
        applicant.get("applicantProfile", {}).get("skills", []) or []
    )

    # ── Normalised profile skills ─────────────────────────────────────────────
    skills_normalized = normalize_skills_list(skills_raw)

    # ── Job required skills ───────────────────────────────────────────────────
    job_skills: list[str] = job.get("requiredSkills") or job.get("skills") or []

    # ── Skills extracted from resume text ────────────────────────────────────
    resume_text: str = (
        applicant.get("applicantProfile", {})
        .get("resume", {})
        .get("rawText", "")
        or ""
    )
    skills_from_text = extract_skills_from_text(resume_text)

    # ── Combined applicant skills (profile + text, deduplicated) ─────────────
    # Text-extracted skills supplement structured profile skills; they do
    # NOT replace them.  Profile skills take precedence for ordering.
    combined_lower: set[str] = {s.lower() for s in skills_normalized}
    supplemental   = [s for s in skills_from_text if s.lower() not in combined_lower]
    all_applicant_skills = skills_normalized + supplemental

    # ── Match breakdown ───────────────────────────────────────────────────────
    match_breakdown = calculate_skill_match(all_applicant_skills, job_skills)

    print(
        f"[/debug-skills] profile_skills={len(skills_normalized)}  "
        f"text_skills={len(skills_from_text)}  "
        f"job_skills={len(job_skills)}  "
        f"matchScore={match_breakdown['matchScore']}"
    )

    return {
        "applicantSkillsRaw":            skills_raw,
        "applicantSkillsNormalized":     skills_normalized,
        "jobRequiredSkills":             job_skills,
        "skillsExtractedFromResumeText": skills_from_text,
        "matchBreakdown":                match_breakdown,
    }
