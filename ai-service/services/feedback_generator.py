"""
services/feedback_generator.py
--------------------------------
Explainable AI feedback generators for the CareerConnect matching engine.

Three pure functions — no database calls, no HTTP concerns:

  generate_applicant_feedback(match_result, job_data) -> dict
      Human-readable feedback for the job seeker: headline, summary,
      strengths, gaps with learning suggestions, recommendation, and
      skill-gap resources.

  generate_recruiter_feedback(match_result, applicant_data) -> dict
      Concise recruiter-facing summary: badge, colour, top strengths,
      key gaps, hiring recommendation, and score breakdown text.

  generate_skill_gap_analysis(matched, missing, job_data) -> dict
      Structured gap analysis: counts, percentages, critical vs nice-to-have
      missing skills, and an improvement priority list.

All inputs are plain Python dicts/lists.  All outputs are plain dicts
suitable for direct JSON serialisation.
"""

from __future__ import annotations


# ── Learning resource suggestions ────────────────────────────────────────────
# Maps lowercase skill name → a free/official starting resource.
# Extend this dict as the skill dictionary grows.

_SKILL_RESOURCES: dict[str, str] = {
    "docker":           "Try docs.docker.com/get-started",
    "aws":              "Free training at aws.amazon.com/training",
    "kubernetes":       "Interactive tutorial at kubernetes.io/docs/tutorials",
    "azure":            "Free learning paths at learn.microsoft.com/azure",
    "gcp":              "Free tier + labs at cloud.google.com/training",
    "ci/cd":            "GitHub Actions quickstart at docs.github.com/actions",
    "jenkins":          "Official docs at jenkins.io/doc/tutorials",
    "github actions":   "Quickstart at docs.github.com/actions/quickstart",
    "tensorflow":       "Beginner guide at tensorflow.org/tutorials",
    "pytorch":          "60-minute blitz at pytorch.org/tutorials",
    "scikit-learn":     "User guide at scikit-learn.org/stable/user_guide",
    "pandas":           "10-minute intro at pandas.pydata.org/docs",
    "numpy":            "Absolute beginners at numpy.org/doc/stable/user",
    "postgresql":       "Official tutorial at postgresql.org/docs/current/tutorial",
    "mongodb":          "University courses at learn.mongodb.com",
    "redis":            "Intro at redis.io/docs/getting-started",
    "mysql":            "Tutorial at dev.mysql.com/doc/refman/8.0/en/tutorial",
    "typescript":       "Handbook at typescriptlang.org/docs/handbook",
    "react":            "Official tutorial at react.dev/learn",
    "vue":              "Guide at vuejs.org/guide/introduction",
    "angular":          "Tour of Heroes at angular.io/tutorial",
    "next.js":          "Getting started at nextjs.org/docs",
    "node.js":          "Guides at nodejs.org/en/docs/guides",
    "django":           "Official tutorial at docs.djangoproject.com/en/stable/intro",
    "fastapi":          "Tutorial at fastapi.tiangolo.com/tutorial",
    "flask":            "Quickstart at flask.palletsprojects.com/quickstart",
    "spring boot":      "Guides at spring.io/guides",
    "git":              "Pro Git book (free) at git-scm.com/book",
    "linux":            "Linux command line at linuxcommand.org",
    "python":           "Official tutorial at docs.python.org/3/tutorial",
    "java":             "Oracle tutorials at docs.oracle.com/javase/tutorial",
    "go":               "Tour of Go at tour.golang.org",
    "kotlin":           "Koans at play.kotlinlang.org/koans",
    "swift":            "Swift book at docs.swift.org/swift-book",
    "c++":              "Learn C++ at learncpp.com",
    "c#":               ".NET tutorial at learn.microsoft.com/dotnet/csharp",
    "r":                "R for Data Science (free) at r4ds.had.co.nz",
    "figma":            "Figma basics at help.figma.com/hc/en-us/categories/360002051613",
    "jira":             "Atlassian University at university.atlassian.com",
    "postman":          "Learning centre at learning.postman.com",
}

