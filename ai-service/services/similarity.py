"""
services/similarity.py
-----------------------
Core AI logic for the CareerConnect matching engine.

This module is intentionally free of database calls and HTTP concerns.
Every function takes plain Python values and returns plain Python values,
making the algorithms easy to test in isolation and easy to swap out
for more sophisticated models later.

Algorithms implemented:
  - TF-IDF cosine similarity  (sklearn)
  - Job graph construction    (adjacency list, shared-skill edges)
  - A* search                 (heuristic: h(n) = 100 - match_score)
"""

import heapq
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine


# ── Cosine similarity ─────────────────────────────────────────────────────────

def calculate_cosine_similarity(text_a: str, text_b: str) -> float:
    """
    Compute TF-IDF cosine similarity between two text strings.

    Uses scikit-learn's TfidfVectorizer with English stop-word removal
    so common words ("the", "and", "for") don't inflate scores.

    The raw cosine value (0–1) is multiplied by 100 so callers always
    work with a 0–100 percentage scale.

    Parameters
    ----------
    text_a : str
        First document (e.g. preprocessed resume text).
    text_b : str
        Second document (e.g. preprocessed job description + skills).

    Returns
    -------
    float
        Similarity score in the range [0.0, 100.0].
        Returns 0.0 if either string is empty or contains only stop words.

    Example
    -------
    >>> calculate_cosine_similarity("python django rest api", "python fastapi rest")
    52.34   # (illustrative — actual value depends on IDF weights)
    """
    if not text_a or not text_b:
        return 0.0

    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
        score = sklearn_cosine(tfidf_matrix[0], tfidf_matrix[1])[0][0]
        return round(float(score) * 100, 2)
    except ValueError:
        # Raised when the vocabulary is empty after stop-word removal
        return 0.0


# ── Job graph ─────────────────────────────────────────────────────────────────

def build_job_graph(jobs: list[dict]) -> dict:
    """
    Build an undirected adjacency list connecting jobs that share at
    least one required skill.

    This graph is the search space for A*.  Two jobs are neighbours if
    a candidate who qualifies for one is likely to qualify for the other,
    making the graph a natural representation of "skill proximity".

    Parameters
    ----------
    jobs : list[dict]
        List of job documents.  Each dict must have:
          - "_id"            : str  — MongoDB ObjectId as string
          - "requiredSkills" : list[str]  (may also be "skills" for legacy docs)

    Returns
    -------
    dict
        Adjacency list: { job_id_str: [neighbour_job_id_str, ...], … }
        Every job appears as a key even if it has no neighbours.

    Example
    -------
    >>> jobs = [
    ...   {"_id": "a", "requiredSkills": ["Python", "Docker"]},
    ...   {"_id": "b", "requiredSkills": ["Docker", "AWS"]},
    ...   {"_id": "c", "requiredSkills": ["Java", "Spring"]},
    ... ]
    >>> build_job_graph(jobs)
    {'a': ['b'], 'b': ['a'], 'c': []}
    """
    graph: dict[str, list[str]] = {}

    for job in jobs:
        job_id = str(job["_id"])
        graph.setdefault(job_id, [])

    for i, job_a in enumerate(jobs):
        id_a = str(job_a["_id"])
        skills_a = {s.lower() for s in (job_a.get("requiredSkills") or job_a.get("skills") or [])}

        for job_b in jobs[i + 1:]:
            id_b = str(job_b["_id"])
            skills_b = {s.lower() for s in (job_b.get("requiredSkills") or job_b.get("skills") or [])}

            if skills_a & skills_b:  # non-empty intersection → shared skill
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

    Algorithm overview
    ------------------
    State space : each node is a job.
    Start node  : the job with the highest initial match score (greedy seed).
    Goal test   : match_score >= threshold.
    g(n)        : cost so far = number of edges traversed from the start node.
    h(n)        : heuristic  = 100 - match_score(n)
                  (admissible: never overestimates the remaining "distance"
                   to a perfect match because match_score ≤ 100).
    f(n)        : g(n) + h(n)  — standard A* priority.

    The search expands the node with the lowest f(n) first.  When a node
    whose match_score >= threshold is dequeued, it is returned as the
    solution.  If the queue empties without finding a goal, the best
    node seen so far is returned with found=None.

    Parameters
    ----------
    applicant_skills : list[str]
        Skills from the applicant's profile (used to compute match scores).
    jobs : list[dict]
        All active job documents.  Each must have "_id", "requiredSkills"
        (or "skills"), "title", "company".
    graph : dict
        Adjacency list produced by build_job_graph().
    threshold : float
        Minimum match score (0–100) to consider a job a "goal".

    Returns
    -------
    dict with keys:
        found   : dict | None  — the goal job document, or None if not found.
        score   : float        — match score of the returned job (0–100).
        steps   : int          — number of nodes dequeued (search effort).
        explored: list[dict]   — each entry has job_id, title, g, h, f, score
                                 for report / visualisation purposes.

    Notes
    -----
    - Skill matching uses simple set intersection (case-insensitive).
    - If jobs list is empty, returns immediately with found=None.
    """
    if not jobs:
        return {"found": None, "score": 0.0, "steps": 0, "explored": []}

    # Pre-compute match scores for all jobs (cheap — just set intersection)
    applicant_lower = {s.strip().lower() for s in applicant_skills}

    def match_score(job: dict) -> float:
        job_skills = [s.lower() for s in (job.get("requiredSkills") or job.get("skills") or [])]
        if not job_skills:
            return 0.0
        matched = sum(1 for s in job_skills if s in applicant_lower)
        return round((matched / len(job_skills)) * 100, 2)

    # Build a lookup map for O(1) job access by id string
    job_map: dict[str, dict] = {str(j["_id"]): j for j in jobs}

    # Seed: start from the job with the highest initial score
    scores = {jid: match_score(job_map[jid]) for jid in job_map}
    start_id = max(scores, key=lambda jid: scores[jid])

    # A* priority queue: (f, g, job_id)
    # Using a counter as a tiebreaker to avoid comparing dicts
    counter = 0
    open_heap: list[tuple[float, int, str]] = []

    g_start = 0.0
    h_start = 100.0 - scores[start_id]
    f_start = g_start + h_start
    heapq.heappush(open_heap, (f_start, counter, start_id))

    visited: set[str] = set()
    g_costs: dict[str, float] = {start_id: g_start}

    explored: list[dict] = []
    steps = 0
    best_job: dict | None = None
    best_score = 0.0

    while open_heap:
        f, _, current_id = heapq.heappop(open_heap)

        if current_id in visited:
            continue
        visited.add(current_id)
        steps += 1

        current_job = job_map[current_id]
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

        # Track the best node seen regardless of threshold
        if current_score > best_score:
            best_score = current_score
            best_job = current_job

        # Goal test
        if current_score >= threshold:
            return {
                "found": current_job,
                "score": current_score,
                "steps": steps,
                "explored": explored,
            }

        # Expand neighbours
        for neighbour_id in graph.get(current_id, []):
            if neighbour_id in visited:
                continue

            new_g = g + 1.0  # uniform edge cost
            if new_g < g_costs.get(neighbour_id, float("inf")):
                g_costs[neighbour_id] = new_g
                h_n = 100.0 - scores.get(neighbour_id, 0.0)
                f_n = new_g + h_n
                counter += 1
                heapq.heappush(open_heap, (f_n, counter, neighbour_id))

    # No goal found — return the best job seen
    return {
        "found": None,
        "score": best_score,
        "steps": steps,
        "explored": explored,
    }
