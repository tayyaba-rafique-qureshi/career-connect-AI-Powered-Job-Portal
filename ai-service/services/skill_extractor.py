"""
services/skill_extractor.py
----------------------------
Skill extraction and comparison utilities for the CareerConnect AI service.

Three public functions:

  extract_skills_from_text(text)
      Regex word-boundary scan of free-form text against the full skill
      dictionary.  Returns a deduplicated list preserving original casing
      from the dictionary (not from the text).

  normalize_skills_list(skills)
      Accepts a mixed list of strings and/or {"name": ..., "level": ...}
      dicts (the format MongoDB stores applicant skills in) and returns a
      flat list of plain name strings.

  calculate_skill_match(applicant_skills, job_skills)
      Case-insensitive three-way comparison: matched, missing, extra.
      Returns a dict with counts and a 0–100 match score.

No database calls, no HTTP concerns — pure Python logic only.
"""

import re
from utils.skill_keywords import ALL_SKILLS


# ── Pattern cache ─────────────────────────────────────────────────────────────
# Build one compiled regex per skill at import time so repeated calls to
# extract_skills_from_text() don't recompile patterns on every invocation.
#
# Design decisions:
#   - re.IGNORECASE so "python", "Python", "PYTHON" all match.
#   - \b word boundaries on both sides so "R" does not match inside "React",
#     "Redux", "Laravel", etc.
#   - Skills that contain regex metacharacters (C++, C#, .NET, Next.js …)
#     are escaped with re.escape() before wrapping in \b … \b.
#   - "React Native" is a two-word skill — \b still works correctly at the
#     start and end of the phrase; the space in the middle is literal.

_SKILL_PATTERNS: list[tuple[str, re.Pattern]] = []

for _skill in ALL_SKILLS:
    _escaped = re.escape(_skill)
    # \b does not anchor correctly after non-word chars like '+' or '#',
    # so for skills ending in a non-word character we use a lookahead/
    # lookbehind that asserts a word boundary on the *alphabetic* part.
    # For normal skills \b works fine on both sides.
    _pattern = re.compile(
        r"(?<![A-Za-z0-9])" + _escaped + r"(?![A-Za-z0-9])",
        re.IGNORECASE,
    )
    _SKILL_PATTERNS.append((_skill, _pattern))


# ── Public functions ──────────────────────────────────────────────────────────

def extract_skills_from_text(text: str) -> list[str]:
    """
    Scan free-form text and return every skill from ALL_SKILLS that appears
    in it, using word-boundary matching to avoid false positives.

    Rules enforced
    --------------
    - "R" does NOT match inside "React", "Redux", "Laravel", "Oracle", etc.
      because the pattern requires a non-alphanumeric character (or start/end
      of string) on both sides.
    - "React" and "React Native" are treated as separate skills.  If the text
      contains "React Native", both "React" and "React Native" will match
      (since "React" appears as a substring).  This is intentional — the
      caller can deduplicate or prefer the longer match if needed.
    - Matching is case-insensitive; returned names use the canonical casing
      from ALL_SKILLS (e.g. "Python", not "python" or "PYTHON").

    Parameters
    ----------
    text : str
        Any free-form text: resume body, job description, cover letter, etc.

    Returns
    -------
    list[str]
        Deduplicated list of matched skill names in ALL_SKILLS canonical
        casing, in the order they first appear in ALL_SKILLS.
    """
    if not text:
        return []

    found: list[str] = []
    seen: set[str] = set()  # lowercase keys for deduplication

    for canonical_name, pattern in _SKILL_PATTERNS:
        key = canonical_name.lower()
        if key not in seen and pattern.search(text):
            found.append(canonical_name)
            seen.add(key)

    return found