_DEFAULT_RESOURCE = "Search for free courses on Coursera, edX, or YouTube"


def _resource_for(skill: str) -> str:
    """Return a learning resource suggestion for a skill name."""
    return _SKILL_RESOURCES.get(skill.strip().lower(), _DEFAULT_RESOURCE)


# ── Recommendation thresholds ─────────────────────────────────────────────────
_THRESHOLD_APPLY   = 75.0
_THRESHOLD_CONSIDER = 55.0

# ── Badge thresholds ──────────────────────────────────────────────────────────
_THRESHOLD_EXCELLENT = 85.0
_THRESHOLD_GOOD      = 70.0
_THRESHOLD_PARTIAL   = 55.0


# ── Public functions ──────────────────────────────────────────────────────────

def generate_applicant_feedback(match_result: dict, job_data: dict) -> dict:
    """
    Generate human-readable, explainable feedback for the job applicant.

    Parameters
    ----------
    match_result : dict
        Output of matching_engine.calculate_match_score().  Expected keys:
          finalScore, skillsMatched, skillsMissing, matchCount,
          totalRequired, breakdown, experienceMatch.
    job_data : dict
        Job document from MongoDB.  Used for job title in messaging.

    Returns
    -------
    dict with keys:
        headline            : str   — e.g. "Strong Match — 84% Compatible"
        summary             : str   — e.g. "You match 8 out of 10 required skills."
        strengths           : list[str]
        gaps                : list[str]  — gap descriptions with action hints
        recommendation      : str   — "apply" | "consider" | "upskill_first"
        recommendationText  : str   — full sentence recommendation
        skillGapResources   : list[dict]  — [{skill, suggestion}, …]
    """
    score          = match_result.get("finalScore", 0.0)
    matched_raw    = match_result.get("skillsMatched", [])
    missing        = match_result.get("skillsMissing", [])
    match_count    = match_result.get("matchCount", len(matched_raw))
    total_required = match_result.get("totalRequired", len(matched_raw) + len(missing))
    breakdown      = match_result.get("breakdown", {})
    exp_match      = match_result.get("experienceMatch", "unknown")
    job_title      = job_data.get("title", "this role")

    # Normalise: skillsMatched may be list[dict] (new) or list[str] (legacy)
    matched: list[str] = [
        s["skill"] if isinstance(s, dict) else s
        for s in matched_raw
    ]

    # ── Headline ──────────────────────────────────────────────────────────────
    if score >= 85:
        tier = "Excellent Match"
    elif score >= 75:
        tier = "Strong Match"
    elif score >= 60:
        tier = "Good Match"
    elif score >= 45:
        tier = "Partial Match"
    else:
        tier = "Low Match"

    headline = f"{tier} — {score:.0f}% Compatible"

    # ── Summary ───────────────────────────────────────────────────────────────
    if total_required > 0:
        summary = f"You match {match_count} out of {total_required} required skills."
    else:
        summary = "No specific skills were listed for this role."

    # ── Strengths ─────────────────────────────────────────────────────────────
    strengths: list[str] = []

    # Skill strengths — mention up to 3 matched skills
    for skill in matched[:3]:
        strengths.append(f"Strong {skill} experience")

    # Semantic / text similarity strength
    sem_score = breakdown.get("semanticScore", {}).get("score", 0.0)
    if sem_score >= 70:
        strengths.append("Your resume language aligns well with the job description")

    # Experience strength
    if exp_match == "match":
        strengths.append("Your experience level matches the role requirements")
    elif exp_match == "over":
        strengths.append("You bring more experience than the minimum required")

    # Tools strength
    tools_score = breakdown.get("toolsScore", {}).get("score", 0.0)
    if tools_score >= 60:
        strengths.append("Your toolset aligns with what this role uses")

    if not strengths:
        strengths.append("You have transferable skills that may be relevant")

    # ── Gaps ──────────────────────────────────────────────────────────────────
    gaps: list[str] = []

    for skill in missing[:5]:
        gaps.append(f"Missing {skill} — consider a free {skill} course")

    if exp_match == "under":
        gaps.append("You may be under-experienced — consider applying anyway or building more projects")

    if sem_score < 40 and total_required > 0:
        gaps.append("Your resume language doesn't closely match the job description — tailor your CV")

    # ── Recommendation ────────────────────────────────────────────────────────
    if score >= _THRESHOLD_APPLY:
        recommendation      = "apply"
        recommendation_text = (
            f"We recommend applying — your profile is a strong fit for {job_title}."
        )
    elif score >= _THRESHOLD_CONSIDER:
        recommendation      = "consider"
        recommendation_text = (
            f"You could apply for {job_title}, but addressing the skill gaps first "
            "would significantly improve your chances."
        )
    else:
        recommendation      = "upskill_first"
        recommendation_text = (
            f"We suggest upskilling before applying for {job_title}. "
            "Focus on the missing skills listed below."
        )

    # ── Skill gap resources ───────────────────────────────────────────────────
    skill_gap_resources = [
        {"skill": skill, "suggestion": _resource_for(skill)}
        for skill in missing[:5]
    ]

    return {
        "headline":           headline,
        "summary":            summary,
        "strengths":          strengths,
        "gaps":               gaps,
        "recommendation":     recommendation,
        "recommendationText": recommendation_text,
        "skillGapResources":  skill_gap_resources,
    }


