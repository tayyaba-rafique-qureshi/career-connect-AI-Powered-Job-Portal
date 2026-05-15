"""
services/career_advisor.py
---------------------------
Career path recommendations for the CareerConnect AI service.

One pure function — no database calls, no HTTP concerns:

  get_career_recommendations(missing_skills, current_skills, job_data) -> dict

Returns actionable, prioritised advice for an applicant who wants to
improve their match score for a specific job.
"""

from __future__ import annotations


# ── Skill priority classification ─────────────────────────────────────────────
# Skills that appear frequently in job postings and have high market value
# are classified as "high" priority.  Everything else defaults to "medium".

_HIGH_PRIORITY_SKILLS: set[str] = {
    # Cloud & DevOps
    "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd",
    "github actions", "jenkins", "terraform",
    # Backend
    "python", "node.js", "java", "go", "django", "fastapi", "spring boot",
    # Frontend
    "react", "typescript", "next.js",
    # Data
    "postgresql", "mongodb", "redis",
    # AI/ML
    "tensorflow", "pytorch", "scikit-learn",
}

# ── Learning resources ────────────────────────────────────────────────────────
# Maps lowercase skill name → concise free resource URL.

_RESOURCES: dict[str, str] = {
    "docker":           "docs.docker.com/get-started",
    "kubernetes":       "kubernetes.io/docs/tutorials",
    "aws":              "aws.amazon.com/training",
    "azure":            "learn.microsoft.com/azure",
    "gcp":              "cloud.google.com/training",
    "ci/cd":            "docs.github.com/actions",
    "github actions":   "docs.github.com/actions/quickstart",
    "jenkins":          "jenkins.io/doc/tutorials",
    "terraform":        "developer.hashicorp.com/terraform/tutorials",
    "python":           "docs.python.org/3/tutorial",
    "node.js":          "nodejs.org/en/docs/guides",
    "java":             "docs.oracle.com/javase/tutorial",
    "go":               "tour.golang.org",
    "django":           "docs.djangoproject.com/en/stable/intro",
    "fastapi":          "fastapi.tiangolo.com/tutorial",
    "spring boot":      "spring.io/guides",
    "react":            "react.dev/learn",
    "typescript":       "typescriptlang.org/docs/handbook",
    "next.js":          "nextjs.org/docs",
    "vue":              "vuejs.org/guide/introduction",
    "angular":          "angular.io/tutorial",
    "postgresql":       "postgresql.org/docs/current/tutorial",
    "mongodb":          "learn.mongodb.com",
    "redis":            "redis.io/docs/getting-started",
    "mysql":            "dev.mysql.com/doc/refman/8.0/en/tutorial",
    "tensorflow":       "tensorflow.org/tutorials",
    "pytorch":          "pytorch.org/tutorials",
    "scikit-learn":     "scikit-learn.org/stable/user_guide",
    "pandas":           "pandas.pydata.org/docs",
    "numpy":            "numpy.org/doc/stable/user",
    "git":              "git-scm.com/book",
    "linux":            "linuxcommand.org",
    "figma":            "help.figma.com",
    "jira":             "university.atlassian.com",
    "postman":          "learning.postman.com",
    "c++":              "learncpp.com",
    "c#":               "learn.microsoft.com/dotnet/csharp",
    "kotlin":           "play.kotlinlang.org/koans",
    "swift":            "docs.swift.org/swift-book",
    "r":                "r4ds.had.co.nz",
}

_DEFAULT_RESOURCE = "coursera.org or edX.org (search for free courses)"


def _resource_for(skill: str) -> str:
    return _RESOURCES.get(skill.strip().lower(), _DEFAULT_RESOURCE)


def _priority_for(skill: str) -> str:
    return "high" if skill.strip().lower() in _HIGH_PRIORITY_SKILLS else "medium"


# ── Career path role suggestions ──────────────────────────────────────────────
# Maps a frozenset of skill keywords → a suggested career path label.
# Checked in order; first match wins.

_CAREER_PATHS: list[tuple[set[str], str]] = [
    ({"docker", "kubernetes", "aws"},          "DevOps / Cloud Engineer"),
    ({"docker", "aws"},                        "Cloud Developer"),
    ({"docker", "ci/cd"},                      "DevOps Engineer"),
    ({"tensorflow", "pytorch"},                "Machine Learning Engineer"),
    ({"scikit-learn", "pandas"},               "Data Scientist"),
    ({"react", "typescript", "next.js"},       "Senior Frontend Engineer"),
    ({"react", "node.js"},                     "Full-Stack JavaScript Developer"),
    ({"django", "postgresql"},                 "Python Backend Developer"),
    ({"spring boot", "java"},                  "Java Backend Developer"),
    ({"fastapi", "python"},                    "Python API Developer"),
    ({"node.js", "mongodb"},                   "Node.js Full-Stack Developer"),
    ({"aws", "python"},                        "Cloud / Backend Engineer"),
    ({"kubernetes", "docker"},                 "Container Platform Engineer"),
]


def _suggest_career_path(
    current_skills: list[str],
    missing_skills: list[str],
) -> str:
    """
    Suggest a career path label based on the union of current + missing skills.

    Checks each entry in _CAREER_PATHS and returns the label for the first
    path whose required skills are all present in the combined set.
    Falls back to a generic message if no path matches.
    """
    combined = {s.strip().lower() for s in current_skills + missing_skills}

    for required_set, label in _CAREER_PATHS:
        if required_set <= combined:          # required_set is a subset of combined
            return label

    return "Specialist in your current domain"


