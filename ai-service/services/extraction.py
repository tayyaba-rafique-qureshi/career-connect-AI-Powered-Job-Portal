"""
services/extraction.py
-----------------------
PDF text extraction helper for the CareerConnect AI service.

Provides two functions:

  extract_text_from_pdf_bytes(pdf_bytes) -> str
      Runs pdfplumber on raw bytes and returns concatenated page text.

  extract_text_from_gridfs(file_id, db) -> str
      Fetches a PDF from MongoDB GridFS by file ID string, trying the
      Node.js bucket name ('uploads') first, then common fallbacks
      ('fs', 'resumes') so the function never fails due to a naming
      mismatch between the Node.js and Python services.

No HTTP concerns, no FastAPI dependencies — pure Python logic.
"""

import io
import logging

import gridfs
import pdfplumber
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.database import Database

logger = logging.getLogger(__name__)

# Bucket names to try, in priority order.
# 'uploads' is first because that is what server/src/config/gridfs.js uses:
#   new GridFSBucket(db, { bucketName: 'uploads' })
# The others are kept as fallbacks so the service degrades gracefully if the
# Node.js config ever changes or a different bucket was used historically.
_BUCKET_NAMES_TO_TRY = ["uploads", "fs", "resumes"]


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extract all text from a PDF given its raw bytes.

    Iterates every page with pdfplumber and concatenates non-empty pages
    with a double newline separator.

    Parameters
    ----------
    pdf_bytes : bytes
        Raw PDF file content.

    Returns
    -------
    str
        Concatenated page text, or an empty string if no text was found
        (e.g. scanned image PDFs).

    Raises
    ------
    RuntimeError
        If pdfplumber cannot open or parse the bytes.
    """
    text_pages: list[str] = []
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text_pages.append(page_text.strip())
                    logger.debug(
                        "[extraction] page=%d chars=%d", page_num, len(page_text)
                    )
    except Exception as exc:
        logger.error("[extraction] pdfplumber failed: %s", exc)
        raise RuntimeError(f"PDF could not be parsed: {exc}") from exc

    return "\n\n".join(text_pages)


def extract_text_from_gridfs(file_id: str, db: Database) -> str:
    """
    Fetch a PDF from MongoDB GridFS by its file ID and extract all text.

    Accepts the file ID as a plain string and converts it to a BSON
    ObjectId internally, so callers never need to import bson directly.

    Tries each bucket in _BUCKET_NAMES_TO_TRY ('uploads' first, matching
    the Node.js GridFSBucket config) and logs which bucket the file was
    found in.  Returns an empty string if the file is not found in any
    bucket — the caller (route handler) is responsible for turning that
    into the appropriate HTTP error.

    Parameters
    ----------
    file_id : str
        MongoDB GridFS file ID as a 24-character hex ObjectId string.
    db : pymongo.database.Database
        Live MongoDB database instance (injected via FastAPI dependency).

    Returns
    -------
    str
        Concatenated text extracted from all pages of the PDF, or an
        empty string if the file was not found in any bucket.

    Raises
    ------
    ValueError
        If file_id is not a valid ObjectId string.
    RuntimeError
        If pdfplumber fails to parse the PDF bytes once the file is found.
    """
    # ── Validate and convert file_id ──────────────────────────────────────────
    try:
        object_id = ObjectId(file_id)
    except (InvalidId, TypeError) as exc:
        raise ValueError(f"'{file_id}' is not a valid ObjectId: {exc}") from exc

    # ── Try each bucket in priority order ─────────────────────────────────────
    for bucket_name in _BUCKET_NAMES_TO_TRY:
        try:
            fs = gridfs.GridFS(db, collection=bucket_name)
            if fs.exists(object_id):
                print(f"[GridFS] Found file {file_id} in bucket '{bucket_name}'")
                logger.info(
                    "[extraction] Found file %s in bucket '%s'", file_id, bucket_name
                )
                pdf_bytes = fs.get(object_id).read()
                return extract_text_from_pdf_bytes(pdf_bytes)
            else:
                logger.debug(
                    "[extraction] file %s not in bucket '%s'", file_id, bucket_name
                )
        except Exception as exc:
            # Log and continue — try the next bucket
            print(f"[GridFS] Bucket '{bucket_name}' failed: {exc}")
            logger.warning(
                "[extraction] bucket '%s' error for file %s: %s",
                bucket_name, file_id, exc,
            )
            continue

    # ── File not found in any bucket ──────────────────────────────────────────
    print(f"[GridFS] File {file_id} not found in any bucket")
    logger.warning("[extraction] file %s not found in any bucket", file_id)
    return ""
