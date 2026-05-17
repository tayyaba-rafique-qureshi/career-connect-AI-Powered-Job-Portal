"""
services/matching_engine.py
----------------------------
Four-component hybrid matching engine for CareerConnect.

calculate_match_score(applicant_data, job_data) -> dict

Scoring components and weights
-------------------------------
Component        Weight  Source
---------------  ------  -----------------------------------------------
skillScore        0.40   skill_extractor.calculate_skill_match
semanticScore     0.30   similarity.get_semantic_similarity (resume vs job)
experienceScore   0.20   yearsOfExp vs job experienceLevel band
toolsScore        0.10   applicant tools present in job description text

Experience level bands
----------------------
entry  : 0–2 years
mid    : 2–5 years
senior : 5–8 years
lead   : 8+ years

Experience score table
----------------------
Alignment          Score
-----------------  -----
Perfect match      100
One level off       65
Two levels off      30
Three+ levels off   10
Missing data        60   (neutral — no penalty for unknown)

This module has no database calls and no HTTP concerns.
All inputs are plain Python dicts extracted by the route handler.
"""

import logging
from typing import Optional

from services.skill_extractor import (
    calculate_skill_match,
    normalize_skills_list,
    get_combined_applicant_skills,
    extract_experience_from_text,
    extract_seniority_from_text,
    calculate_ats_score,
    get_experience_summary,
)
from services.similarity import get_semantic_similarity
from services.preprocessing import preprocess_resume, preprocess_job
from utils.skill_keywords import SKILL_CATEGORIES

logger = logging.getLogger(__name__)

# ── Weights (must sum to 1.0) ─────────────────────────────────────────────────
# Five-component hybrid engine:
#   skillScore      35%  — most reliable: direct skill-list comparison
#   atsScore        30%  — ATS keyword matching against job description
#   semanticScore   15%  — sentence-embedding similarity (can be noisy with long text)
#   experienceScore 15%  — years of experience vs job level band
#   toolsScore       5%  — tools/certs/devops skills in job description
_W_SKILL      = 0.35
_W_SEMANTIC   = 0.15
_W_ATS        = 0.30
_W_EXPERIENCE = 0.15
_W_TOOLS      = 0.05

assert abs(_W_SKILL + _W_SEMANTIC + _W_ATS + _W_EXPERIENCE + _W_TOOLS - 1.0) < 1e-9, \
    "Matching engine weights must sum to 1.0"

# ── Experience band definitions ───────────────────────────────────────────────
# Maps experienceLevel string → (min_years_inclusive, max_years_exclusive)
_EXP_BANDS: dict[str, tuple[float, float]] = {
    "entry":  (0.0,  2.0),
    "mid":    (2.0,  5.0),
    "senior": (5.0,  8.0),
    "lead":   (8.0,  float("inf")),
}

# Ordered list for distance calculation
_EXP_ORDER = ["entry", "mid", "senior", "lead"]

# Score by number of levels apart
_EXP_SCORE_BY_DISTANCE = {0: 100.0, 1: 65.0, 2: 30.0}
_EXP_SCORE_DEFAULT      = 10.0   # 3+ levels apart
_EXP_SCORE_UNKNOWN      = 60.0   # missing data → neutral


# ── String → years mapping ────────────────────────────────────────────────────
# The onboarding form saves yearsOfExp as human-readable strings.
# Map each known phrase to a representative float (midpoint of the range).
_EXP_STRING_MAP: dict[str, float] = {
    "no experience":       0.0,
    "less than 1 year":    0.5,
    "less than a year":    0.5,
    "1-2 years":           1.5,
    "1 to 2 years":        1.5,
    "2-3 years":           2.5,
    "3-5 years":           4.0,
    "3 to 5 years":        4.0,
    "5-8 years":           6.5,
    "5 to 8 years":        6.5,
    "8+ years":            9.0,
    "more than 8 years":   9.0,
    "8 or more years":     9.0,
    "10+ years":           10.0,
}


