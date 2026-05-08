"""
services/preprocessing.py
--------------------------
Text preprocessing pipeline for the CareerConnect AI service.

This module sits between raw MongoDB data and the similarity engine.
Its only job is to transform messy, real-world text into clean strings
that TF-IDF can work with effectively.

All cleaning logic lives in utils/text_utils.py — this module just
orchestrates the pipeline and adds domain-specific context (e.g. why
we treat resumes differently from job descriptions).
"""

from utils.text_utils import clean_text, combine_job_text


def preprocess_resume(raw_text: str) -> str:
    """
    Clean and normalise resume text for TF-IDF vectorisation.

    Resumes contain a lot of noise: dates, phone numbers, addresses,
    formatting artefacts from PDF extraction, and inconsistent casing.
    We strip all of that so the vectoriser focuses on meaningful tokens
    (skills, technologies, role titles, domain vocabulary).

    Parameters
    ----------
    raw_text : str
        Raw resume text, typically extracted from a PDF via pdfplumber
        or stored as-is in MongoDB under user.applicantProfile.resume.rawText.

    Returns
    -------
    str
        Cleaned string ready to be passed to calculate_cosine_similarity().

    Example
    -------
    >>> preprocess_resume("John Doe  |  john@email.com  |  +92-300-1234567\\n"
    ...                   "5 years of Python, Django, REST APIs")
    'john doe john email com years of python django rest apis'
    """
    return clean_text(raw_text)


def preprocess_job(description: str, required_skills: list[str]) -> str:
    """
    Combine and clean a job posting for TF-IDF vectorisation.

    Job postings have two distinct text sources:
      - description: free-form prose about the role
      - required_skills: a structured list of skill tags

    We merge them into one string (with skills repeated for mild emphasis)
    and then apply the same cleaning pipeline as resumes so both vectors
    live in the same token space.

    Parameters
    ----------
    description : str
        Full job description text from the Job document.
    required_skills : list[str]
        List of required skill strings from job.requiredSkills (or job.skills
        for legacy documents).

    Returns
    -------
    str
        Single cleaned string representing the job, ready for vectorisation.

    Example
    -------
    >>> preprocess_job("Build scalable REST APIs using Python.",
    ...                ["Python", "FastAPI", "Docker"])
    'build scalable rest apis using python python fastapi fastapi docker docker'
    """
    combined = combine_job_text(description, required_skills)
    return clean_text(combined)
