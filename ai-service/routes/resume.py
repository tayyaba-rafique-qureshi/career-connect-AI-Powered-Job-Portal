"""
routes/resume.py
----------------
Resume PDF text extraction endpoint for the CareerConnect AI service.

POST /api/ai/extract-resume
  Accepts either:
    { "file_id": "<gridfs-object-id>" }           ← preferred (Node.js onboarding flow)
    { "applicant_id": "<mongo-user-id>" }          ← fallback (manual testing via /docs)
    { "file_id": "...", "applicant_id": "..." }    ← both: fetch by file_id, save to user

  When file_id is provided the PDF is fetched directly from GridFS — no user
  lookup required.  This solves the timing problem where the Node.js controller
  has the fileId immediately after the GridFS upload but has not yet persisted
  it to the user document.

  When only applicant_id is provided the handler looks up the user document to
  find their stored fileId, then fetches from GridFS.

  extract_text_from_gridfs() tries the 'uploads' bucket first (matching the
  Node.js GridFSBucket config) then falls back to 'fs' and 'resumes' so the
  endpoint never returns 404 due to a bucket name mismatch.

  Returns:
    { "success": true, "message": "...", "characterCount": N, "preview": "..." }

  Returns 400 if neither field is provided or the PDF is image-based.
  Returns 404 if the GridFS file is not found in any bucket.
"""

import logging

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from models.schemas import ExtractRequest
from routes.analyze import get_db
from services.extraction import extract_text_from_gridfs

logger = logging.getLogger(__name__)

router = APIRouter()


# ── POST /api/ai/extract-resume ───────────────────────────────────────────────

@router.post("/extract-resume")
def extract_resume(payload: ExtractRequest, db: Database = Depends(get_db)):
    """
    Extract text from a PDF resume stored in MongoDB GridFS.

    Path A — file_id provided (Node.js onboarding flow)
    -------------------------------------------------------
    1. Validate file_id as a MongoDB ObjectId.
    2. Call extract_text_from_gridfs() — tries 'uploads' bucket first,
       then 'fs' and 'resumes' as fallbacks.
    3. Return 404 if the file was not found in any bucket.
    4. Return 400 if the PDF contains no extractable text.
    5. If applicant_id is also provided, save rawText to the user document.
    6. Return { success, message, characterCount, preview }.

    Path B — only applicant_id provided (manual testing)
    -------------------------------------------------------
    1. Validate applicant_id as a MongoDB ObjectId.
    2. Look up the user document to find their stored fileId.
    3. Call extract_text_from_gridfs() with that fileId.
    4. Return 404 if the file was not found in any bucket.
    5. Return 400 if the PDF contains no extractable text.
    6. Save rawText to user.applicantProfile.resume.rawText.
    7. Return { success, message, characterCount, preview }.
    """
    # ── Validate: at least one identifier must be present ────────────────────
    if not payload.file_id and not payload.applicant_id:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'file_id' (GridFS ObjectId) or 'applicant_id'.",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # PATH A: file_id provided — fetch directly, skip user lookup
    # ─────────────────────────────────────────────────────────────────────────
    if payload.file_id:
        print(f"[extract-resume] Path A — file_id={payload.file_id}")

        # extract_text_from_gridfs returns "" if not found in any bucket
        try:
            extracted_text = extract_text_from_gridfs(payload.file_id, db)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        except RuntimeError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

        if not extracted_text:
            raise HTTPException(
                status_code=404,
                detail=f"GridFS file '{payload.file_id}' not found in any bucket.",
            )

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail=(
                    "PDF was opened successfully but contains no extractable text. "
                    "This usually means the resume is a scanned image. "
                    "Please upload a text-based PDF."
                ),
            )

        char_count = len(extracted_text)
        preview    = extracted_text[:200].replace("\n", " ")
        print(f"[extract-resume] file_id={payload.file_id} chars={char_count}")

        # If applicant_id is also provided, save rawText to the user document
        if payload.applicant_id:
            try:
                applicant_oid = ObjectId(payload.applicant_id)
                db["users"].update_one(
                    {"_id": applicant_oid},
                    {"$set": {"applicantProfile.resume.rawText": extracted_text}},
                )
                print(
                    f"[extract-resume] saved rawText for applicant {payload.applicant_id}"
                )
            except Exception as exc:
                # Non-fatal — text was extracted; just log the save failure
                logger.warning(
                    "[extract-resume] failed to save rawText for applicant %s: %s",
                    payload.applicant_id, exc,
                )

        return {
            "success":        True,
            "message":        "Resume text extracted successfully",
            "characterCount": char_count,
            "preview":        preview,
        }

    # ─────────────────────────────────────────────────────────────────────────
    # PATH B: applicant_id only — look up user, then fetch by stored fileId
    # ─────────────────────────────────────────────────────────────────────────
    print(f"[extract-resume] Path B — applicant_id={payload.applicant_id}")

    # Validate applicant_id
    try:
        applicant_oid = ObjectId(payload.applicant_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid applicant_id: '{payload.applicant_id}' is not a valid ObjectId.",
        )

    # Fetch user document
    user = db["users"].find_one({"_id": applicant_oid})
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"Applicant '{payload.applicant_id}' not found.",
        )

    # Read stored fileId
    resume_info = (user.get("applicantProfile") or {}).get("resume") or {}
    raw_file_id = resume_info.get("fileId") or resume_info.get("gridfsId")

    if not raw_file_id:
        raise HTTPException(
            status_code=404,
            detail="No resume file found for this applicant. Please upload a PDF first.",
        )

    # Extract text via the shared helper (tries all buckets)
    try:
        extracted_text = extract_text_from_gridfs(str(raw_file_id), db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not extracted_text:
        raise HTTPException(
            status_code=404,
            detail=f"GridFS file '{raw_file_id}' not found in any bucket.",
        )

    if not extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "PDF was opened successfully but contains no extractable text. "
                "This usually means the resume is a scanned image. "
                "Please upload a text-based PDF."
            ),
        )

    # Persist rawText to MongoDB
    db["users"].update_one(
        {"_id": applicant_oid},
        {"$set": {"applicantProfile.resume.rawText": extracted_text}},
    )

    char_count = len(extracted_text)
    preview    = extracted_text[:200].replace("\n", " ")
    print(f"[extract-resume] applicant_id={payload.applicant_id} chars={char_count}")

    return {
        "success":        True,
        "message":        "Resume text extracted successfully",
        "characterCount": char_count,
        "preview":        preview,
    }
