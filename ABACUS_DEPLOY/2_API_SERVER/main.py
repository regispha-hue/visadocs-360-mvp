"""Nexoritia OS - FastAPI Server | Otimizado para deploy"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from pathlib import Path
from datetime import datetime
import time
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "1_NEXORITIA_OS_CORE"))

from models import (Artifact, ArtifactCreateRequest, AuthRequest, ValidationRequest,
                    CommandRequest, SearchRequest, HealthCheck)
from canon_registry import CanonRegistry
from os_notarius import OSNotarius
from os_radar import OSRADAR

app = FastAPI(title="Nexoritia OS API", description="Sistema Operacional de Governanca IA", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

start_time = time.time()
canon_registry = CanonRegistry()
os_notarius = OSNotarius()
os_radar = OSRADAR(canon_registry)

@app.middleware("http")
async def log_requests(request, call_next):
    st = time.time()
    response = await call_next(request)
    print(f"[{datetime.now().isoformat()}] {request.method} {request.url} {response.status_code} {round((time.time()-st)*1000,2)}ms")
    return response

@app.get("/")
async def root():
    return {"status": "operational", "version": "2.0.0", "components": {"canon": "ok" if canon_registry.canon else "err", "auth": "ok", "radar": "ok"}, "uptime": int(time.time()-start_time)}

@app.get("/stats")
async def stats():
    s = canon_registry.get_stats()
    s.update({"uptime_hours": round((time.time()-start_time)/3600, 2), "api_version": "2.0.0"})
    return s

@app.get("/canon/info")
async def canon_info():
    info = canon_registry.get_canon_info()
    if not info: raise HTTPException(503, "Canon not loaded")
    return info

@app.get("/canon/axioms")
async def list_axioms(monte: str = None, priority: str = None, category: str = None, domain: str = None):
    return {"total": len(canon_registry.list_axioms(monte, priority, category, domain)),
            "axioms": canon_registry.list_axioms(monte, priority, category, domain)}

@app.post("/canon/validate")
async def validate_text(request: ValidationRequest):
    return os_radar.validate_content(request)

@app.post("/canon/artifact")
async def create_artifact(request: ArtifactCreateRequest):
    artifact = Artifact(title=request.title, type=request.type, content=request.content,
                       ontology_refs=request.ontology_refs, axioms=request.axioms, sources=request.sources)
    return {"artifact_id": canon_registry.create_artifact(artifact), "status": "created"}

@app.get("/canon/artifact/{artifact_id}")
async def get_artifact(artifact_id: str):
    artifact = canon_registry.get_artifact(artifact_id)
    if not artifact: raise HTTPException(404, "Artifact not found")
    return artifact

@app.post("/auth/authenticate")
async def authenticate(request: AuthRequest):
    try:
        proof = os_notarius.authenticate_artifact(request)
        return {"success": True, "proof": proof.dict()}
    except Exception as e:
        raise HTTPException(500, f"Authentication failed: {str(e)}")

@app.post("/auth/verify")
async def verify(content: str, proof: dict):
    from models import AuthProof
    try:
        result = os_notarius.verify_proof(content, AuthProof(**proof))
        return result.dict()
    except Exception as e:
        raise HTTPException(500, f"Verification failed: {str(e)}")

@app.get("/auth/public-key")
async def public_key():
    return os_notarius.export_public_key()

@app.get("/radar/domains")
async def domains():
    return {"domains": list(os_radar.contracts.keys()), "total": len(os_radar.contracts)}

@app.get("/version")
async def version():
    return {"system": "Nexoritia OS", "version": "2.0.0", "canon_version": canon_registry.canon.version if canon_registry.canon else None}

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════╗
║         NEXORITIA OS v2.0 - API SERVER          ║
╠══════════════════════════════════════════════════╣
║  http://localhost:8000                           ║
║  http://localhost:8000/docs                    ║
╚══════════════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8000)