def normalize_skills_list(skills: list) -> list[str]:
    """
    Normalise a mixed skill list into a flat list of plain name strings.

    MongoDB stores applicant skills in two formats depending on how they
    were entered:
      - Plain strings:  ["Python", "Django"]
      - Structured dicts: [{"name": "Python", "level": "Expert"}, …]

    This function handles both formats (and any mixture of them) and
    always returns a flat list of stripped, non-empty name strings.

    Parameters
    ----------
    skills : list
        Input list — may contain strings, dicts with a "name" key, or
        None values (which are silently dropped).

    Returns
    -------
    list[str]
        Flat list of skill name strings.  Empty strings and None values
        are excluded.  Order is preserved.

    Examples
    --------
    >>> normalize_skills_list(["Python", {"name": "Django", "level": "Expert"}, None])
    ['Python', 'Django']
    >>> normalize_skills_list([])
    []
    """
    result: list[str] = []
    for item in skills:
        if item is None:
            continue
        if isinstance(item, dict):
            name = item.get("name", "")
        elif isinstance(item, str):
            name = item
        else:
            # Unexpected type — convert to string as a best-effort fallback
            name = str(item)
        name = name.strip()
        if name:
            result.append(name)
    return result


def calculate_skill_match(
    applicant_skills: list[str],
    job_skills: list[str],
    skill_sources: dict[str, str] | None = None,
) -> dict:
    """
    Perform a three-way case-insensitive comparison between the skills an
    applicant has and the skills a job requires.

    Categories
    ----------
    matchedSkills : skills the applicant has that the job requires.
                    Each entry is a dict: {"skill": str, "source": str}
                    where source is "onboarding", "resume", or "both".
    missingSkills : skills the job requires that the applicant lacks (list[str]).
    extraSkills   : skills the applicant has that the job does NOT require (list[str]).

    Score formula
    -------------
    matchScore = (len(matchedSkills) / len(job_skills)) × 100

    If job_skills is empty the score is 0.0 (no requirements → no signal).

    Parameters
    ----------
    applicant_skills : list[str]
        Flat list of skill name strings from the applicant's profile
        (already normalised via normalize_skills_list if needed).
    job_skills : list[str]
        Flat list of required skill name strings from the job document.
    skill_sources : dict[str, str] | None
        Optional mapping of lowercase skill name → source label
        ("onboarding", "resume", or "both").  When provided, each matched
        skill entry will include a "source" field.  When absent, source
        defaults to "onboarding" for backward compatibility.

    Returns
    -------
    dict with keys:
        matchedSkills : list[dict]  — [{"skill": str, "source": str}, ...]
        missingSkills : list[str]   — original casing from job_skills
        extraSkills   : list[str]   — original casing from applicant_skills
        matchScore    : float       — 0.0–100.0
        matchCount    : int         — len(matchedSkills)
        totalRequired : int         — len(job_skills)

    Examples
    --------
    >>> calculate_skill_match(
    ...     ["Python", "Django", "Docker"],
    ...     ["Python", "Django", "PostgreSQL", "Redis"],
    ...     {"python": "onboarding", "django": "resume", "docker": "both"},
    ... )
    {
        'matchedSkills': [
            {"skill": "Python", "source": "onboarding"},
            {"skill": "Django", "source": "resume"},
        ],
        'missingSkills': ['PostgreSQL', 'Redis'],
        'extraSkills':   ['Docker'],
        'matchScore':    50.0,
        'matchCount':    2,
        'totalRequired': 4,
    }
    """
    # Build lowercase lookup sets for O(1) membership tests
    applicant_lower: dict[str, str] = {
        s.strip().lower(): s for s in applicant_skills if s and s.strip()
    }
    job_lower: dict[str, str] = {
        s.strip().lower(): s for s in job_skills if s and s.strip()
    }

    matched: list[dict] = []
    missing: list[str] = []

    for key, original in job_lower.items():
        if key in applicant_lower:
            source = (skill_sources or {}).get(key, "onboarding")
            matched.append({"skill": original, "source": source})
        else:
            missing.append(original)

    # Extra skills: applicant has them but the job doesn't require them
    extra: list[str] = [
        original
        for key, original in applicant_lower.items()
        if key not in job_lower
    ]

    total_required = len(job_lower)
    match_count    = len(matched)
    score = round((match_count / total_required) * 100, 2) if total_required else 0.0

    return {
        "matchedSkills": matched,
        "missingSkills": missing,
        "extraSkills":   extra,
        "matchScore":    score,
        "matchCount":    match_count,
        "totalRequired": total_required,
    }


