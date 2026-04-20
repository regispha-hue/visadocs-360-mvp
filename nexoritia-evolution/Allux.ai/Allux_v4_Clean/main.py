from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Allux.ai",
    version="4.0.0",
    description="Kernel Never Hallucinates"
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "kernel": "allux_v4",
        "mode": "minimal",
        "hallucination": False
    }

@app.get("/ping")
def ping():
    return JSONResponse(
        content={"pong": True},
        status_code=200
    )