def generate_recruiter_feedback(match_result: dict, applicant_data: dict) -> dict:
    """
    Generate concise, actionable feedback for the recruiter/employer.

    Parameters
    ----------
    match_result : dict
        Output of matching_engine.calculate_match_score().
    applicant_data : dict
        Applicant MongoDB document.  Used for experience years in messaging.

    Returns
    -------
    dict with keys:
        badge                : str   — "Excellent Match" | "Good Match" | "Partial Match" | "Low Match"
        badgeColor           : str   — "green" | "blue" | "yellow" | "red"
        topStrengths         : list[str]
        keyGaps              : list[str]
        hiringRecommendation : str
        scoreBreakdownText   : str   — "Skill: X% | Semantic: X% | Experience: X% | Tools: X%"
    """
    score     = match_result.get("finalScore", 0.0)
    matched_raw = match_result.get("skillsMatched", [])
    missing   = match_result.get("skillsMissing", [])
    breakdown = match_result.get("breakdown", {})
    exp_match = match_result.get("experienceMatch", "unknown")

    # Normalise: skillsMatched may be list[dict] (new) or list[str] (legacy)
    matched: list[str] = [
        s["skill"] if isinstance(s, dict) else s
        for s in matched_raw
    ]

    profile  = applicant_data.get("applicantProfile") or {}
    pro_info = profile.get("professionalInfo") or {}
    years_raw = pro_info.get("yearsOfExp")
    try:
        years = float(years_raw) if years_raw is not None else None
    except (ValueError, TypeError):
        years = None

    # ── Badge ─────────────────────────────────────────────────────────────────
    if score >= _THRESHOLD_EXCELLENT:
        badge       = "Excellent Match"
        badge_color = "green"
    elif score >= _THRESHOLD_GOOD:
        badge       = "Good Match"
        badge_color = "blue"
    elif score >= _THRESHOLD_PARTIAL:
        badge       = "Partial Match"
        badge_color = "yellow"
    else:
        badge       = "Low Match"
        badge_color = "red"

    # ── Top strengths ─────────────────────────────────────────────────────────
    top_strengths: list[str] = []

    for skill in matched[:3]:
        top_strengths.append(f"{skill} expertise")

    if years is not None:
        top_strengths.append(f"{years:.0f} year{'s' if years != 1 else ''} of experience")

    if exp_match in ("match", "over"):
        top_strengths.append("Experience level aligns with role requirements")

    tools_score = breakdown.get("toolsScore", {}).get("score", 0.0)
    if tools_score >= 60:
        top_strengths.append("Relevant toolset for this role")

    # ── Key gaps ──────────────────────────────────────────────────────────────
    key_gaps: list[str] = [f"Missing {skill}" for skill in missing[:4]]

    if exp_match == "under":
        key_gaps.append("May be under-experienced for this level")

    # ── Hiring recommendation ─────────────────────────────────────────────────
    if score >= _THRESHOLD_EXCELLENT:
        hiring_rec = "Highly recommended for interview"
    elif score >= _THRESHOLD_GOOD:
        hiring_rec = "Recommended for interview — minor skill gaps present"
    elif score >= _THRESHOLD_PARTIAL:
        hiring_rec = "Consider for interview if pipeline is thin — notable gaps exist"
    else:
        hiring_rec = "Not recommended at this time — significant skill gaps"

    # ── Score breakdown text ──────────────────────────────────────────────────
    skill_s = breakdown.get("skillScore",      {}).get("score", 0.0)
    sem_s   = breakdown.get("semanticScore",   {}).get("score", 0.0)
    exp_s   = breakdown.get("experienceScore", {}).get("score", 0.0)
    tool_s  = breakdown.get("toolsScore",      {}).get("score", 0.0)

    score_breakdown_text = (
        f"Skill: {skill_s:.0f}% | "
        f"Semantic: {sem_s:.0f}% | "
        f"Experience: {exp_s:.0f}% | "
        f"Tools: {tool_s:.0f}%"
    )

    return {
        "badge":                badge,
        "badgeColor":           badge_color,
        "topStrengths":         top_strengths,
        "keyGaps":              key_gaps,
        "hiringRecommendation": hiring_rec,
        "scoreBreakdownText":   score_breakdown_text,
    }


