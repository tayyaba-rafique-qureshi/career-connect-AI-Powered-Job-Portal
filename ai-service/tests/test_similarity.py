"""
Unit tests for the CareerConnect hybrid matching engine.

Covers:
  - Preprocessing pipeline
  - Semantic similarity (get_semantic_similarity)
  - Four-component matching engine (calculate_match_score)
  - Job graph construction
  - A* search

All tests run without MongoDB — pure Python logic only.
The sentence-transformer model may not be available in lightweight CI
environments; tests that depend on it assert on ranges rather than exact
values and tolerate TF-IDF fallback.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.preprocessing import preprocess_resume, preprocess_job
from services.similarity import (
    get_semantic_similarity,
    calculate_cosine_similarity,
    build_job_graph,
    run_astar_search,
)
from services.matching_engine import calculate_match_score


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_applicant(skills=None, tools=None, resume_text="", years=None):
    """Build a minimal applicant dict in MongoDB document shape."""
    return {
        "applicantProfile": {
            "skills": [{"name": s} for s in (skills or [])],
            "tools":  tools or [],
            "resume": {"rawText": resume_text},
            "professionalInfo": {
                "yearsOfExp": str(years) if years is not None else None,
            },
        }
    }


def _make_job(skills=None, description="", level="any"):
    """Build a minimal job dict in MongoDB document shape."""
    return {
        "requiredSkills": skills or [],
        "description":    description,
        "experienceLevel": level,
    }


# ── Preprocessing ─────────────────────────────────────────────────────────────
class TestPreprocessing:
    def test_lowercases_text(self):
        assert preprocess_resume("Hello World PYTHON") == \
               preprocess_resume("Hello World PYTHON").lower()

    def test_removes_commas(self):
        result = preprocess_resume("Hello, World!")
        assert "," not in result

    def test_preserves_cpp(self):
        result = preprocess_resume("Expert in C++ programming")
        assert "c++" in result

    def test_preserves_csharp(self):
        result = preprocess_resume("C# developer")
        assert "c#" in result

    def test_preserves_dotnet(self):
        result = preprocess_resume(".NET framework experience")
        assert ".net" in result

    def test_empty_string_returns_string(self):
        assert isinstance(preprocess_resume(""), str)

    def test_job_combines_description_and_skills(self):
        result = preprocess_job("Build REST APIs", ["Python", "FastAPI"])
        assert "python" in result
        assert "fastapi" in result


# ── Semantic similarity ───────────────────────────────────────────────────────
class TestSemanticSimilarity:
    """
    Tests for get_semantic_similarity().
    Assertions use wide ranges to tolerate both the sentence-transformer
    model and the TF-IDF fallback.
    """

    def test_identical_texts_score_high(self):
        text = "python developer react nodejs postgresql"
        score = get_semantic_similarity(text, text)
        assert score > 90.0, f"Expected >90, got {score}"

    def test_empty_inputs_return_zero(self):
        assert get_semantic_similarity("", "") == 0.0
        assert get_semantic_similarity("python developer", "") == 0.0
        assert get_semantic_similarity("", "python developer") == 0.0

    def test_score_in_valid_range(self):
        score = get_semantic_similarity(
            "react frontend developer javascript",
            "backend python engineer django"
        )
        assert 0.0 <= score <= 100.0

    def test_returns_float(self):
        score = get_semantic_similarity("developer", "engineer")
        assert isinstance(score, float)

    def test_related_texts_score_higher_than_unrelated(self):
        related = get_semantic_similarity(
            "python backend developer django rest api",
            "python flask developer postgresql rest"
        )
        unrelated = get_semantic_similarity(
            "graphic designer photoshop illustrator branding",
            "python backend developer postgresql"
        )
        assert related > unrelated, \
            f"Related ({related}) should score higher than unrelated ({unrelated})"


# ── Hybrid matching engine — three required scenario tests ────────────────────
class TestMatchingEngine:
    """
    Three scenario tests required by the spec, plus structural tests.
    """

    # ── Scenario 1: React developer CV vs React job → expect ≥ 75% ──────────
    def test_react_developer_vs_react_job(self):
        """
        A React developer with matching skills and resume text should score
        at least 75% against a React frontend job.
        """
        applicant = _make_applicant(
            skills=["React", "JavaScript", "TypeScript", "Redux", "HTML", "CSS", "Git"],
            tools=["Git", "Figma", "Postman"],
            resume_text=(
                "Experienced React developer with 4 years building single-page "
                "applications using React, Redux, TypeScript, and REST APIs. "
                "Proficient in HTML, CSS, and responsive design. "
                "Used Git for version control and Figma for design collaboration."
            ),
            years=4,
        )
        job = _make_job(
            skills=["React", "JavaScript", "TypeScript", "Redux", "HTML", "CSS"],
            description=(
                "We are looking for a React frontend developer to build "
                "modern web applications. Must know React, Redux, TypeScript, "
                "HTML, CSS. Experience with Git and Figma is a plus."
            ),
            level="mid",
        )
        result = calculate_match_score(applicant, job)
        assert result["finalScore"] >= 75.0, \
            f"React dev vs React job: expected ≥75%, got {result['finalScore']}%"

    # ── Scenario 2: Designer CV vs Python backend job → expect ≤ 30% ────────
    def test_designer_vs_python_backend_job(self):
        """
        A graphic designer with no backend skills should score at most 30%
        against a Python backend engineering role.
        """
        applicant = _make_applicant(
            skills=["Figma", "Photoshop", "Illustrator", "Adobe XD", "Sketch"],
            tools=["Figma", "Photoshop"],
            resume_text=(
                "Creative graphic designer with 5 years of experience in "
                "visual branding, UI mockups, Figma prototyping, and print design. "
                "Skilled in Adobe Creative Suite including Photoshop and Illustrator."
            ),
            years=5,
        )
        job = _make_job(
            skills=["Python", "Django", "PostgreSQL", "Docker", "AWS", "REST APIs"],
            description=(
                "Backend Python engineer needed to build scalable REST APIs "
                "using Django and PostgreSQL. Must have Docker and AWS experience. "
                "Strong Python skills required."
            ),
            level="senior",
        )
        result = calculate_match_score(applicant, job)
        assert result["finalScore"] <= 30.0, \
            f"Designer vs Python backend: expected ≤30%, got {result['finalScore']}%"

    # ── Scenario 3: Empty resume → no crash, returns score with fallback ─────
    def test_empty_resume_does_not_crash(self):
        """
        An applicant with no resume text should not raise an exception.
        The engine falls back to skill-list comparison and returns a valid score.
        """
        applicant = _make_applicant(
            skills=["Python", "Django"],
            tools=[],
            resume_text="",   # ← empty
            years=2,
        )
        job = _make_job(
            skills=["Python", "Django", "PostgreSQL"],
            description="Backend developer needed.",
            level="mid",
        )
        # Must not raise
        result = calculate_match_score(applicant, job)

        assert isinstance(result, dict), "Result must be a dict"
        assert "finalScore" in result
        assert 0.0 <= result["finalScore"] <= 100.0, \
            f"Score out of range: {result['finalScore']}"
        assert isinstance(result["skillsMatched"], list)
        assert isinstance(result["skillsMissing"], list)
        assert isinstance(result["feedback"], str)

    # ── Structural tests ──────────────────────────────────────────────────────
    def test_returns_all_required_keys(self):
        applicant = _make_applicant(["Python"], resume_text="python developer", years=3)
        job = _make_job(["Python", "Django"], description="python backend", level="mid")
        result = calculate_match_score(applicant, job)
        for key in ("finalScore", "breakdown", "skillsMatched", "skillsMissing",
                    "matchCount", "totalRequired", "feedback", "experienceMatch"):
            assert key in result, f"Missing key: {key}"

    def test_breakdown_has_four_components(self):
        applicant = _make_applicant(["Python"], resume_text="python developer", years=3)
        job = _make_job(["Python"], description="python backend", level="mid")
        result = calculate_match_score(applicant, job)
        assert set(result["breakdown"].keys()) == {
            "skillScore", "semanticScore", "experienceScore", "toolsScore"
        }

    def test_breakdown_contributions_sum_to_final_score(self):
        applicant = _make_applicant(["Python", "Django"], resume_text="python django developer", years=3)
        job = _make_job(["Python", "Django"], description="python django backend", level="mid")
        result = calculate_match_score(applicant, job)
        total = sum(v["contribution"] for v in result["breakdown"].values())
        assert abs(total - result["finalScore"]) < 0.2, \
            f"Contributions {total:.2f} don't sum to finalScore {result['finalScore']}"

    def test_feedback_strong_match(self):
        # Force a high score: perfect skill match, matching experience, tools present
        applicant = _make_applicant(
            skills=["Python", "Django", "PostgreSQL", "Docker"],
            tools=["Docker", "Git"],
            resume_text="python django postgresql docker developer backend api",
            years=4,
        )
        job = _make_job(
            skills=["Python", "Django", "PostgreSQL", "Docker"],
            description="python django postgresql docker backend developer",
            level="mid",
        )
        result = calculate_match_score(applicant, job)
        if result["finalScore"] >= 80:
            assert result["feedback"] == "Strong match! You have most required skills."

    def test_feedback_partial_match(self):
        applicant = _make_applicant(skills=["Java"], resume_text="java developer", years=1)
        job = _make_job(
            skills=["Python", "Django", "PostgreSQL", "Docker", "AWS"],
            description="python backend developer",
            level="senior",
        )
        result = calculate_match_score(applicant, job)
        if result["finalScore"] < 60:
            assert result["feedback"] == "Partial match. Significant skill gaps exist."

    def test_experience_match_label_under(self):
        applicant = _make_applicant(["Python"], resume_text="python developer", years=1)
        job = _make_job(["Python"], description="python backend", level="senior")
        result = calculate_match_score(applicant, job)
        assert result["experienceMatch"] == "under"

    def test_experience_match_label_over(self):
        applicant = _make_applicant(["Python"], resume_text="python developer", years=10)
        job = _make_job(["Python"], description="python backend", level="entry")
        result = calculate_match_score(applicant, job)
        assert result["experienceMatch"] == "over"

    def test_experience_match_label_match(self):
        applicant = _make_applicant(["Python"], resume_text="python developer", years=3)
        job = _make_job(["Python"], description="python backend", level="mid")
        result = calculate_match_score(applicant, job)
        assert result["experienceMatch"] == "match"

    def test_no_skills_no_crash(self):
        applicant = _make_applicant(skills=[], resume_text="", years=None)
        job = _make_job(skills=[], description="", level="")
        result = calculate_match_score(applicant, job)
        assert result["finalScore"] >= 0.0


# ── Job Graph ─────────────────────────────────────────────────────────────────
class TestBuildJobGraph:
    def test_shared_skills_creates_edge(self):
        jobs = [
            {"_id": "a", "requiredSkills": ["Python", "Docker"]},
            {"_id": "b", "requiredSkills": ["Docker", "AWS"]},
        ]
        graph = build_job_graph(jobs)
        assert "b" in graph["a"]
        assert "a" in graph["b"]

    def test_no_shared_skills_no_edge(self):
        jobs = [
            {"_id": "a", "requiredSkills": ["Python"]},
            {"_id": "b", "requiredSkills": ["Java"]},
        ]
        graph = build_job_graph(jobs)
        assert graph["a"] == []
        assert graph["b"] == []

    def test_all_jobs_appear_as_keys(self):
        jobs = [
            {"_id": "a", "requiredSkills": ["Python"]},
            {"_id": "b", "requiredSkills": ["Java"]},
            {"_id": "c", "requiredSkills": ["Go"]},
        ]
        graph = build_job_graph(jobs)
        assert set(graph.keys()) == {"a", "b", "c"}

    def test_empty_jobs_returns_empty_graph(self):
        assert build_job_graph([]) == {}


# ── A* Search ─────────────────────────────────────────────────────────────────
class TestAStarSearch:
    def _make_jobs(self):
        return [
            {"_id": "j1", "title": "Python Dev",  "company": "A",
             "requiredSkills": ["Python", "Django"]},
            {"_id": "j2", "title": "React Dev",   "company": "B",
             "requiredSkills": ["React", "TypeScript"]},
            {"_id": "j3", "title": "Full Stack",  "company": "C",
             "requiredSkills": ["Python", "React"]},
        ]

    def test_finds_matching_job(self):
        jobs  = self._make_jobs()
        graph = build_job_graph(jobs)
        result = run_astar_search(["Python", "Django"], jobs, graph, threshold=50.0)
        assert result["found"] is not None
        assert result["score"] >= 50.0

    def test_returns_steps_count(self):
        jobs  = self._make_jobs()
        graph = build_job_graph(jobs)
        result = run_astar_search(["Python"], jobs, graph, threshold=50.0)
        assert result["steps"] >= 1

    def test_empty_jobs_returns_none(self):
        result = run_astar_search(["Python"], [], {}, threshold=50.0)
        assert result["found"] is None

    def test_explored_list_populated(self):
        jobs  = self._make_jobs()
        graph = build_job_graph(jobs)
        result = run_astar_search(["Python", "React"], jobs, graph, threshold=10.0)
        assert len(result["explored"]) > 0
