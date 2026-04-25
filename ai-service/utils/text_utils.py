def truncate(text: str, max_words: int = 500) -> str:
    """Truncate text to a max word count to avoid oversized payloads."""
    words = text.split()
    return ' '.join(words[:max_words])
