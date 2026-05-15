"""
services/preprocessing.py
--------------------------
Text preprocessing pipeline for the CareerConnect AI service.

This module sits between raw MongoDB data and the matching engine.
Its only job is to transform messy, real-world text into clean strings
suitable for both semantic embedding and TF-IDF vectorisation.

All cleaning logic lives in utils/text_utils.py — this module just
orchestrates the pipeline and adds domain-specific context.  The updated
clean_text() preserves technical terms like C++, Node.js, .NET, and C#
so they survive vectorisation intact.
"""

from utils.text_utils import clean_text, combine_job_text


def preprocess_resume(raw_text: str) -> str:
    """
    Clean and normalise resume text for the matching engine.

    Resumes contain noise: dates, phone numbers, addresses, formatting
    artefacts from PDF extraction, and inconsistent casing.  We strip
    irrelevant characters while preserving technical terms (C++, Node.js,
    .NET, C#) so the vectoriser and sentence model see meaningful tokens.

    Parameters
    ----------
    raw_text : str
        Raw resume text from applicantProfile.resume.rawText or extracted
        directly from a PDF via pdfplumber.

    Returns
    -------
    str
        Cleaned string ready for get_semantic_similarity() or
        calculate_cosine_similarity().
    """
    return clean_text(raw_text)


def preprocess_job(description: str, required_skills: list[str]) -> str:
    """
    Combine and clean a job posting for the matching engine.

    Job postings have two distinct text sources:
      - description: free-form prose about the role
      - required_skills: a structured list of skill tags

    We merge them into one string (with skills repeated for mild emphasis)
    and apply the same cleaning pipeline as resumes so both texts live in
    the same token space when compared by the semantic model.

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
        Single cleaned string representing the job.
    """
    combined = combine_job_text(description, required_skills)
    return clean_text(combined)
