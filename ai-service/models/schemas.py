from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    resume: str
    job_description: str

class AnalyzeResponse(BaseModel):
    score: float