def extract_skills_from_text_confident(text: str) -> list[str]:
    """
    Confidence-filtered skill extraction from free-form resume text.

    Two tiers of confidence:

    HIGH-CONFIDENCE skills (cloud_devops, databases, frontend, backend):
        A single mention anywhere in the text is sufficient.  These are
        specific technical terms (Terraform, PostgreSQL, React, Django …)
        that are unlikely to appear in a resume unless the applicant
        actually uses them.

    GENERAL skills (languages, tools, soft_skills, ai_ml, …):
        Requires either 2+ mentions anywhere in the text, OR a single
        mention on a line that contains a skills-context keyword
        ("skills", "technologies", "proficient", etc.).

    This filter is applied only to text-extracted skills.
    Structured onboarding skills and tools are always trusted as-is.

    Parameters
    ----------
    text : str
        Free-form resume text (applicantProfile.resume.rawText).

    Returns
    -------
    list[str]
        Confident skill matches in ALL_SKILLS canonical casing,
        in the order they appear in ALL_SKILLS.
    """
    if not text:
        return []

    from utils.skill_keywords import SKILL_CATEGORIES

    # Build the high-confidence set (lowercase) — single mention is enough
    _high_confidence_skills: set[str] = {
        s.lower()
        for cat in ("cloud_devops", "databases", "frontend", "backend")
        for s in SKILL_CATEGORIES.get(cat, [])
    }

    # Skills-context keywords — a line containing one of these is a skills section
    _SKILLS_CONTEXT_WORDS = {
        "skills", "technologies", "proficient", "experienced",
        "expertise", "tools", "stack", "languages", "frameworks",
        "competencies", "technical", "proficiency", "knowledge", "familiar",
    }

    # Pre-compute which line numbers are skills-context lines
    skills_context_lines: set[int] = set()
    for line_num, line in enumerate(text.splitlines()):
        if any(kw in line.lower() for kw in _SKILLS_CONTEXT_WORDS):
            skills_context_lines.add(line_num)

    confident: list[str] = []
    seen: set[str] = set()

    for canonical_name, pattern in _SKILL_PATTERNS:
        key = canonical_name.lower()
        if key in seen:
            continue

        matches = list(pattern.finditer(text))
        if not matches:
            continue

        # Tier 1 — high-confidence category: single mention is enough
        if key in _high_confidence_skills:
            confident.append(canonical_name)
            seen.add(key)
            continue

        # Tier 2 — general skill: needs 2+ mentions or a skills-context line
        if len(matches) >= 2:
            confident.append(canonical_name)
            seen.add(key)
            continue

        match_line = text[: matches[0].start()].count("\n")
        if match_line in skills_context_lines:
            confident.append(canonical_name)
            seen.add(key)

    return confident


