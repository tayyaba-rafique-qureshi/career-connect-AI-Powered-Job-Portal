"""
tests/test_similarity.py
-------------------------
Unit tests for the skill gap analysis merge logic.

Tests cover:
  - calculate_skill_match with source tagging
  - get_combined_applicant_skills_with_sources
  - Edge cases: no resume, no onboarding skills, both empty
  - Case-insensitive deduplication
  - "both" source tagging when skill appears in both sources
"""

import pytest
from services.skill_extractor import (
    calculate_skill_match,
    normalize_skills_list,
    get_combined_applicant_skills,
    get_combined_applicant_skills_with_sources,
)


# ── calculate_skill_match ─────────────────────────────────────────────────────

class TestCalculateSkillMatch:
    def test_basic_match_with_sources(self):
        applicant = ["Python", "Django", "Docker"]
        job       = ["Python", "Django", "PostgreSQL"]
        sources   = {"python": "onboarding", "django": "resume", "docker": "both"}

        result = calculate_skill_match(applicant, job, sources)

        assert result["matchScore"] == pytest.approx(66.67, abs=0.1)
        assert result["matchCount"] == 2
        assert result["totalRequired"] == 3

        matched_map = {m["skill"].lower(): m["source"] for m in result["matchedSkills"]}
        assert matched_map["python"] == "onboarding"
        assert matched_map["django"] == "resume"
        assert "postgresql" not in matched_map

        assert "PostgreSQL" in result["missingSkills"]

    def test_no_sources_defaults_to_onboarding(self):
        applicant = ["React", "Node.js"]
        job       = ["React", "Node.js", "TypeScript"]

        result = calculate_skill_match(applicant, job)

        for m in result["matchedSkills"]:
            assert m["source"] == "onboarding"

    def test_case_insensitive_matching(self):
        applicant = ["python", "DJANGO"]
        job       = ["Python", "Django", "Redis"]
        sources   = {"python": "resume", "django": "onboarding"}

        result = calculate_skill_match(applicant, job, sources)

        assert result["matchCount"] == 2
        matched_names = [m["skill"] for m in result["matchedSkills"]]
        # Original casing from job_skills is preserved
        assert "Python" in matched_names
        assert "Django" in matched_names

    def test_empty_applicant_skills(self):
        result = calculate_skill_match([], ["React", "Node.js"])
        assert result["matchScore"] == 0.0
        assert result["matchCount"] == 0
        assert result["matchedSkills"] == []
        assert set(result["missingSkills"]) == {"React", "Node.js"}

    def test_empty_job_skills(self):
        result = calculate_skill_match(["Python", "Django"], [])
        assert result["matchScore"] == 0.0
        assert result["matchCount"] == 0
        assert result["matchedSkills"] == []

    def test_perfect_match(self):
        skills = ["Python", "Django", "PostgreSQL"]
        result = calculate_skill_match(skills, skills)
        assert result["matchScore"] == 100.0
        assert result["matchCount"] == 3
        assert result["missingSkills"] == []

    def test_no_match(self):
        result = calculate_skill_match(["Python"], ["Java", "Spring Boot"])
        assert result["matchScore"] == 0.0
        assert result["matchCount"] == 0
        assert len(result["missingSkills"]) == 2

    def test_matched_skills_are_dicts(self):
        result = calculate_skill_match(["Python"], ["Python"])
        assert isinstance(result["matchedSkills"], list)
        assert len(result["matchedSkills"]) == 1
        entry = result["matchedSkills"][0]
        assert isinstance(entry, dict)
        assert "skill" in entry
        assert "source" in entry

    def test_missing_skills_are_strings(self):
        result = calculate_skill_match([], ["Docker", "AWS"])
        assert all(isinstance(s, str) for s in result["missingSkills"])


# ── get_combined_applicant_skills_with_sources ────────────────────────────────

