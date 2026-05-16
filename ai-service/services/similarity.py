# Replaced: old TF-IDF cosine similarity. New: hybrid matching engine

"""
services/similarity.py
-----------------------
Semantic similarity functions for the CareerConnect hybrid matching engine.

Public API
----------
get_semantic_similarity(text_a, text_b) -> float
    Sentence-embedding cosine similarity via all-MiniLM-L6-v2 (0–100).

get_skill_semantic_similarity(skills_a, skills_b) -> float
    Convenience wrapper: joins skill lists as strings, delegates to
    get_semantic_similarity.

calculate_cosine_similarity(text_a, text_b) -> float
    Legacy TF-IDF shim kept for the /recommend endpoint which does not
    need the full hybrid breakdown.  New code should use matching_engine.

Also kept (used by /search endpoint):
    build_job_graph(jobs) -> dict
    run_astar_search(applicant_skills, jobs, graph, threshold) -> dict
"""

import heapq
import logging
from functools import lru_cache
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine

logger = logging.getLogger(__name__)


# ── Sentence-transformer model (loaded once at module level) ──────────────────

@lru_cache(maxsize=1)
def _load_sentence_model():
    """
    Load all-MiniLM-L6-v2 exactly once per process via lru_cache.

    Logs progress so the operator can see the ~80 MB download on first run.
    Falls back to None if sentence-transformers or torch is unavailable
    (e.g. lightweight CI environments) so the rest of the service keeps
    working with TF-IDF fallback.

    Returns
    -------
    SentenceTransformer | None
    """
    try:
        from sentence_transformers import SentenceTransformer
        print("Loading SentenceTransformer — this may take a moment...")
        logger.info("[similarity] Loading SentenceTransformer — this may take a moment...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        print("SentenceTransformer loaded successfully")
        logger.info("[similarity] SentenceTransformer loaded successfully")
        return model
    except Exception as exc:
        logger.warning(
            "[similarity] sentence-transformers unavailable (%s). "
            "Semantic scoring will fall back to TF-IDF.",
            exc,
        )
        return None


# Trigger model load at import time so the first request isn't slow.
# The lru_cache ensures this only runs once even if imported multiple times.
_load_sentence_model()


# ── Public semantic similarity functions ──────────────────────────────────────

def _extract_relevant_portion(resume_text: str, job_text: str) -> str:
    """
    Extract the most relevant portion of resume text for semantic comparison.

    Always includes the summary/profile section (most representative of the
    candidate) plus the top 8 sentences scored by keyword overlap with the
    job description.  Result is capped at 2000 characters.

    Parameters
    ----------
    resume_text : str — full resume rawText
    job_text    : str — job description text

    Returns
    -------
    str — summary section + top relevant sentences, max 2000 chars.
    """
    import re

    lines = resume_text.split("\n")

    # ── Always include the summary/profile section ────────────────────────────
    _SUMMARY_KEYWORDS = {"summary", "profile", "objective", "about"}
    summary_text = ""
    for i, line in enumerate(lines):
        if any(kw in line.lower() for kw in _SUMMARY_KEYWORDS):
            # Take the heading line plus the next 5 lines
            summary_text = " ".join(lines[i: i + 6])
            break

    # Fall back to the first 300 characters if no summary heading found
    if not summary_text:
        summary_text = resume_text[:300]

    # ── Score remaining sentences by keyword overlap with the job ─────────────
    _STOPWORDS = {
        "the", "a", "an", "and", "or", "in", "on", "at", "to",
        "for", "of", "with", "is", "are", "was", "were",
        "be", "have", "has", "will", "you", "we", "our",
        "their", "this", "that", "as", "by", "from", "your",
    }
    job_words    = set(re.findall(r"\b[a-zA-Z][a-zA-Z0-9]*\b", job_text.lower()))
    job_keywords = job_words - _STOPWORDS

    sentences = re.split(r"[.\n]", resume_text)
    scored: list[tuple[int, str]] = []
    for sent in sentences:
        sent = sent.strip()
        if len(sent) < 15:
            continue
        sent_words = set(re.findall(r"\b[a-zA-Z][a-zA-Z0-9]*\b", sent.lower()))
        overlap    = len(sent_words & job_keywords)
        scored.append((overlap, sent))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_sentences = [s for _, s in scored[:8]]

    combined = summary_text + " " + " ".join(top_sentences)
    return combined[:2000]


def get_semantic_similarity(text_a: str, text_b: str) -> float:
    """
    Compute semantic similarity between two text strings using
    SentenceTransformer('all-MiniLM-L6-v2').

    When text_a (resume) is more than 3× longer than text_b (job
    description), the most relevant portion of the resume is extracted
    first to avoid the length-mismatch penalty that suppresses cosine
    similarity scores.

    Falls back to TF-IDF cosine similarity if the model is unavailable.

    Parameters
    ----------
    text_a : str — first document (e.g. resume text or skill list)
    text_b : str — second document (e.g. job description or skill list)

    Returns
    -------
    float — similarity score in [0.0, 100.0]; 0.0 if either input is empty.
    """
    if not text_a or not text_b:
        return 0.0

    # Extract the most relevant resume portion when there is a large length gap
    if len(text_a) > len(text_b) * 3:
        text_a = _extract_relevant_portion(text_a, text_b)

    model = _load_sentence_model()

    if model is not None:
        try:
            # Try sentence_transformers.util.cos_sim (cleaner, handles tensors)
            try:
                from sentence_transformers import util as st_util
                embeddings = model.encode([text_a, text_b], convert_to_tensor=True)
                similarity = st_util.cos_sim(embeddings[0], embeddings[1]).item()
                return round(max(0.0, similarity) * 100, 2)
            except Exception:
                # Fall back to manual numpy cosine (works without util)
                embeddings = model.encode([text_a, text_b], convert_to_numpy=True)
                norm_a  = embeddings[0] / (np.linalg.norm(embeddings[0]) + 1e-10)
                norm_b  = embeddings[1] / (np.linalg.norm(embeddings[1]) + 1e-10)
                cosine  = float(np.dot(norm_a, norm_b))
                return round(max(cosine, 0.0) * 100, 2)
        except Exception as exc:
            logger.warning(
                "[similarity] Semantic scoring failed: %s — falling back to TF-IDF", exc
            )

    # Final fallback: TF-IDF cosine similarity
    return calculate_cosine_similarity(text_a, text_b)


def get_skill_semantic_similarity(
    skills_a: list[str],
    skills_b: list[str],
) -> float:
    """
    Compute semantic similarity between two skill lists.

    Joins each list into a single space-separated string and delegates
    to get_semantic_similarity.  This lets the sentence model capture
    semantic proximity between skill sets (e.g. "React Redux" is close
    to "Vue Vuex" even without exact keyword overlap).

    Parameters
    ----------
    skills_a : list[str] — first skill list (e.g. applicant skills)
    skills_b : list[str] — second skill list (e.g. job required skills)

    Returns
    -------
    float — similarity score in [0.0, 100.0]; 0.0 if either list is empty.
    """
    if not skills_a or not skills_b:
        return 0.0
    return get_semantic_similarity(" ".join(skills_a), " ".join(skills_b))


# ── Legacy TF-IDF shim ────────────────────────────────────────────────────────

def calculate_cosine_similarity(text_a: str, text_b: str) -> float:
    """
    TF-IDF cosine similarity (0–100).

    Retained for:
      - The /recommend endpoint (fast bulk scoring, no full breakdown needed)
      - Fallback inside get_semantic_similarity when the model is unavailable
      - Backward compatibility with any existing callers

    New matching logic should use matching_engine.calculate_match_score().

    Parameters
    ----------
    text_a, text_b : str — preprocessed text strings

    Returns
    -------
    float in [0.0, 100.0]
    """
    if not text_a or not text_b:
        return 0.0
    try:
        vec = TfidfVectorizer(stop_words="english")
        matrix = vec.fit_transform([text_a, text_b])
        score = sklearn_cosine(matrix[0], matrix[1])[0][0]
        return round(float(score) * 100, 2)
    except ValueError:
        return 0.0


# ── Job graph ─────────────────────────────────────────────────────────────────

def build_job_graph(jobs: list[dict]) -> dict:
    """
    Build an undirected adjacency list connecting jobs that share at
    least one required skill.

    Used as the search space for A* in the /search endpoint.

    Parameters
    ----------
    jobs : list[dict]
        Each dict must have "_id" (str) and "requiredSkills" or "skills".

    Returns
    -------
    dict — { job_id: [neighbour_job_id, …], … }
           Every job appears as a key even if it has no neighbours.
    """
    graph: dict[str, list[str]] = {}

    for job in jobs:
        graph.setdefault(str(job["_id"]), [])

    for i, job_a in enumerate(jobs):
        id_a     = str(job_a["_id"])
        skills_a = {s.lower() for s in (job_a.get("requiredSkills") or job_a.get("skills") or [])}

        for job_b in jobs[i + 1:]:
            id_b     = str(job_b["_id"])
            skills_b = {s.lower() for s in (job_b.get("requiredSkills") or job_b.get("skills") or [])}

            if skills_a & skills_b:
                graph[id_a].append(id_b)
                graph[id_b].append(id_a)

    return graph


# ── A* search ─────────────────────────────────────────────────────────────────

def run_astar_search(
    applicant_skills: list[str],
    jobs: list[dict],
    graph: dict,
    threshold: float,
) -> dict:
    """
    Run A* search over the job graph to find the best-matching job above
    a given threshold score.

    Algorithm
    ---------
    State space : each node is a job.
    Start node  : job with the highest initial skill-overlap score.
    Goal test   : match_score >= threshold.
    g(n)        : edges traversed from start (uniform cost = 1).
    h(n)        : 100 - match_score(n)  — admissible heuristic.
    f(n)        : g(n) + h(n).

    Parameters
    ----------
    applicant_skills : list[str]
    jobs             : list[dict]
    graph            : dict — from build_job_graph()
    threshold        : float — goal score (0–100)

    Returns
    -------
    dict — { found, score, steps, explored }
    """
    if not jobs:
        return {"found": None, "score": 0.0, "steps": 0, "explored": []}

    applicant_lower = {s.strip().lower() for s in applicant_skills}

    def _score(job: dict) -> float:
        skills = [s.lower() for s in (job.get("requiredSkills") or job.get("skills") or [])]
        if not skills:
            return 0.0
        return round(sum(1 for s in skills if s in applicant_lower) / len(skills) * 100, 2)

    job_map: dict[str, dict] = {str(j["_id"]): j for j in jobs}
    scores   = {jid: _score(job_map[jid]) for jid in job_map}
    start_id = max(scores, key=lambda jid: scores[jid])

    counter = 0
    heap: list[tuple[float, int, str]] = []
    heapq.heappush(heap, (100.0 - scores[start_id], counter, start_id))

    visited:   set[str]         = set()
    g_costs:   dict[str, float] = {start_id: 0.0}
    explored:  list[dict]       = []
    steps      = 0
    best_job:  Optional[dict]   = None
    best_score = 0.0

    while heap:
        f, _, current_id = heapq.heappop(heap)

        if current_id in visited:
            continue
        visited.add(current_id)
        steps += 1

        current_job   = job_map[current_id]
        current_score = scores[current_id]
        g = g_costs[current_id]
        h = 100.0 - current_score

        explored.append({
            "job_id": current_id,
            "title":  current_job.get("title", ""),
            "score":  current_score,
            "g":      round(g, 2),
            "h":      round(h, 2),
            "f":      round(g + h, 2),
        })

        if current_score > best_score:
            best_score = current_score
            best_job   = current_job

        if current_score >= threshold:
            return {
                "found":    current_job,
                "score":    current_score,
                "steps":    steps,
                "explored": explored,
            }

        for neighbour_id in graph.get(current_id, []):
            if neighbour_id in visited:
                continue
            new_g = g + 1.0
            if new_g < g_costs.get(neighbour_id, float("inf")):
                g_costs[neighbour_id] = new_g
                f_n = new_g + (100.0 - scores.get(neighbour_id, 0.0))
                counter += 1
                heapq.heappush(heap, (f_n, counter, neighbour_id))

    return {"found": None, "score": best_score, "steps": steps, "explored": explored}