def generate_skill_gap_analysis(
    matched: list[str],
    missing: list[str],
    job_data: dict,
) -> dict:
    """
    Produce a structured skill gap analysis for a match result.

    Critical vs nice-to-have classification
    ----------------------------------------
    A missing skill is considered "critical" if it appears in the first
    half of the job's requiredSkills list (i.e. the skills the employer
    listed first, which typically signals higher importance).  The rest
    are classified as "nice to have".

    If the job has no ordered skill list, all missing skills are treated
    as critical.

    Parameters
    ----------
    matched  : list[str] — skills the applicant has that the job requires
    missing  : list[str] — skills the job requires that the applicant lacks
    job_data : dict      — job document; used for requiredSkills ordering

    Returns
    -------
    dict with keys:
        totalRequired      : int
        matched            : int
        missing            : int
        matchPercentage    : float
        criticalMissing    : list[str]
        niceMissing        : list[str]
        improvementPriority: list[str]  — ordered list: critical first, then nice
    """
    total = len(matched) + len(missing)

    match_pct = round((len(matched) / total) * 100, 2) if total > 0 else 0.0

    # Determine critical vs nice-to-have using position in requiredSkills
    required_skills: list[str] = (
        job_data.get("requiredSkills") or job_data.get("skills") or []
    )
    required_lower = [s.strip().lower() for s in required_skills]
    missing_lower  = {s.strip().lower(): s for s in missing}

    if required_lower:
        # First half of the required list → critical
        cutoff = max(1, len(required_lower) // 2)
        critical_keys  = set(required_lower[:cutoff])
        critical_missing = [
            missing_lower[k] for k in required_lower[:cutoff]
            if k in missing_lower
        ]
        nice_missing = [
            missing_lower[k] for k in required_lower[cutoff:]
            if k in missing_lower
        ]
        # Any missing skills not in the ordered list go to critical by default
        accounted = {s.strip().lower() for s in critical_missing + nice_missing}
        for k, original in missing_lower.items():
            if k not in accounted:
                critical_missing.append(original)
    else:
        # No ordered list — treat everything as critical
        critical_missing = list(missing)
        nice_missing     = []

    improvement_priority = critical_missing + nice_missing

    return {
        "totalRequired":       total,
        "matched":             len(matched),
        "missing":             len(missing),
        "matchPercentage":     match_pct,
        "criticalMissing":     critical_missing,
        "niceMissing":         nice_missing,
        "improvementPriority": improvement_priority,
    }