# ── Public function ───────────────────────────────────────────────────────────

def get_career_recommendations(
    missing_skills: list[str],
    current_skills: list[str],
    job_data: dict,
) -> dict:
    """
    Generate prioritised career advice for an applicant who wants to
    improve their match score for a specific job.

    Parameters
    ----------
    missing_skills : list[str]
        Skills the job requires that the applicant currently lacks.
        Sourced from matching_engine.calculate_match_score()["skillsMissing"].
    current_skills : list[str]
        Skills the applicant already has (normalised strings).
    job_data : dict
        Job document from MongoDB.  Used for job title, description, and
        required skills ordering (first-listed = higher priority).

    Returns
    -------
    dict with keys:
        immediateActions         : list[dict]  — high-priority skills to learn now
                                   Each entry: {skill, priority, reason, resource}
        shortTermGoals           : list[str]   — concrete 1–3 month milestones
        careerPathSuggestion     : str         — role the applicant could target
        estimatedImprovementScore: str         — e.g. "+15% match score if Docker and AWS added"

    Example
    -------
    >>> get_career_recommendations(
    ...     missing_skills=["Docker", "AWS"],
    ...     current_skills=["Python", "Django"],
    ...     job_data={"title": "Backend Engineer", "requiredSkills": ["Python", "Docker", "AWS"]},
    ... )
    {
        "immediateActions": [
            {"skill": "Docker", "priority": "high",
             "reason": "Required in similar roles", "resource": "docs.docker.com/get-started"},
            {"skill": "AWS",    "priority": "high",
             "reason": "Required in similar roles", "resource": "aws.amazon.com/training"},
        ],
        "shortTermGoals": [
            "Complete Docker fundamentals course",
            "Build a project using AWS",
            "Add Docker and AWS to your resume",
        ],
        "careerPathSuggestion": "Cloud Developer",
        "estimatedImprovementScore": "+15% match score if Docker and AWS added",
    }
    """
    job_title = job_data.get("title", "this role")

    # ── Immediate actions ─────────────────────────────────────────────────────
    # Prioritise skills that appear early in the job's requiredSkills list
    # (employers typically list the most important skills first).
    required_order: list[str] = (
        job_data.get("requiredSkills") or job_data.get("skills") or []
    )
    required_lower_order = [s.strip().lower() for s in required_order]
    missing_lower_set    = {s.strip().lower() for s in missing_skills}

    # Build ordered missing list: first those in required_order, then the rest
    ordered_missing: list[str] = []
    seen_lower: set[str] = set()

    for req in required_lower_order:
        if req in missing_lower_set and req not in seen_lower:
            # Find the original-casing version from missing_skills
            for ms in missing_skills:
                if ms.strip().lower() == req:
                    ordered_missing.append(ms)
                    seen_lower.add(req)
                    break

    # Append any missing skills not in the required_order list
    for ms in missing_skills:
        if ms.strip().lower() not in seen_lower:
            ordered_missing.append(ms)
            seen_lower.add(ms.strip().lower())

    immediate_actions: list[dict] = []
    for skill in ordered_missing[:5]:          # cap at 5 immediate actions
        immediate_actions.append({
            "skill":    skill,
            "priority": _priority_for(skill),
            "reason":   f"Required in {job_title} and similar roles",
            "resource": _resource_for(skill),
        })

    # ── Short-term goals ──────────────────────────────────────────────────────
    short_term_goals: list[str] = []

    for skill in ordered_missing[:3]:
        short_term_goals.append(f"Complete {skill} fundamentals course")

    if ordered_missing:
        skills_str = " and ".join(ordered_missing[:2])
        short_term_goals.append(f"Build a project using {skills_str}")
        short_term_goals.append(
            f"Add {', '.join(ordered_missing[:3])} to your resume and portfolio"
        )

    if not short_term_goals:
        short_term_goals.append("Strengthen existing skills with advanced projects")

    # ── Career path suggestion ────────────────────────────────────────────────
    career_path = _suggest_career_path(current_skills, missing_skills)

    # ── Estimated improvement score ───────────────────────────────────────────
    # Each missing skill contributes roughly equally to the skill-match
    # component (weight 0.40).  Adding k skills out of m missing improves
    # the skill score by (k/m) × 100 points, contributing 0.40 × that gain.
    total_required = len(
        job_data.get("requiredSkills") or job_data.get("skills") or []
    )
    skills_to_add = ordered_missing[:2]        # estimate based on top 2

    if total_required > 0 and skills_to_add:
        gain_pct = round((len(skills_to_add) / total_required) * 100 * 0.40)
        skills_label = " and ".join(skills_to_add)
        estimated = f"+{gain_pct}% match score if {skills_label} added"
    elif skills_to_add:
        skills_label = " and ".join(skills_to_add)
        estimated = f"Meaningful improvement expected if {skills_label} added"
    else:
        estimated = "Profile already covers all required skills"

    return {
        "immediateActions":          immediate_actions,
        "shortTermGoals":            short_term_goals,
        "careerPathSuggestion":      career_path,
        "estimatedImprovementScore": estimated,
    }
