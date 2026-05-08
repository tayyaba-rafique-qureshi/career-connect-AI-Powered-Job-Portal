"""
utils/text_utils.py
-------------------
Pure utility functions for text normalisation and skill comparison.

No API logic, no database calls, no side effects — every function here
takes plain Python values and returns plain Python values.  This makes
them trivially testable and reusable across the whole service.
"""

import re
import string


def clean_text(text: str) -> str:
    """
    Normalise a raw text string for TF-IDF vectorisation.

    Steps applied in order:
      1. Lowercase everything so 'Python' and 'python' are the same token.
      2. Remove all digits — years, phone numbers, etc. add noise.
      3. Remove punctuation (keeps spaces so words don't merge).
      4. Collapse multiple whitespace characters into a single space.
      5. Strip leading/trailing whitespace.

    Parameters
    ----------
    text : str
        Raw input string (resume snippet, job description, skill list, …).

    Returns
    -------
    str
        Cleaned, normalised string ready for vectorisation.
    """
    if not text:
        return ""

    # 1. Lowercase
    text = text.lower()

    # 2. Remove digits
    text = re.sub(r"\d+", " ", text)

    # 3. Remove punctuation — replace each punctuation char with a space
    #    so "node.js" becomes "node js" rather than "nodejs"
    text = text.translate(str.maketrans(string.punctuation, " " * len(string.punctuation)))

    # 4. Collapse whitespace
    text = re.sub(r"\s+", " ", text)

    # 5. Strip edges
    return text.strip()


def combine_job_text(description: str, skills: list[str]) -> str:
    """
    Merge a job description and its required-skills list into a single
    string suitable for TF-IDF vectorisation.

    Skills are appended after the description, each repeated once so
    they carry slightly more weight without manual boosting.

    Parameters
    ----------
    description : str
        Full job description text.
    skills : list[str]
        Required skills for the role (e.g. ["Python", "FastAPI", "Docker"]).

    Returns
    -------
    str
        Combined string: "<description> <skill1> <skill1> <skill2> <skill2> …"
    """
    skills_text = " ".join(skill for skill in skills for _ in range(2))
    return f"{description} {skills_text}".strip()


def get_skill_overlap(
    applicant_skills: list[str],
    job_skills: list[str],
) -> tuple[list[str], list[str]]:
    """
    Compare two skill lists case-insensitively and return which skills
    the applicant has and which they are missing.

    Parameters
    ----------
    applicant_skills : list[str]
        Skills extracted from the applicant's profile or resume.
    job_skills : list[str]
        Skills required by the job posting.

    Returns
    -------
    tuple[list[str], list[str]]
        (matched_skills, missing_skills) — both lists use the original
        casing from job_skills so the output is human-readable.
    """
    # Build a lowercase lookup set for O(1) membership tests
    applicant_lower = {s.strip().lower() for s in applicant_skills}

    matched: list[str] = []
    missing: list[str] = []

    for skill in job_skills:
        if skill.strip().lower() in applicant_lower:
            matched.append(skill)
        else:
            missing.append(skill)

    return matched, missing
