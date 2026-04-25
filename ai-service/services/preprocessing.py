import re

def preprocess(text: str) -> list[str]:
    """
    Lowercases, strips punctuation, and tokenizes text into a word list.
    No external NLP libraries — pure Python.
    """
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    tokens = text.split()
    return tokens
