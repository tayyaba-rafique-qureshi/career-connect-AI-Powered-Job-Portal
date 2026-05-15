"""
services/recommendation_engine.py
-----------------------------------
Job recommendation engine for CareerConnect.

Pure functions — no database calls, no HTTP concerns.
All MongoDB I/O happens in the route handler; this module receives
plain Python dicts and returns plain Python dicts.

Public API
----------
get_recommendations(applicant_data, all_jobs, threshold) -> list
    Score every job, apply preference boosts, filter below threshold,
    remove already-applied jobs, sort descending, return top 20.

apply_preference_boost(base_score, applicant_prefs, job) -> float
    Add up to +5 bonus points for preference matches.  Never exceeds 100.

filter_already_applied(jobs, applied_job_ids) -> list
    Remove jobs the applicant has already applied to.
"""

from __future__ import annotations

from services.matching_engine import calculate_match_score
from services.feedback_generator import generate_applicant_feedback

# Maximum bonus that preference matching can add to a base score
_MAX_PREFERENCE_BONUS = 5.0

# Hard cap on recommendations returned
_MAX_RECOMMENDATIONS = 20


# ── Preference boost ──────────────────────────────────────────────────────────

def apply_preference_boost(
    base_score: float,
    applicant_prefs: dict,
    job: dict,
) -> float:
    """
    Add a small bonus to a base match score when the job aligns with the
    applicant's stated preferences.

    Bonus breakdown (each match adds an equal share of the max bonus):
      - workMode match          → up to 1.67 pts
      - jobType overlap         → up to 1.67 pts
      - location / salary match → up to 1.67 pts  (combined)

    The total bonus is capped at _MAX_PREFERENCE_BONUS (5.0) and the
    returned score is capped at 100.0.

    Parameters
    ----------
    base_score       : float — score from calculate_match_score (0–100)
    applicant_prefs  : dict  — applicantProfile.preferences from MongoDB
                               Expected keys (all optional):
                                 workMode, jobType, preferredLocations,
                                 salaryMin, salaryMax
    job              : dict  — job document from MongoDB

    Returns
    -------
    float — boosted score in [0.0, 100.0]
    """
    if not applicant_prefs:
        return base_score

    bonus = 0.0
    # Each of the three preference categories contributes up to 1/3 of the max
    share = _MAX_PREFERENCE_BONUS / 3.0

    # ── Work mode ─────────────────────────────────────────────────────────────
    pref_work_mode = (applicant_prefs.get("workMode") or "").strip().lower()
    job_work_mode  = (job.get("workMode") or "").strip().lower()
    if pref_work_mode and job_work_mode and pref_work_mode == job_work_mode:
        bonus += share

    # ── Job type ──────────────────────────────────────────────────────────────
    pref_job_types = {t.strip().lower() for t in (applicant_prefs.get("jobType") or [])}
    job_types      = {t.strip().lower() for t in (job.get("jobType") or [])}
    if pref_job_types and job_types and pref_job_types & job_types:
        bonus += share

    # ── Location + salary (combined into the third share) ────────────────────
    location_match = False
    salary_match   = False

    pref_locations = [l.strip().lower() for l in (applicant_prefs.get("preferredLocations") or [])]
    job_location   = (job.get("location") or "").strip().lower()
    if pref_locations and job_location:
        if any(loc in job_location or job_location in loc for loc in pref_locations):
            location_match = True

    pref_salary_min = applicant_prefs.get("salaryMin")
    pref_salary_max = applicant_prefs.get("salaryMax")
    job_salary_min  = job.get("salaryMin")
    job_salary_max  = job.get("salaryMax")

    if (
        pref_salary_min is not None
        and job_salary_max is not None
        and job_salary_max >= pref_salary_min
    ):
        salary_match = True
    if (
        pref_salary_max is not None
        and job_salary_min is not None
        and job_salary_min <= pref_salary_max
    ):
        salary_match = True

    if location_match or salary_match:
        bonus += share

    boosted = base_score + bonus
    return round(min(boosted, 100.0), 2)


# ── Already-applied filter ────────────────────────────────────────────────────

def filter_already_applied(
    jobs: list[dict],
    applied_job_ids: list[str],
) -> list[dict]:
    """
    Remove jobs the applicant has already applied to.

    Parameters
    ----------
    jobs             : list[dict] — job documents (each must have "_id" as str)
    applied_job_ids  : list[str]  — job IDs from the applicant's applications

    Returns
    -------
    list[dict] — jobs with applied ones removed, order preserved
    """
    if not applied_job_ids:
        return jobs

    applied_set = {str(jid) for jid in applied_job_ids}
    return [j for j in jobs if str(j.get("_id", "")) not in applied_set]


# ── Main recommendation function ──────────────────────────────────────────────

def get_recommendations(
    applicant_data: dict,
    all_jobs: list[dict],
    threshold: float = 60.0,
    applied_job_ids: list[str] | None = None,
) -> list[dict]:
    """
    Score every active job for the applicant, apply preference boosts,
    filter below threshold, remove already-applied jobs, and return the
    top 20 sorted by score descending.

    Handles applicants with no resume text gracefully — calculate_match_score
    falls back to skill-list semantic similarity when rawText is absent, so
    this function never raises due to a missing resume.

    Parameters
    ----------
    applicant_data   : dict       — full applicant MongoDB document
    all_jobs         : list[dict] — active job documents (ObjectIds pre-stringified)
    threshold        : float      — minimum score to include (default 60.0)
    applied_job_ids  : list[str]  — job IDs already applied to (default [])

    Returns
    -------
    list[dict]
        Up to 20 recommendation dicts, each containing:
          job            : dict       — the full job document
          matchScore     : float      — boosted final score
          skillsMatched  : list[str]
          skillsMissing  : list[str]
          applicantFeedback : dict    — from generate_applicant_feedback()
    """
    if applied_job_ids is None:
        applied_job_ids = []

    profile = applicant_data.get("applicantProfile") or {}
    prefs   = profile.get("preferences") or {}

    # Remove jobs already applied to before scoring (saves compute)
    candidate_jobs = filter_already_applied(all_jobs, applied_job_ids)

    scored: list[dict] = []

    for job in candidate_jobs:
        # ── Score ─────────────────────────────────────────────────────────────
        # calculate_match_score handles missing resume text internally
        match_result = calculate_match_score(
            applicant_data=applicant_data,
            job_data=job,
        )

        base_score = match_result["finalScore"]

        # ── Preference boost ──────────────────────────────────────────────────
        boosted_score = apply_preference_boost(base_score, prefs, job)

        # ── Threshold filter ──────────────────────────────────────────────────
        if boosted_score < threshold:
            continue

        # ── Applicant-facing feedback ─────────────────────────────────────────
        # Pass the boosted score into the feedback so the headline reflects
        # the final displayed score, not the raw engine score.
        feedback_result = {**match_result, "finalScore": boosted_score}
        applicant_feedback = generate_applicant_feedback(
            match_result=feedback_result,
            job_data=job,
        )

        scored.append({
            "job":               job,
            "matchScore":        boosted_score,
            "skillsMatched":     match_result["skillsMatched"],
            "skillsMissing":     match_result["skillsMissing"],
            "applicantFeedback": applicant_feedback,
        })

    # Sort descending by boosted score, return top 20
    scored.sort(key=lambda x: x["matchScore"], reverse=True)
    return scored[:_MAX_RECOMMENDATIONS]
