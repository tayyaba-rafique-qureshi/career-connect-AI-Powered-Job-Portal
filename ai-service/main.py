import os
from dotenv import load_dotenv
load_dotenv()  # load ai-service/.env before anything else

from fastapi import FastAPI
from routes.analyze import router as analyze_router
from routes.resume import router as resume_router

app = FastAPI(title="CareerConnect AI Service", version="1.0.0")

app.include_router(analyze_router)
app.include_router(resume_router, prefix="/api", tags=["resume"])

@app.get("/health")
def health():
    return {"status": "ok"}
