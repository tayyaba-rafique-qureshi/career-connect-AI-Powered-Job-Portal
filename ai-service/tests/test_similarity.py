"""
Unit tests for the AI similarity and preprocessing pipeline.
These run without MongoDB — pure Python logic only.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.preprocessing import preprocess_resume, preprocess_job
from services.similarity import calculate_cosine_similarity, build_job_graph, run_astar_search


# ── Preprocessing ─────────────────────────────────────────────────────────────
class TestPreprocessing:
    def test_lowercases_text(self):
        result = preprocess_resume("Hello World PYTHON")
        assert result == result.lower()

    def test_removes_punctuation(self):
        result = preprocess_resume("Hello, World!")
        assert "," not in result
        assert "!" not in result

    def test_cleans_resume_text(self):
        result = preprocess_resume("Python Developer React")
        assert "python" in result

    def test_empty_string_returns_string(self):
        result = preprocess_resume("")
        assert isinstance(result, str)

    def test_job_combines_description_and_skills(self):
        result = preprocess_job("Build REST APIs", ["Python", "FastAPI"])
        assert "python" in result
        assert "fastapi" in result


# ── Cosine Similarity ─────────────────────────────────────────────────────────
class TestCosineSimilarity:
    def test_identical_texts_score_high(self):
        text = "python developer react nodejs"
        score = calculate_cosine_similarity(text, text)
        assert score > 90.0

    def test_unrelated_texts_score_low(self):
        score = calculate_cosine_similarity(
            "graphic designer photoshop illustrator",
            "backend python developer postgresql"
        )
        assert score < 30.0

    def test_empty_strings_return_zero(self):
        assert calculate_cosine_similarity("", "") == 0.0
        assert calculate_cosine_similarity("python", "") == 0.0

    def test_score_range(self):
        score = calculate_cosine_similarity("react developer", "frontend engineer react")
        assert 0.0 <= score <= 100.0

    def test_returns_float(self):
        score = calculate_cosine_similarity("developer", "engineer")
        assert isinstance(score, float)

    def test_related_texts_score_moderate(self):
        score = calculate_cosine_similarity(
            "python developer django postgresql",
            "backend developer python flask database"
        )
        assert score > 10.0


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
            {"_id": "j1", "title": "Python Dev", "company": "A", "requiredSkills": ["Python", "Django"]},
            {"_id": "j2", "title": "React Dev",  "company": "B", "requiredSkills": ["React", "TypeScript"]},
            {"_id": "j3", "title": "Full Stack",  "company": "C", "requiredSkills": ["Python", "React"]},
        ]

    def test_finds_matching_job(self):
        jobs = self._make_jobs()
        graph = build_job_graph(jobs)
        result = run_astar_search(["Python", "Django"], jobs, graph, threshold=50.0)
        assert result["found"] is not None
        assert result["score"] >= 50.0

    def test_returns_steps_count(self):
        jobs = self._make_jobs()
        graph = build_job_graph(jobs)
        result = run_astar_search(["Python"], jobs, graph, threshold=50.0)
        assert result["steps"] >= 1

    def test_empty_jobs_returns_none(self):
        result = run_astar_search(["Python"], [], {}, threshold=50.0)
        assert result["found"] is None

    def test_explored_list_populated(self):
        jobs = self._make_jobs()
        graph = build_job_graph(jobs)
        result = run_astar_search(["Python", "React"], jobs, graph, threshold=10.0)
        assert len(result["explored"]) > 0
