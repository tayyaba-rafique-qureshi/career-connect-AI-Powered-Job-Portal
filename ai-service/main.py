from fastapi import FastAPI
from routes.analyze import router as analyze_router

app = FastAPI(title="AI Job Match Service", version="1.0.0")

app.include_router(analyze_router)

@app.get("/health")
def health():
    return {"status": "ok"}
