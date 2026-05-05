"""
main.py
-------
Entry point for the CareerConnect AI Service.

Responsibilities:
  - Load environment variables from .env
  - Connect to MongoDB Atlas on startup
  - Make the database available to route handlers via FastAPI dependency injection
  - Register the AI router under /api/ai
  - Expose a /health endpoint
  - Configure CORS for the React dev server and production client

Run with:
    uvicorn main:app --reload --port 8000
"""

import os
import sys
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError

# Load .env before anything else reads os.environ
load_dotenv()

# ── MongoDB connection (module-level, shared across requests) ─────────────────
_mongo_client: MongoClient | None = None
_db = None


def get_db():
    """
    FastAPI dependency that yields the MongoDB database instance.

    Injected into route handlers via Depends(get_db).  Raises a 503 if
    the database connection was never established (startup failure).
    """
    if _db is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database connection not available")
    return _db


# ── Lifespan: connect on startup, close on shutdown ──────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage the MongoDB connection lifecycle.

    On startup : connect to Atlas, verify with a ping, store the db reference.
    On shutdown: close the MongoClient cleanly.
    """
    global _mongo_client, _db

    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("[startup] ERROR: MONGO_URI is not set in environment. Exiting.", file=sys.stderr)
        sys.exit(1)

    try:
        print("[startup] Connecting to MongoDB Atlas…")
        _mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=8000)
        # Verify the connection is live before accepting traffic
        _mongo_client.admin.command("ping")
        _db = _mongo_client.get_default_database()
        print(f"[startup] MongoDB connected — database: '{_db.name}'")
    except (ConnectionFailure, ConfigurationError) as exc:
        print(f"[startup] ERROR: Could not connect to MongoDB: {exc}", file=sys.stderr)
        # Allow the service to start so /health still responds, but DB
        # endpoints will return 503 until the connection is restored.
        _mongo_client = None
        _db = None

    print("[startup] CareerConnect AI Service is ready.")
    yield  # ← application runs here

    # Shutdown
    if _mongo_client:
        _mongo_client.close()
        print("[shutdown] MongoDB connection closed.")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="CareerConnect AI Service",
    version="1.0.0",
    description="AI-powered resume matching, job recommendation, and A* job search.",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default dev port
        "http://localhost:3001",   # CareerConnect client dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Dependency injection: override the placeholder in routes/analyze.py ───────
# Import after app is created to avoid circular imports
from routes.analyze import get_db as route_get_db, router as analyze_router  # noqa: E402

app.dependency_overrides[route_get_db] = get_db

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(analyze_router, prefix="/api/ai", tags=["AI"])

# ── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health():
    """
    Lightweight liveness probe.
    Returns 200 as long as the FastAPI process is running.
    The 'db' field reflects whether MongoDB is connected.
    """
    return {
        "status": "ok",
        "service": "CareerConnect AI",
        "db": "connected" if _db is not None else "unavailable",
    }