def _parse_years_of_exp(raw: object) -> Optional[float]:
    """
    Convert a yearsOfExp value from the applicant profile to a float.

    Handles:
      - None / missing                    → None
      - Numeric types (int, float)        → cast directly
      - Plain numeric strings ("3", "5")  → float()
      - Known phrase strings              → looked up in _EXP_STRING_MAP
      - Unknown strings                   → None (treated as missing data)

    Parameters
    ----------
    raw : object
        The raw value from applicantProfile.professionalInfo.yearsOfExp.

    Returns
    -------
    float | None
    """
    if raw is None:
        return None

    # Already numeric
    if isinstance(raw, (int, float)):
        return float(raw)

    if not isinstance(raw, str):
        try:
            return float(raw)
        except (ValueError, TypeError):
            return None

    stripped = raw.strip()
    if not stripped:
        return None

    # Try plain numeric string first ("3", "5.5")
    try:
        return float(stripped)
    except ValueError:
        pass

    # Try known phrase map (case-insensitive)
    return _EXP_STRING_MAP.get(stripped.lower(), None)


def _years_to_level(years: float) -> str:
    """Map a years-of-experience float to the closest experience level string."""
    for level, (lo, hi) in _EXP_BANDS.items():
        if lo <= years < hi:
            return level
    return "lead"  # fallback for very high values


def _experience_score(applicant_years: Optional[float], job_level: str) -> float:
    """
    Compute a 0–100 score for how well the applicant's experience aligns
    with the job's required level.

    Parameters
    ----------
    applicant_years : float | None — from applicantProfile.professionalInfo.yearsOfExp
    job_level       : str          — job.experienceLevel ("entry","mid","senior","lead","any")

    Returns
    -------
    float — 100 for perfect match, 65/30/10 for increasing distance, 60 if unknown.
    """
    if applicant_years is None or not job_level:
        return _EXP_SCORE_UNKNOWN

    level = job_level.strip().lower()

    if level == "any":
        return 100.0

    if level not in _EXP_ORDER:
        return _EXP_SCORE_UNKNOWN

    applicant_level = _years_to_level(applicant_years)
    idx_applicant   = _EXP_ORDER.index(applicant_level)
    idx_job         = _EXP_ORDER.index(level)
    distance        = abs(idx_applicant - idx_job)

    return _EXP_SCORE_BY_DISTANCE.get(distance, _EXP_SCORE_DEFAULT)


def _tools_score_extended(
    applicant_tools: list[str],
    applicant_certs: list[str],
    combined_skills: list[str],
    job_description: str,
) -> float:
    """
    Compute a 0–100 score for how many of the applicant's tool-like items
    appear in the job description text.

    Checks three sources (deduplicated case-insensitively):
      1. applicantProfile.tools          — explicit tool entries
      2. applicantProfile.certifications — cert names often match job keywords
      3. Skills from the combined list that belong to the cloud_devops or
         tools categories (AWS, Docker, Git, etc.) — these are tool-natured
         skills that the old tools-only check was missing

    Parameters
    ----------
    applicant_tools  : list[str] — from applicantProfile.tools
    applicant_certs  : list[str] — from applicantProfile.certifications
    combined_skills  : list[str] — full merged skill list from get_combined_applicant_skills
    job_description  : str       — raw job description text

    Returns
    -------
    float — 0.0 if the combined tool set is empty or job description is empty.
    """
    if not job_description:
        return 0.0

    # Build the set of tool-category skills from the combined skill list
    tool_category_skills = set(
        SKILL_CATEGORIES.get("cloud_devops", []) + SKILL_CATEGORIES.get("tools", [])
    )
    devops_from_skills = [s for s in combined_skills if s in tool_category_skills]

    # Merge all three sources, deduplicating case-insensitively
    seen_lower: set[str] = set()
    all_tools: list[str] = []
    for item in applicant_tools + applicant_certs + devops_from_skills:
        if item and item.strip() and item.strip().lower() not in seen_lower:
            seen_lower.add(item.strip().lower())
            all_tools.append(item.strip())

    if not all_tools:
        return 0.0

    desc_lower = job_description.lower()
    matched = [t for t in all_tools if t.lower() in desc_lower]
    return round((len(matched) / len(all_tools)) * 100, 2)


