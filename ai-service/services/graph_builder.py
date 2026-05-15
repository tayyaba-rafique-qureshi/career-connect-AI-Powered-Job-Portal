"""
services/graph_builder.py
--------------------------
Job graph construction for the CareerConnect A* search engine.

Two pure functions — no database calls, no HTTP concerns:

  build_job_graph(jobs) -> dict
      Builds an undirected adjacency list where two jobs are connected
      when they share at least one required skill.  This graph is the
      search space that A* traverses.

  get_starting_nodes(applicant_skills, jobs) -> list[dict]
      Returns all jobs that share at least one skill with the applicant,
      ordered by overlap count descending.  Used to seed the A* open list
      with the most promising starting points.
"""

from __future__ import annotations


def build_job_graph(jobs: list[dict]) -> dict:
    """
    Build an undirected adjacency list connecting jobs that share at
    least one required skill.

    Two jobs are neighbours if a candidate who qualifies for one is
    likely to qualify for the other — shared skills make the roles
    semantically adjacent in the search space.

    Algorithm
    ---------
    For every pair (job_a, job_b) compute the intersection of their
    lowercased skill sets.  If the intersection is non-empty, add a
    bidirectional edge.  Time complexity: O(n² × s) where n = number
    of jobs and s = average skills per job.

    Parameters
    ----------
    jobs : list[dict]
        Job documents.  Each dict must have:
          "_id"           : str  — MongoDB ObjectId already stringified
          "requiredSkills": list[str]  (falls back to "skills" for legacy docs)

    Returns
    -------
    dict
        Adjacency list: { job_id_str: [neighbour_job_id_str, …], … }
        Every job appears as a key even if it has no neighbours (isolated node).

    Examples
    --------
    >>> jobs = [
    ...   {"_id": "a", "requiredSkills": ["Python", "Docker"]},
    ...   {"_id": "b", "requiredSkills": ["Docker", "AWS"]},
    ...   {"_id": "c", "requiredSkills": ["Java", "Spring"]},
    ... ]
    >>> build_job_graph(jobs)
    {'a': ['b'], 'b': ['a'], 'c': []}
    """
    graph: dict[str, list[str]] = {}

    # Ensure every job has an entry, even isolated ones
    for job in jobs:
        graph.setdefault(str(job["_id"]), [])

    for i, job_a in enumerate(jobs):
        id_a     = str(job_a["_id"])
        skills_a = {
            s.strip().lower()
            for s in (job_a.get("requiredSkills") or job_a.get("skills") or [])
        }

        for job_b in jobs[i + 1:]:
            id_b     = str(job_b["_id"])
            skills_b = {
                s.strip().lower()
                for s in (job_b.get("requiredSkills") or job_b.get("skills") or [])
            }

            if skills_a & skills_b:          # non-empty intersection → shared skill
                graph[id_a].append(id_b)
                graph[id_b].append(id_a)

    return graph


def get_starting_nodes(
    applicant_skills: list[str],
    jobs: list[dict],
) -> list[dict]:
    """
    Return all jobs that share at least one skill with the applicant,
    sorted by overlap count descending.

    This gives A* the best possible starting points: jobs with the most
    skill overlap are explored first, reducing the number of nodes the
    algorithm needs to visit before finding a goal.

    Parameters
    ----------
    applicant_skills : list[str]
        Flat list of skill name strings from the applicant's profile.
    jobs : list[dict]
        Job documents (ObjectIds pre-stringified).

    Returns
    -------
    list[dict]
        Subset of jobs that overlap with the applicant's skills, each
        augmented with an "_overlapCount" key for sorting.  The key is
        removed before returning so callers receive clean job dicts.

        If no jobs overlap, returns all jobs (so A* always has a start
        node and can still find the best available match).

    Examples
    --------
    >>> applicant_skills = ["Python", "Docker"]
    >>> jobs = [
    ...   {"_id": "a", "requiredSkills": ["Python", "React"]},   # overlap=1
    ...   {"_id": "b", "requiredSkills": ["Docker", "AWS"]},     # overlap=1
    ...   {"_id": "c", "requiredSkills": ["Java", "Spring"]},    # overlap=0
    ... ]
    >>> [j["_id"] for j in get_starting_nodes(applicant_skills, jobs)]
    ['a', 'b']   # 'c' excluded; order may vary (both overlap=1)
    """
    if not applicant_skills or not jobs:
        return jobs

    applicant_lower = {s.strip().lower() for s in applicant_skills}

    candidates: list[tuple[int, dict]] = []

    for job in jobs:
        job_skills = {
            s.strip().lower()
            for s in (job.get("requiredSkills") or job.get("skills") or [])
        }
        overlap = len(applicant_lower & job_skills)
        if overlap > 0:
            candidates.append((overlap, job))

    if not candidates:
        # No overlap at all — return all jobs so A* can still run
        return jobs

    # Sort by overlap count descending (most promising first)
    candidates.sort(key=lambda t: t[0], reverse=True)
    return [job for _, job in candidates]
