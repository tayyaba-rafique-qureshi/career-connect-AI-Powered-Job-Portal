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
    Normalise a raw text string for TF-IDF vectorisation while preserving
    technical terms that carry semantic meaning.

    Steps applied in order:
      1. Lowercase everything so 'Python' and 'python' are the same token.
      2. Protect technical terms before any stripping:
           C++  → cpp_placeholder
           C#   → csharp_placeholder
           .NET → dotnet_placeholder
           Node.js / node.js → nodejs_placeholder
         (dots and symbols in these terms would otherwise be stripped)
      3. Remove standalone digits and phone-number patterns — years and
         numbers add noise, but we keep digits that are part of words
         (e.g. "python3", "es6") by only removing isolated digit tokens.
      4. Remove punctuation EXCEPT dots, plus signs, and hash symbols so
         that any remaining technical terms not caught by step 2 survive.
         Specifically removed: all of string.punctuation minus . + #
      5. Restore placeholders back to their canonical lowercase forms.
      6. Collapse multiple whitespace characters into a single space.
      7. Strip leading/trailing whitespace.

    Parameters
    ----------
    text : str
        Raw input string (resume snippet, job description, skill list, …).

    Returns
    -------
    str
        Cleaned, normalised string ready for vectorisation.

    Examples
    --------
    >>> clean_text("Expert in C++, Node.js, and .NET")
    'expert in c++ nodejs and .net'
    >>> clean_text("C# developer with 5 years experience")
    'c# developer with years experience'
    """
    if not text:
        return ""

    # 1. Lowercase
    text = text.lower()

    # 2. Protect technical terms with placeholders
    #    Order matters: longer/more-specific patterns first
    tech_replacements = [
        (r"\bc\+\+",    "__CPP__"),
        (r"\bc#",       "__CSHARP__"),
        (r"\.net\b",    "__DOTNET__"),
        (r"\bnode\.js", "__NODEJS__"),
        (r"\bvue\.js",  "__VUEJS__"),
        (r"\breact\.js","__REACTJS__"),
        (r"\bexpress\.js","__EXPRESSJS__"),
        (r"\bnext\.js", "__NEXTJS__"),
        (r"\bnuxt\.js", "__NUXTJS__"),
    ]
    for pattern, placeholder in tech_replacements:
        text = re.sub(pattern, placeholder, text, flags=re.IGNORECASE)

    # 3. Remove isolated digit tokens (standalone numbers like years, phone
    #    fragments) but keep alphanumeric tokens like "python3" or "es6"
    text = re.sub(r"\b\d+\b", " ", text)

    # 4. Remove punctuation except . + # _ (preserved for technical terms and
    #    placeholders like __CPP__, __CSHARP__, __DOTNET__ which use underscores)
    safe_chars = set(".+#_")
    strip_chars = "".join(c for c in string.punctuation if c not in safe_chars)
    text = text.translate(str.maketrans(strip_chars, " " * len(strip_chars)))

    # 5. Restore placeholders to canonical forms
    restorations = [
        ("__CPP__",       "c++"),
        ("__CSHARP__",    "c#"),
        ("__DOTNET__",    ".net"),
        ("__NODEJS__",    "nodejs"),
        ("__VUEJS__",     "vuejs"),
        ("__REACTJS__",   "reactjs"),
        ("__EXPRESSJS__", "expressjs"),
        ("__NEXTJS__",    "nextjs"),
        ("__NUXTJS__",    "nuxtjs"),
    ]
    for placeholder, canonical in restorations:
        text = text.replace(placeholder, canonical)

    # 6. Collapse whitespace
    text = re.sub(r"\s+", " ", text)

    # 7. Strip edges
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


def normalize_skill(skill: str) -> str:
    """
    Lowercase and strip a skill name for consistent comparison.

    Does NOT apply full clean_text processing — punctuation like + and #
    is intentionally preserved so "C++" and "C#" remain distinct tokens.

    Parameters
    ----------
    skill : str
        Raw skill string, e.g. "  Node.JS ", "C++", "REST APIs".

    Returns
    -------
    str
        Lowercased, whitespace-stripped skill name.

    Examples
    --------
    >>> normalize_skill("  Node.JS ")
    'node.js'
    >>> normalize_skill("C++")
    'c++'
    >>> normalize_skill("REST APIs")
    'rest apis'
    """
    return skill.strip().lower()


# ── Section keyword maps ──────────────────────────────────────────────────────
# Each section maps to a list of header keywords that commonly introduce it
# in resumes.  Matching is case-insensitive and checks for whole-line headers.

_SECTION_KEYWORDS: dict[str, list[str]] = {
    "skills": [
        "skills", "technical skills", "core competencies", "competencies",
        "technologies", "tech stack", "tools", "programming languages",
        "languages & frameworks", "key skills",
    ],
    "experience": [
        "experience", "work experience", "professional experience",
        "employment history", "work history", "career history",
        "positions held", "relevant experience",
    ],
    "education": [
        "education", "academic background", "academic qualifications",
        "qualifications", "degrees", "educational background",
    ],
    "certifications": [
        "certifications", "certificates", "professional certifications",
        "licenses", "accreditations", "courses", "training",
    ],
    "summary": [
        "summary", "professional summary", "profile", "objective",
        "career objective", "about me", "overview",
    ],
    "projects": [
        "projects", "personal projects", "key projects", "portfolio",
        "open source", "side projects",
    ],
}


def extract_sections(text: str) -> dict[str, str]:
    """
    Detect and extract named sections from resume text by matching common
    section header keywords.

    The function splits the text into lines and looks for lines that
    consist almost entirely of a known section keyword (allowing for
    trailing punctuation like colons and dashes).  Everything between
    two consecutive section headers is assigned to the first header's
    section.  Text before the first recognised header is stored under
    the key "header".

    Parameters
    ----------
    text : str
        Raw resume text, typically the output of pdfplumber extraction.

    Returns
    -------
    dict[str, str]
        Mapping of section name → section text content.
        Possible keys: "header", "skills", "experience", "education",
        "certifications", "summary", "projects", plus any unrecognised
        content stored under "header".
        Sections with no content are omitted from the result.

    Examples
    --------
    >>> result = extract_sections("John Doe\\nSkills\\nPython, Django\\nExperience\\nDev at Acme")
    >>> "skills" in result
    True
    >>> "python" in result["skills"].lower()
    True
    """
    if not text:
        return {}

    lines = text.splitlines()

    # Build a flat lookup: normalised keyword → canonical section name
    keyword_to_section: dict[str, str] = {}
    for section, keywords in _SECTION_KEYWORDS.items():
        for kw in keywords:
            keyword_to_section[kw.lower()] = section

    def _classify_line(line: str) -> str | None:
        """Return the section name if this line is a section header, else None."""
        # Strip trailing punctuation and whitespace that often follows headers
        stripped = line.strip().rstrip(":–—-").strip().lower()
        if not stripped:
            return None
        # Exact match first
        if stripped in keyword_to_section:
            return keyword_to_section[stripped]
        # Allow headers with extra words like "Technical Skills & Tools"
        for kw, section in keyword_to_section.items():
            if stripped == kw or stripped.startswith(kw + " ") or stripped.endswith(" " + kw):
                return section
        return None

    sections: dict[str, list[str]] = {}
    current_section = "header"
    sections[current_section] = []

    for line in lines:
        detected = _classify_line(line)
        if detected:
            current_section = detected
            if current_section not in sections:
                sections[current_section] = []
            # Don't include the header line itself in the content
        else:
            sections[current_section].append(line)

    # Join lines and drop empty sections
    return {
        section: "\n".join(content_lines).strip()
        for section, content_lines in sections.items()
        if "\n".join(content_lines).strip()
    }