# ── Main public function ──────────────────────────────────────────────────────

def calculate_match_score(applicant_data: dict, job_data: dict) -> dict:
    """
    Compute the four-component hybrid match score between an applicant
    and a job posting.

    Parameters
    ----------
    applicant_data : dict
        Applicant document from MongoDB (or a subset).  Expected fields:
          applicantProfile.skills          — list of str or {name, level} dicts
          applicantProfile.tools           — list of str
          applicantProfile.resume.rawText  — str (may be empty)
          applicantProfile.professionalInfo.yearsOfExp — str | int | float | None

    job_data : dict
        Job document from MongoDB (or a subset).  Expected fields:
          requiredSkills  — list[str]  (or legacy "skills")
          description     — str
          experienceLevel — str

    Returns
    -------
    dict with keys:
        finalScore      : float          — weighted total (0–100)
        breakdown       : dict           — per-component score/weight/contribution
        skillsMatched   : list[str]      — job skills the applicant has
        skillsMissing   : list[str]      — job skills the applicant lacks
        matchCount      : int
        totalRequired   : int
        feedback        : str            — human-readable summary
        experienceMatch : str            — 'match' | 'under' | 'over' | 'unknown'

    Example return value
    --------------------
    {
        "finalScore": 84.5,
        "breakdown": {
            "skillScore":      {"score": 90.0, "weight": 0.40, "contribution": 36.0},
            "semanticScore":   {"score": 78.0, "weight": 0.30, "contribution": 23.4},
            "experienceScore": {"score": 80.0, "weight": 0.20, "contribution": 16.0},
            "toolsScore":      {"score": 90.0, "weight": 0.10, "contribution":  9.0},
        },
        "skillsMatched":  ["React", "Node.js"],
        "skillsMissing":  ["Docker", "AWS"],
        "matchCount":     8,
        "totalRequired":  10,
        "feedback":       "Strong match! You have most required skills.",
        "experienceMatch": "match",
    }
    """
    profile     = applicant_data.get("applicantProfile") or {}
    pro_info    = profile.get("professionalInfo") or {}
    resume_info = profile.get("resume") or {}

    # ── Extract applicant data ────────────────────────────────────────────────
    # Combine structured onboarding skills + resume text skills + tools
    # so the skill match component sees everything the applicant knows,
    # not just what they explicitly listed during onboarding.
    applicant_skills: list[str] = get_combined_applicant_skills(applicant_data)
    applicant_tools: list[str]  = [
        t for t in (profile.get("tools") or []) if isinstance(t, str) and t.strip()
    ]
    resume_text: str = resume_info.get("rawText") or ""

    # ── Experience extraction — resume text is more reliable than the dropdown ─
    # Priority 1 — extract numeric years from resume text
    applicant_years: Optional[float] = None
    if resume_text:
        applicant_years = extract_experience_from_text(resume_text)
        print(f"[experience] from resume text: {applicant_years}")

    # Priority 2 — seniority signals from resume text
    if applicant_years is None and resume_text:
        seniority_signal = extract_seniority_from_text(resume_text)
        print(f"[experience] seniority from resume: {seniority_signal}")
        if seniority_signal:
            seniority_to_years = {"entry": 1.0, "mid": 3.5, "senior": 6.5, "lead": 9.0}
            applicant_years = seniority_to_years[seniority_signal]

    # Priority 3 — onboarding dropdown (least reliable, user may have filled incorrectly)
    if applicant_years is None:
        years_raw = pro_info.get("yearsOfExp")
        applicant_years = _parse_years_of_exp(years_raw)
        print(f"[experience] from onboarding dropdown: {applicant_years}")

    print(f"[experience] final applicant_years: {applicant_years}")

    # ── Extract job data ──────────────────────────────────────────────────────
    job_skills: list[str] = job_data.get("requiredSkills") or job_data.get("skills") or []
    job_description: str  = job_data.get("description") or ""
    job_level: str        = (job_data.get("experienceLevel") or "").strip().lower()

    # ── Certifications (used by Component 4) ─────────────────────────────────
    applicant_certs: list[str] = [
        c for c in (profile.get("certifications") or []) if isinstance(c, str) and c.strip()
    ]

    # ── Component 1: Skill match (40%) ────────────────────────────────────────
    skill_result  = calculate_skill_match(applicant_skills, job_skills)
    skill_score   = skill_result["matchScore"]
    skills_matched = skill_result["matchedSkills"]
    skills_missing = skill_result["missingSkills"]
    match_count    = skill_result["matchCount"]
    total_required = skill_result["totalRequired"]

    # ── Component 2: Semantic similarity (30%) ────────────────────────────────
    # Use preprocessed resume text vs preprocessed job text for best signal.
    # Fall back to skill-list semantic similarity if resume text is absent.
    if resume_text.strip():
        clean_resume = preprocess_resume(resume_text)
        clean_job    = preprocess_job(job_description, job_skills)
        semantic_score = get_semantic_similarity(clean_resume, clean_job)
    elif applicant_skills and job_skills:
        # No resume text — compare skill lists semantically
        from services.similarity import get_skill_semantic_similarity
        semantic_score = get_skill_semantic_similarity(applicant_skills, job_skills)
    else:
        semantic_score = 0.0

    # ── Component 3: ATS keyword match (30%) ─────────────────────────────────
    if resume_text.strip():
        ats_result = calculate_ats_score(resume_text, job_description, job_skills)
        ats_score  = ats_result["atsScore"]
    else:
        ats_score  = 0.0
        ats_result = {"keywordsMatched": [], "keywordsMissing": [], "totalKeywords": 0}

    # ── Component 4: Experience match (15%) ───────────────────────────────────
    exp_score = _experience_score(applicant_years, job_level)

    # Derive human-readable experience alignment label
    if applicant_years is None or not job_level or job_level == "any":
