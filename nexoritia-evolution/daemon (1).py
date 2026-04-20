"""
Allux Daemon - FastAPI REST API
Complete ontological governance system

Integrates:
- Canon Registry (Phase 1)
- Canonical RAG (Phase 2 - migrated from LDMux)
- Import/Indexing capabilities
- Search and retrieval

Endpoints:
- Artifact CRUD
- Patch management
- RAG operations
- Search
- Statistics
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from core.registry import CanonRegistry
from core.models import (
    Artifact, Patch, PatchTests, Source, Operation,
    ArtifactType, ArtifactStatus, PatchOperation, TestResult, ProposedBy
)
from indexing.canonical_rag import CanonicalRAG, RAGConfig


app = FastAPI(
    title="Allux API",
    description="Canon-first ontological AI governance",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
registry = CanonRegistry()
rag = CanonicalRAG()


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class CreateArtifactRequest(BaseModel):
    type: ArtifactType
    title: str
    content: str
    ontology_refs: List[str] = []
    axioms: List[str] = []


class CreatePatchRequest(BaseModel):
    target_artifact_id: str
    base_hash: str
    operations: List[Operation]
    proposed_by: ProposedBy = ProposedBy.HUMAN
    tests: Optional[PatchTests] = None


class RAGQueryRequest(BaseModel):
    query: str
    mode: str = "core"
    limit: int = 10


class RAGAddRequest(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None


# ============================================
# HEALTH & INFO
# ============================================

@app.get("/")
def root():
    return {
        "service": "Allux Daemon",
        "version": "1.0.0",
        "status": "operational",
        "components": {
            "canon_registry": "active",
            "canonical_rag": "active",
            "assembler": "pending",
            "os_auth": "pending",
            "os_trslate": "pending"
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/stats")
def get_stats():
    """System statistics"""
    registry_stats = registry.get_stats()
    rag_stats = rag.get_stats()
    
    return {
        "registry": registry_stats,
        "rag": rag_stats,
        "timestamp": datetime.now().isoformat()
    }


# ============================================
# ARTIFACT ENDPOINTS
# ============================================

@app.post("/artifacts", response_model=Artifact)
def create_artifact(req: CreateArtifactRequest):
    """Create new artifact in DRAFT status"""
    artifact = Artifact(
        artifact_id="",  # Will be auto-generated
        type=req.type,
        title=req.title,
        content=req.content,
        ontology_refs=req.ontology_refs,
        axioms=req.axioms
    )
    
    return registry.create_artifact(artifact)


@app.get("/artifacts/{artifact_id}", response_model=Artifact)
def get_artifact(artifact_id: str, version: Optional[str] = None):
    """Retrieve artifact by ID (optionally specific version)"""
    artifact = registry.get_artifact(artifact_id, version)
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    return artifact


@app.get("/artifacts", response_model=List[Artifact])
def search_artifacts(q: str, limit: int = 10):
    """Full-text search artifacts"""
    return registry.search_artifacts(q, limit)


@app.post("/artifacts/{artifact_id}/promote")
def promote_artifact(artifact_id: str):
    """Promote DRAFT to CANON"""
    try:
        artifact = registry.promote_to_canon(artifact_id)
        return {"status": "promoted", "artifact": artifact}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/artifacts/{artifact_id}/freeze")
def freeze_artifact(artifact_id: str):
    """Freeze artifact (immutable)"""
    try:
        artifact = registry.freeze_artifact(artifact_id)
        return {"status": "frozen", "artifact": artifact}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================
# PATCH ENDPOINTS
# ============================================

@app.post("/patches", response_model=Patch)
def create_patch(req: CreatePatchRequest):
    """Create patch proposal"""
    tests = req.tests or PatchTests()
    
    patch = Patch(
        patch_id=f"patch_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        target_artifact_id=req.target_artifact_id,
        base_hash=req.base_hash,
        operations=req.operations,
        proposed_by=req.proposed_by,
        tests=tests
    )
    
    try:
        return registry.create_patch(patch)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/patches/{patch_id}/apply")
def apply_patch(patch_id: str):
    """Apply patch (fail-closed: rejects if any test fails)"""
    try:
        artifact = registry.apply_patch(patch_id)
        return {
            "status": "applied",
            "artifact": artifact,
            "message": "Patch applied successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================
# RAG ENDPOINTS
# ============================================

@app.post("/rag/add")
def rag_add_document(req: RAGAddRequest):
    """Add document to canonical RAG corpus"""
    result = rag.add(req.content, req.metadata)
    return {
        "status": "added",
        "result": result
    }


@app.post("/rag/search")
def rag_search(req: RAGQueryRequest):
    """Search RAG corpus with fail-closed principle"""
    if req.mode == "dual":
        results = rag.retrieve_dual(req.query)
        return {
            "query": req.query,
            "results": results,
            "mode": "dual"
        }
    else:
        results = rag.retrieve(req.query, req.mode, req.limit)
        return {
            "query": req.query,
            "results": [
                {
                    "content": r.content,
                    "score": r.score,
                    "metadata": r.metadata,
                    "mode": r.mode
                }
                for r in results
            ],
            "mode": req.mode,
            "threshold": rag.config.threshold_core if req.mode == "core" else rag.config.threshold_echo
        }


@app.get("/rag/stats")
def rag_get_stats():
    """RAG corpus statistics"""
    return rag.get_stats()


@app.delete("/rag/corpus")
def rag_clear_corpus():
    """Clear RAG corpus (DANGEROUS - use with caution)"""
    rag.clear()
    return {"status": "cleared", "message": "RAG corpus cleared"}


# ============================================
# MAIN
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