class TestGetCombinedApplicantSkillsWithSources:
    def _make_applicant(self, skills=None, tools=None, resume_text=""):
        return {
            "applicantProfile": {
                "skills": skills or [],
                "tools":  tools  or [],
                "resume": {"rawText": resume_text},
            }
        }

    def test_onboarding_only(self):
        applicant = self._make_applicant(skills=["Python", "Django"])
        combined, sources = get_combined_applicant_skills_with_sources(applicant)

        assert "Python" in combined
        assert "Django" in combined
        assert sources["python"] == "onboarding"
        assert sources["django"] == "onboarding"

    def test_tools_tagged_as_onboarding(self):
        applicant = self._make_applicant(tools=["Git", "Postman"])
        combined, sources = get_combined_applicant_skills_with_sources(applicant)

        assert "Git" in combined
        assert sources["git"] == "onboarding"

    def test_empty_applicant_returns_empty(self):
        applicant = self._make_applicant()
        combined, sources = get_combined_applicant_skills_with_sources(applicant)
        assert combined == []
        assert sources == {}

    def test_no_resume_falls_back_to_onboarding(self):
        applicant = self._make_applicant(skills=["React", "TypeScript"])
        combined, sources = get_combined_applicant_skills_with_sources(applicant)

        assert "React" in combined
        assert "TypeScript" in combined
        assert sources.get("react") == "onboarding"
        assert sources.get("typescript") == "onboarding"

    def test_deduplication_case_insensitive(self):
        applicant = self._make_applicant(
            skills=["Python"],
            tools=["python"],   # duplicate, different case
        )
        combined, sources = get_combined_applicant_skills_with_sources(applicant)

        # Should appear only once
        lower_combined = [s.lower() for s in combined]
        assert lower_combined.count("python") == 1

    def test_structured_skill_dict_format(self):
        applicant = self._make_applicant(
            skills=[{"name": "Python", "level": "Expert"}, {"name": "Django"}]
        )
        combined, sources = get_combined_applicant_skills_with_sources(applicant)

        assert "Python" in combined
        assert "Django" in combined

    def test_missing_applicant_profile_no_crash(self):
        applicant = {}
        combined, sources = get_combined_applicant_skills_with_sources(applicant)
        assert combined == []
        assert sources == {}


# ── Integration: full gap analysis with merged skills ────────────────────────

class TestGapAnalysisIntegration:
    """
    End-to-end tests that verify a skill present in EITHER source is
    counted as matched, and only absent-from-both skills are missing.
    """

    def test_skill_in_onboarding_only_is_matched(self):
        applicant_skills = ["Python", "Django"]
        job_skills       = ["Python", "Docker"]
        sources          = {"python": "onboarding", "django": "onboarding"}

        result = calculate_skill_match(applicant_skills, job_skills, sources)

        matched_names = [m["skill"] for m in result["matchedSkills"]]
        assert "Python" in matched_names
        assert "Docker" in result["missingSkills"]

    def test_skill_in_resume_only_is_matched(self):
        applicant_skills = ["React", "Node.js"]
        job_skills       = ["React", "AWS"]
        sources          = {"react": "resume", "node.js": "resume"}

        result = calculate_skill_match(applicant_skills, job_skills, sources)

        matched_names = [m["skill"] for m in result["matchedSkills"]]
        assert "React" in matched_names
        source_of_react = next(m["source"] for m in result["matchedSkills"] if m["skill"] == "React")
        assert source_of_react == "resume"

    def test_skill_in_both_sources_tagged_both(self):
        applicant_skills = ["TypeScript"]
        job_skills       = ["TypeScript"]
        sources          = {"typescript": "both"}

        result = calculate_skill_match(applicant_skills, job_skills, sources)

        assert result["matchCount"] == 1
        assert result["matchedSkills"][0]["source"] == "both"

    def test_skill_absent_from_both_is_missing(self):
        applicant_skills = ["Python"]
        job_skills       = ["Python", "Kubernetes", "Terraform"]
        sources          = {"python": "onboarding"}

        result = calculate_skill_match(applicant_skills, job_skills, sources)

        assert "Kubernetes" in result["missingSkills"]
        assert "Terraform" in result["missingSkills"]
        assert result["matchCount"] == 1

    def test_no_regression_onboarding_only_flow(self):
        """Existing onboarding-only flow must still work when no resume skills exist."""
        applicant_skills = ["JavaScript", "React", "CSS"]
        job_skills       = ["JavaScript", "React", "TypeScript"]
        # No sources provided — defaults to "onboarding"
        result = calculate_skill_match(applicant_skills, job_skills)

        assert result["matchCount"] == 2
        assert "TypeScript" in result["missingSkills"]
        for m in result["matchedSkills"]:
            assert m["source"] == "onboarding"