<<<<<<< HEAD
        exp_match_label = "unknown" if (applicant_years is None or not job_level) else "match"
=======
        exp_match_label = "unknown" if (applicant_years is None or not job_level) else "good"
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
    else:
        applicant_level = _years_to_level(applicant_years)
        idx_a = _EXP_ORDER.index(applicant_level) if applicant_level in _EXP_ORDER else -1
        idx_j = _EXP_ORDER.index(job_level)        if job_level        in _EXP_ORDER else -1
        if idx_a == idx_j:
<<<<<<< HEAD
            exp_match_label = "match"
        elif idx_a < idx_j:
            exp_match_label = "under"
        else:
            exp_match_label = "over"
=======
            exp_match_label = "good"
        elif idx_a < idx_j:
            exp_match_label = "underqualified"
        else:
            exp_match_label = "overqualified"
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3

    # ── Component 5: Tools match (5%) ────────────────────────────────────────
    # Combines structured tools/certs from onboarding with DevOps/tool-category
    # skills found in the resume text, then checks how many appear in the job.
    tools_list = profile.get("tools") or []
    certs_list = profile.get("certifications") or []

    # Structured tools and certs from onboarding profile
    structured_tools: list[str] = normalize_skills_list(tools_list + certs_list)

    # DevOps/tool skills already in the combined skill list (from resume text)
    _devops_and_tools: set[str] = {
        s.lower()
        for s in (
            SKILL_CATEGORIES.get("cloud_devops", [])
            + SKILL_CATEGORIES.get("tools", [])
        )
    }
    resume_tool_skills: list[str] = [
        s for s in applicant_skills if s.lower() in _devops_and_tools
    ]

    # Merge all tool sources, deduplicated to lowercase for matching
    all_tools: list[str] = list({
        t.lower()
        for t in structured_tools + resume_tool_skills
        if t and t.strip()
    })

    # Match against the full job text (description + required skills)
    job_full_text = (job_description + " " + " ".join(job_skills)).lower()

    if all_tools:
        tools_in_job = [t for t in all_tools if t in job_full_text]
        tools_score  = round((len(tools_in_job) / len(all_tools)) * 100, 2)
        print(
            f"[tools] all_tools={all_tools} "
            f"matched={len(tools_in_job)}/{len(all_tools)}"
        )
    else:
        tools_in_job = []
        tools_score  = 50.0   # neutral when no tools data is available
        print("[tools] no tools data — using neutral score 50")

    # ── Weighted final score (5 components) ──────────────────────────────────
    final_score = round(
        min(
            skill_score    * _W_SKILL
            + semantic_score * _W_SEMANTIC
            + ats_score      * _W_ATS
            + exp_score      * _W_EXPERIENCE
            + tools_score    * _W_TOOLS,
            100.0,
        ),
        2,
    )

