import os
import io
import pdfplumber
import pymongo
import gridfs
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# ─── MongoDB + GridFS connection ──────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
_client = None
_fs = None

def get_fs():
    global _client, _fs
    if _fs is None:
        _client = pymongo.MongoClient(MONGO_URI)
        # Extract DB name from URI or default to job_portal_db
        db_name = MONGO_URI.split("/")[-1].split("?")[0] or "job_portal_db"
        db = _client[db_name]
        _fs = gridfs.GridFS(db, collection="uploads")
    return _fs

# ─── Request schema ───────────────────────────────────────────────────────────
class ExtractRequest(BaseModel):
    fileId: str

# ─── POST /api/extract-resume ─────────────────────────────────────────────────
@router.post("/extract-resume")
def extract_resume(payload: ExtractRequest):
    """
    Fetches a PDF from MongoDB GridFS by fileId,
    extracts all text using pdfplumber,
    and returns the raw text for AI matching.
    """
    try:
        fs = get_fs()
        file_obj = fs.get(ObjectId(payload.fileId))
        pdf_bytes = file_obj.read()
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"File not found in GridFS: {str(e)}")

    try:
        text_pages = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_pages.append(page_text.strip())

        extracted_text = "\n\n".join(text_pages)

        if not extracted_text.strip():
            # PDF exists but has no extractable text (scanned image PDF)
            return {
                "success": True,
                "extractedText": "",
                "warning": "PDF appears to be image-based. Text extraction returned empty."
            }

        return {
            "success": True,
            "extractedText": extracted_text
        }

    except Exception as e:
        # Extraction failed — still return success=False so backend can fallback
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")
