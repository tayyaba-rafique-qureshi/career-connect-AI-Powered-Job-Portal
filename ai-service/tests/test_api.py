"""
FastAPI endpoint tests using httpx TestClient.
Tests the /health and /api/ai/* endpoints without a real server or MongoDB.
The DB dependency is overridden with a mock so tests run in CI without Atlas.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017/test")

from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Build a minimal test app that uses the analyze router
# but overrides the DB dependency so no real MongoDB is needed
from routes.analyze import router as analyze_router, get_db

def mock_db():
    """Return a MagicMock that satisfies basic DB calls."""
    db = MagicMock()
    db["users"].find_one.return_value = None
    db["jobs"].find_one.return_value = None
    db["jobs"].find.return_value = []
    return db

test_app = FastAPI()
test_app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
test_app.include_router(analyze_router, prefix="/api/ai")
test_app.dependency_overrides[get_db] = mock_db

@test_app.get("/health")
def health():
    return {"status": "ok", "service": "CareerConnect AI", "db": "test"}

client = TestClient(test_app)


class TestHealthEndpoint:
    def test_health_returns_ok(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    def test_health_has_service_field(self):
        res = client.get("/health")
        assert "service" in res.json()


class TestMatchEndpoint:
    def test_missing_applicant_returns_404(self):
        """With mock DB returning None, applicant lookup should 404."""
        res = client.post("/api/ai/match", json={
            "applicant_id": "507f1f77bcf86cd799439011",
            "job_id":       "507f1f77bcf86cd799439012"
        })
        assert res.status_code == 404

    def test_invalid_applicant_id_returns_400(self):
        res = client.post("/api/ai/match", json={
            "applicant_id": "not-a-valid-id",
            "job_id":       "507f1f77bcf86cd799439012"
        })
        assert res.status_code == 400

    def test_missing_fields_returns_422(self):
        res = client.post("/api/ai/match", json={"applicant_id": "507f1f77bcf86cd799439011"})
        assert res.status_code == 422

    def test_match_response_shape_when_applicant_found(self):
        """
        Override the mock to return a realistic applicant + job so the
        endpoint reaches the scoring logic and we can assert on the
        response shape (new fields: breakdown, feedback, experienceMatch).
        """
        from unittest.mock import MagicMock
        from routes.analyze import get_db

        def rich_mock_db():
            db = MagicMock()
            db["users"].find_one.return_value = {
                "_id": "507f1f77bcf86cd799439011",
                "applicantProfile": {
                    "resume": {"rawText": "python developer django rest api postgresql"},
                    "skills": [{"name": "Python"}, {"name": "Django"}],
                    "professionalInfo": {"yearsOfExp": "3"},
                },
            }
            db["jobs"].find_one.return_value = {
                "_id": "507f1f77bcf86cd799439012",
                "title": "Backend Developer",
                "description": "Build REST APIs with Python and Django",
                "requiredSkills": ["Python", "Django", "PostgreSQL"],
                "experienceLevel": "mid",
            }
            return db

        test_app.dependency_overrides[get_db] = rich_mock_db
        res = client.post("/api/ai/match", json={
            "applicant_id": "507f1f77bcf86cd799439011",
            "job_id":       "507f1f77bcf86cd799439012",
        })
        # Restore original mock
        test_app.dependency_overrides[get_db] = mock_db

        assert res.status_code == 200
        body = res.json()
        assert "matchScore" in body
        assert "skillsMatched" in body
        assert "skillsMissing" in body
        assert "breakdown" in body
        assert "feedback" in body
        assert "experienceMatch" in body
        assert isinstance(body["matchScore"], float)
        assert 0.0 <= body["matchScore"] <= 100.0
        assert body["experienceMatch"] in ("match", "under", "over", "unknown")


class TestSearchEndpoint:
    def test_empty_jobs_returns_empty_result(self):
        """With mock DB returning no jobs, search should return gracefully."""
        res = client.post("/api/ai/search", json={
            "applicant_id": "507f1f77bcf86cd799439011",
            "threshold": 50.0
        })
        # Either 404 (applicant not found) or 200 with empty result
        assert res.status_code in [200, 404]

    def test_invalid_applicant_id_returns_400(self):
        res = client.post("/api/ai/search", json={
            "applicant_id": "bad-id",
            "threshold": 50.0
        })
        assert res.status_code == 400


class TestRecommendEndpoint:
    def test_invalid_applicant_id_returns_400(self):
        res = client.get("/api/ai/recommend/not-a-valid-id")
        assert res.status_code == 400

    def test_missing_applicant_returns_404(self):
        res = client.get("/api/ai/recommend/507f1f77bcf86cd799439011")
        assert res.status_code == 404