<<<<<<< HEAD
    # ── Breakdown (4 components, ATS folded into semanticScore) ──────────────
    # The ATS score is computed separately but its contribution is merged into
    # the semanticScore component so the breakdown always has exactly four keys:
    # skillScore, semanticScore, experienceScore, toolsScore.
    _combined_text_weight = _W_SEMANTIC + _W_ATS
    _combined_text_contribution = round(
        semantic_score * _W_SEMANTIC + ats_score * _W_ATS, 2
    )
    _combined_text_score = round(
        _combined_text_contribution / _combined_text_weight
        if _combined_text_weight > 0 else 0.0,
        2,
    )
=======
    # ── Breakdown ─────────────────────────────────────────────────────────────
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
    breakdown = {
        "skillScore": {
            "score":        round(skill_score, 2),
            "weight":       _W_SKILL,
            "contribution": round(skill_score * _W_SKILL, 2),
        },
        "semanticScore": {
<<<<<<< HEAD
            "score":           _combined_text_score,
            "weight":          _combined_text_weight,
            "contribution":    _combined_text_contribution,
=======
            "score":        round(semantic_score, 2),
            "weight":       _W_SEMANTIC,
            "contribution": round(semantic_score * _W_SEMANTIC, 2),
        },
        "atsScore": {
            "score":           round(ats_score, 2),
            "weight":          _W_ATS,
            "contribution":    round(ats_score * _W_ATS, 2),
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
            "keywordsMatched": len(ats_result.get("keywordsMatched", [])),
            "keywordsMissing": len(ats_result.get("keywordsMissing", [])),
        },
        "experienceScore": {
            "score":        round(exp_score, 2),
            "weight":       _W_EXPERIENCE,
            "contribution": round(exp_score * _W_EXPERIENCE, 2),
        },
        "toolsScore": {
            "score":        round(tools_score, 2),
            "weight":       _W_TOOLS,
            "contribution": round(tools_score * _W_TOOLS, 2),
        },
    }

    # ── Feedback string ───────────────────────────────────────────────────────
    if final_score >= 80:
        feedback = "Strong match! You have most required skills."
    elif final_score >= 60:
        feedback = "Good potential. Consider learning missing skills."
    else:
        feedback = "Partial match. Significant skill gaps exist."

    # ── Experience summary for response ──────────────────────────────────────
    exp_summary = get_experience_summary(applicant_data)
    print(
        f"[experience] summary: {exp_summary['totalYears']} years | "
        f"{exp_summary['seniorityLevel']} | source: {exp_summary['source']}"
    )

    return {
        "finalScore":          final_score,
        "breakdown":           breakdown,
        "skillsMatched":       skills_matched,
        "skillsMissing":       skills_missing,
        "matchCount":          match_count,
        "totalRequired":       total_required,
        "feedback":            feedback,
        "experienceMatch":     exp_match_label,
<<<<<<< HEAD
        "experienceMatch":     exp_match_label,
=======
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
        "experienceSummary":   exp_summary,
        "atsKeywordsMatched":  ats_result.get("keywordsMatched", []),
        "atsKeywordsMissing":  ats_result.get("keywordsMissing", []),
        "atsTotalKeywords":    ats_result.get("totalKeywords", 0),
    }