def get_combined_applicant_skills(applicant_data: dict) -> list[str]:
    """
    Build a deduplicated skill list by merging three sources:

      1. Structured skills array from onboarding
         (applicantProfile.skills — may be strings or {name, level} dicts)
      2. Skills extracted from resume rawText via keyword scanning
         (catches skills the applicant mentioned in prose but didn't add
          to their structured profile during onboarding)
      3. Tools listed in the applicant profile
         (applicantProfile.tools — often contain technical skill names
          like "Git", "Docker", "Postman" that overlap with job requirements)

    Sources are merged in priority order: structured skills first, then
    text-extracted skills, then tools.  Deduplication is case-insensitive
    so "Python" and "python" are treated as the same skill.

    Parameters
    ----------
    applicant_data : dict
        Full applicant MongoDB document.  Expected fields:
          applicantProfile.skills          — list of str or {name, level} dicts
          applicantProfile.resume.rawText  — str (may be empty or absent)
          applicantProfile.tools           — list of str

    Returns
    -------
    list[str]
        Deduplicated merged skill list.  Preserves original casing from
        the first source that introduced each skill.

    Example
    -------
    Onboarding skills : ["Python", "Django"]
    Resume text finds : ["Flask", "SQL", "Git", "REST APIs", "Python"]  ← Python already seen
    Tools             : ["Git", "Postman"]                               ← Git already seen
    Combined result   : ["Python", "Django", "Flask", "SQL", "Git", "REST APIs", "Postman"]
    """
    profile = applicant_data.get("applicantProfile") or {}

    # ── Source 1: structured skills from onboarding ───────────────────────────
    structured_skills: list[str] = normalize_skills_list(profile.get("skills") or [])

    # ── Source 2: skills extracted from resume rawText ────────────────────────
    # Use the confidence-filtered variant so only skills that appear 2+ times
    # or appear in a skills-context line are included.  This prevents skills
    # mentioned briefly in unrelated context (e.g. "familiar with Docker")
    # from inflating the match score.
    # Structured onboarding skills and tools are always trusted as-is.
    resume_text: str = (profile.get("resume") or {}).get("rawText") or ""
    text_skills: list[str] = extract_skills_from_text_confident(resume_text) if resume_text.strip() else []

    # ── Source 3: tools listed in profile ────────────────────────────────────
    raw_tools = profile.get("tools") or []
    tools: list[str] = []
    for t in raw_tools:
        if isinstance(t, str):
            name = t.strip()
        elif isinstance(t, dict):
            name = t.get("name", "").strip()
        else:
            name = ""
        if name:
            tools.append(name)

    # ── Merge, deduplicating case-insensitively ───────────────────────────────
    seen: set[str] = set()
    combined: list[str] = []
    for skill in structured_skills + text_skills + tools:
        if skill and skill.lower() not in seen:
            seen.add(skill.lower())
            combined.append(skill)

    print(
        f"[skill_extractor] structured={len(structured_skills)} "
        f"text={len(text_skills)} tools={len(tools)} combined={len(combined)}"
    )
    return combined


def get_combined_applicant_skills_with_sources(applicant_data: dict) -> tuple[list[str], dict[str, str]]:
    """
    Same as get_combined_applicant_skills() but also returns a source map.

    The source map records where each skill came from so the gap analysis
    can tag matched skills with "onboarding", "resume", or "both".

    Source priority / tagging rules
    --------------------------------
    - A skill that appears in BOTH structured onboarding AND resume text
      is tagged "both".
    - A skill that appears only in structured onboarding (or tools) is
      tagged "onboarding".
    - A skill that appears only in resume text extraction is tagged "resume".

    Tools are treated as "onboarding" because they come from the structured
    profile the applicant filled in during onboarding.

    Parameters
    ----------
    applicant_data : dict
        Full applicant MongoDB document.

    Returns
    -------
    tuple[list[str], dict[str, str]]
        combined_skills : deduplicated merged skill list (same as
                          get_combined_applicant_skills())
        source_map      : {lowercase_skill_name: "onboarding"|"resume"|"both"}
    """
    profile = applicant_data.get("applicantProfile") or {}

    # ── Source 1: structured skills from onboarding ───────────────────────────
    structured_skills: list[str] = normalize_skills_list(profile.get("skills") or [])

    # ── Source 2: skills extracted from resume rawText ────────────────────────
    resume_text: str = (profile.get("resume") or {}).get("rawText") or ""
    text_skills: list[str] = extract_skills_from_text_confident(resume_text) if resume_text.strip() else []

    # ── Source 3: tools listed in profile (treated as "onboarding") ──────────
    raw_tools = profile.get("tools") or []
    tools: list[str] = []
    for t in raw_tools:
        if isinstance(t, str):
            name = t.strip()
        elif isinstance(t, dict):
            name = t.get("name", "").strip()
        else:
            name = ""
        if name:
            tools.append(name)

    # Build lowercase sets for source tagging
    onboarding_lower: set[str] = {s.lower() for s in structured_skills + tools if s}
    resume_lower: set[str]     = {s.lower() for s in text_skills if s}

    # ── Merge, deduplicating case-insensitively ───────────────────────────────
    seen: set[str] = set()
    combined: list[str] = []
    source_map: dict[str, str] = {}

    for skill in structured_skills + text_skills + tools:
        if not skill:
            continue
        key = skill.lower()
        if key not in seen:
            seen.add(key)
            combined.append(skill)

        # Tag source (may be updated to "both" on second encounter)
        in_onboarding = key in onboarding_lower
        in_resume     = key in resume_lower
        if in_onboarding and in_resume:
            source_map[key] = "both"
        elif in_resume:
            source_map[key] = "resume"
        else:
            source_map[key] = "onboarding"

    print(
        f"[skill_extractor] structured={len(structured_skills)} "
        f"text={len(text_skills)} tools={len(tools)} combined={len(combined)}"
    )
    return combined, source_map


