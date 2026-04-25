import math
from collections import Counter
from services.preprocessing import preprocess

def build_vector(tokens: list[str], vocab: set[str]) -> list[float]:
    """Build a TF (term frequency) vector over a shared vocabulary."""
    counts = Counter(tokens)
    total = len(tokens) or 1
    return [counts.get(word, 0) / total for word in vocab]

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity between two vectors from scratch."""
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a ** 2 for a in vec_a))
    mag_b = math.sqrt(sum(b ** 2 for b in vec_b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)

def compute_similarity(resume: str, job_description: str) -> float:
    """
    Full pipeline:
      1. Preprocess both texts
      2. Build shared vocabulary
      3. Vectorize
      4. Return cosine similarity score
    """
    tokens_a = preprocess(resume)
    tokens_b = preprocess(job_description)
    vocab = set(tokens_a) | set(tokens_b)

    vec_a = build_vector(tokens_a, vocab)
    vec_b = build_vector(tokens_b, vocab)

    return cosine_similarity(vec_a, vec_b)