def extract_experience_from_text(text: str) -> float | None:
    """
    Try to extract years of experience from free-form resume text.

    Scans for common English patterns that state a number of years, e.g.:
      - "3 years of experience"
      - "5+ years of professional experience"
      - "2-3 years of experience"
      - "over 4 years"
      - "7 years experience"
      - "10+ years"

    When a range is found (e.g. "2-3 years") the midpoint is returned.

    Parameters
    ----------
    text : str
        Raw or lightly cleaned resume text.

    Returns
    -------
    float | None
        Extracted years as a float, or None if no pattern matched.
    """
    if not text:
        return None

    text_lower = text.lower()

    patterns = [
        # "over 6 years of experience" / "over 4 years of experience"
        r"over\s+(\d+)\s+years?\s+of\s+(?:professional\s*)?experience",
        # "3+ years of experience" / "5+ years of experience"
        r"(\d+)\+\s*years?\s+of\s+(?:professional\s*)?experience",
        # "more than 6 years" / "more than 3 years of experience"
        r"more\s+than\s+(\d+)\s+years?",
        # "3 years of professional experience" / "5+ years of experience"
        r"(\d+)\+?\s*years?\s*of\s*(?:professional\s*)?experience",
        # "2-3 years of experience"
        r"(\d+)\s*-\s*(\d+)\s*years?\s*of\s*experience",
        # "over 4 years" (without "of experience")
        r"over\s*(\d+)\s*years?",
        # "7 years experience"
        r"(\d+)\s*years?\s*experience",
        # "10+ years"
        r"(\d+)\+\s*years?",
    ]

    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            nums = [float(x) for x in match.groups() if x is not None]
            if nums:
                return sum(nums) / len(nums)  # midpoint if range

    return None


def extract_seniority_from_text(text: str) -> str | None:
    """
    Detect seniority level from resume text based on keyword signals.

    Checks for explicit title/level keywords in order from most senior
    to most junior so that "Senior Lead Developer" correctly maps to
    'lead' rather than 'senior'.

    Parameters
    ----------
    text : str
        Raw or lightly cleaned resume text.

    Returns
    -------
    str | None
        One of 'entry', 'mid', 'senior', 'lead', or None if no signal found.
    """
    if not text:
        return None

    text_lower = text.lower()

    lead_signals = [
        "tech lead", "team lead", "engineering manager",
        "principal engineer", "head of engineering",
        "vp of", "director of",
    ]
    senior_signals = [
        "senior", "sr.", "lead developer", "architect",
        "7 years", "8 years", "9 years", "10 years",
    ]
    mid_signals = [
        "mid-level", "intermediate",
        "3 years", "4 years", "5 years",
    ]
    entry_signals = [
        "junior", "jr.", "entry level", "fresher",
        "graduate", "intern", "trainee",
        "no experience", "recent graduate",
    ]

    for signal in lead_signals:
        if signal in text_lower:
            return "lead"
    for signal in senior_signals:
        if signal in text_lower:
            return "senior"
    for signal in mid_signals:
        if signal in text_lower:
            return "mid"
    for signal in entry_signals:
        if signal in text_lower:
            return "entry"

    return None


# ── ATS keyword matching ──────────────────────────────────────────────────────

_ATS_STOPWORDS: frozenset[str] = frozenset({
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
    "for", "of", "with", "by", "from", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "shall",
    "this", "that", "these", "those", "i", "you", "he", "she", "we",
    "they", "what", "which", "who", "when", "where", "why", "how",
    "all", "each", "every", "both", "few", "more", "most", "other",
    "into", "through", "during", "before", "after", "above", "below",
    "our", "your", "their", "its", "as", "up", "if", "about", "work",
    "using", "use", "used", "ensure", "strong", "good", "experience",
    "including", "such", "not", "also", "can", "any", "provide",
})


def extract_ats_keywords(text: str) -> list[str]:
    """
    Extract important keywords from text the way an ATS system does.

    Tokenises the text, removes common stopwords, and returns unique
    keywords preserving original casing.  Hyphenated terms, dot-separated
    names (Node.js), and slash-separated terms (CI/CD) are kept intact.

    Parameters
    ----------
    text : str
        Any free-form text — job description, resume body, etc.

    Returns
    -------
    list[str]
        Unique keywords with original casing, stopwords removed,
        minimum length 2 characters.
    """
    if not text:
        return []

    # Keep hyphenated terms, dot-separated names, slash-separated terms,
    # and terms with + or # (C++, C#)
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9]*(?:[.\-/+#][a-zA-Z0-9]+)*", text)

    seen: set[str] = set()
    result: list[str] = []
    for w in words:
        if w.lower() not in _ATS_STOPWORDS and len(w) >= 2 and w.lower() not in seen:
            seen.add(w.lower())
            result.append(w)

    return result


def calculate_ats_score(
    resume_text: str,
    job_description: str,
    job_skills: list[str],
) -> dict:
    """
    Weighted ATS keyword matching score.

    Keywords are scored in two tiers:
      - Required skills (job_skills)  — weight 70%
        These are the most important signals; a skill listed in
        requiredSkills that appears in the resume is a strong match.
      - Job description keywords       — weight 30%
        General keywords extracted from the job description prose,
        excluding any already counted as required skills.

    This weighting means a candidate who covers all required skills
    scores ~70 even with zero description-keyword overlap, and can
    reach 100 by also matching the description vocabulary.

    Parameters
    ----------
    resume_text     : str       — applicant's resume rawText
    job_description : str       — job description prose
    job_skills      : list[str] — job.requiredSkills (highest priority)

    Returns
    -------
    dict with keys:
        atsScore        : float      — 0–100 weighted score
        keywordsMatched : list[str]  — skills + description keywords found
        keywordsMissing : list[str]  — required skills NOT found in resume
        totalKeywords   : int        — total keyword pool size
    """
    if not resume_text:
        return {
            "atsScore":        0.0,
            "keywordsMatched": [],
            "keywordsMissing": [],
            "totalKeywords":   0,
        }

    resume_lower = resume_text.lower()

    # ── Tier 1: required skills (weight 70%) ─────────────────────────────────
    skill_matches = [s for s in job_skills if s.lower() in resume_lower]
    skill_missing = [s for s in job_skills if s.lower() not in resume_lower]
    skill_score   = len(skill_matches) / max(len(job_skills), 1)

    # ── Tier 2: job description keywords (weight 30%) ─────────────────────────
    # Exclude keywords already covered by the required skills list to avoid
    # double-counting the same term in both tiers.
    job_keywords    = extract_ats_keywords(job_description)
    job_skill_lower = {s.lower() for s in job_skills}
    desc_keywords   = [k for k in job_keywords if k.lower() not in job_skill_lower]
    desc_matches    = [k for k in desc_keywords if k.lower() in resume_lower]
    desc_score      = len(desc_matches) / max(len(desc_keywords), 1)

    # ── Weighted final score ──────────────────────────────────────────────────
    ats_score = round((skill_score * 0.70 + desc_score * 0.30) * 100, 2)

    return {
        "atsScore":        ats_score,
        "keywordsMatched": skill_matches + desc_matches,
        "keywordsMissing": skill_missing,
        "totalKeywords":   len(job_skills) + len(desc_keywords),
    }


def extract_work_experience(text: str) -> list[dict]:
    """
    Extract structured work experience entries from resume text.

    Looks for date ranges in the format MM/YYYY - MM/YYYY (or Present/Current)
    and infers the role and company from the lines immediately preceding each
    date range.

    Parameters
    ----------
    text : str
        Raw resume text.

    Returns
    -------
    list[dict]
        Each entry has: role, company, years, startDate, endDate, current.
        Entries are in the order they appear in the text (most recent first
        if the resume is in reverse-chronological order).
    """
    import re
    from datetime import datetime

    entries: list[dict] = []

    # Date range pattern: MM/YYYY - MM/YYYY  or  MM/YYYY – Present/Current
    date_pattern = r"(\d{2}/\d{4})\s*[-–]\s*(\d{2}/\d{4}|Present|present|Current|current)"
    matches = list(re.finditer(date_pattern, text))

    for match in matches:
        start_str = match.group(1)
        end_str   = match.group(2)

        try:
            start_date = datetime.strptime(start_str, "%m/%Y")
            if end_str.lower() in ("present", "current"):
                end_date = datetime.now()
                current  = True
            else:
                end_date = datetime.strptime(end_str, "%m/%Y")
                current  = False

            years = round((end_date - start_date).days / 365.25, 1)

            # Infer role and company from the lines immediately before the date range
            text_before  = text[max(0, match.start() - 200): match.start()]
            lines_before = [l.strip() for l in text_before.split("\n") if l.strip()]
            role    = lines_before[-1] if lines_before else "Unknown Role"
            company = lines_before[-2] if len(lines_before) >= 2 else None

            entries.append({
                "role":      role,
                "company":   company,
                "years":     years,
                "startDate": start_str,
                "endDate":   end_str,
                "current":   current,
            })
        except Exception:
            continue

    return entries


def get_experience_summary(applicant_data: dict) -> dict:
    """
    Build a complete experience summary combining resume text and onboarding data.

    Resume text is the primary source; onboarding profile is the fallback.
    Returns an ExperienceSummary-compatible dict.

    Parameters
    ----------
    applicant_data : dict
        Full applicant MongoDB document.

    Returns
    -------
    dict with keys: totalYears, seniorityLevel, primaryRole,
                    experienceEntries, source
    """
    profile     = applicant_data.get("applicantProfile") or {}
    pro_info    = profile.get("professionalInfo") or {}
    resume_text = (profile.get("resume") or {}).get("rawText") or ""

    # Primary source — structured entries parsed from resume text
    entries     = extract_work_experience(resume_text) if resume_text else []
    total_years = sum(e["years"] for e in entries if e.get("years"))

    # If no date-range entries found, fall back to numeric extraction
    if total_years == 0:
        total_years = extract_experience_from_text(resume_text) or 0.0

    # Map total years to a seniority level
    if total_years >= 8:
        seniority = "lead"
    elif total_years >= 5:
        seniority = "senior"
    elif total_years >= 2:
        seniority = "mid"
    else:
        seniority = "entry"

    # Primary role: most recent entry from resume, or onboarding currentTitle
    primary_role = entries[0]["role"] if entries else pro_info.get("currentTitle")

    source = "resume_text" if (entries or total_years > 0) else "onboarding"

    return {
        "totalYears":        round(total_years, 1),
        "seniorityLevel":    seniority,
        "primaryRole":       primary_role,
        "experienceEntries": entries,
        "source":            source,
    }
