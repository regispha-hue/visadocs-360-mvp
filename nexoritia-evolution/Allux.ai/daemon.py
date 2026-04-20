"""
Allux Daemon
Version: 1.0.0

Local FastAPI server for Allux operations.
Offline-first, sovereign, portable.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from pathlib import Path

from core.models import (
    Artifact, ArtifactType, ArtifactStatus,
    Patch, PatchTests, TestResult, Operation, ProposedBy,
    Source, SourceType
)
from core.registry import CanonRegistry


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Allux Daemon",
    description="Local ontology core & canon governance system",
    version="1.0.0"
)

# Initialize Canon Registry
registry = CanonRegistry(db_path="data/allux_canon.db")


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ArtifactCreateRequest(BaseModel):
    """Request to create new artifact"""
    title: str
    type: ArtifactType
    content: str
    sources: List[Source]
    ontology_refs: List[str] = []
    axioms: List[str] = []


class PatchCreateRequest(BaseModel):
    """Request to create patch"""
    patch_id: str
    target_artifact_id: str
    operations: List[Operation]
    proposed_by: ProposedBy
    
    # Test results (would come from validators in full system)
    conformance: TestResult = TestResult.PASS
    ontology: TestResult = TestResult.PASS
    editorial: TestResult = TestResult.PASS


class PromoteRequest(BaseModel):
    """Request to promote artifact to canon"""
    artifact_id: str


class FreezeRequest(BaseModel):
    """Request to freeze artifact"""
    artifact_id: str


class SearchRequest(BaseModel):
    """Search query"""
    query: str
    limit: int = 10


# ============================================================================
# CANON REGISTRY ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    """Health check"""
    return {
        "service": "Allux Daemon",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/stats")
def get_stats():
    """Get Canon Registry statistics"""
    return registry.get_stats()


@app.post("/canon/artifact", response_model=Artifact)
def create_artifact(req: ArtifactCreateRequest):
    """
    Create new artifact in Canon Registry.
    
    Rules:
    - Starts as DRAFT
    - Must have at least one source
    - artifact_id auto-generated from title
    """
    from core.models import generate_artifact_id
    
    artifact_id = generate_artifact_id(req.title, req.type)
    
    artifact = Artifact(
        artifact_id=artifact_id,
        type=req.type,
        title=req.title,
        version="1.0.0",  # First version
        status=ArtifactStatus.DRAFT,
        content=req.content,
        sources=req.sources,
        ontology_refs=req.ontology_refs,
        axioms=req.axioms
    )
    
    try:
        created = registry.create_artifact(artifact)
        return created
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/canon/artifact/{artifact_id}", response_model=Artifact)
def get_artifact(artifact_id: str, version: Optional[str] = None):
    """Get artifact by ID and optional version"""
    artifact = registry.get_artifact(artifact_id, version)
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    return artifact


@app.get("/canon/artifacts", response_model=List[Artifact])
def list_artifacts(
    status: Optional[ArtifactStatus] = None,
    type: Optional[ArtifactType] = None
):
    """List artifacts with optional filters"""
    return registry.list_artifacts(status=status, type=type)


@app.post("/canon/artifact/promote", response_model=Artifact)
def promote_artifact(req: PromoteRequest):
    """
    Promote artifact from DRAFT to CANON.
    
    Rules:
    - Only drafts can be promoted
    - Validation should happen before this call
    """
    try:
        return registry.promote_to_canon(req.artifact_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/canon/artifact/freeze", response_model=Artifact)
def freeze_artifact(req: FreezeRequest):
    """
    Freeze artifact (make immutable).
    
    Rules:
    - Only canon artifacts can be frozen
    - Frozen artifacts cannot be modified
    """
    try:
        return registry.freeze_artifact(req.artifact_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# PATCH ENDPOINTS
# ============================================================================

@app.post("/canon/patch", response_model=Patch)
def create_patch(req: PatchCreateRequest):
    """
    Create patch proposal.
    
    Rules:
    - Target artifact must exist
    - base_hash computed from current artifact
    - Tests must pass for application
    """
    # Get current artifact to get base_hash
    artifact = registry.get_artifact(req.target_artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Target artifact not found")
    
    patch = Patch(
        patch_id=req.patch_id,
        target_artifact_id=req.target_artifact_id,
        base_hash=artifact.hash,
        operations=req.operations,
        proposed_by=req.proposed_by,
        tests=PatchTests(
            conformance=req.conformance,
            ontology=req.ontology,
            editorial=req.editorial
        )
    )
    
    try:
        return registry.create_patch(patch)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/canon/patch/{patch_id}/apply", response_model=Artifact)
def apply_patch(patch_id: str):
    """
    Apply patch to artifact.
    
    Rules:
    - All tests must PASS (fail-closed)
    - Creates new version
    - Original unchanged
    """
    try:
        return registry.apply_patch(patch_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# SEARCH ENDPOINTS
# ============================================================================

@app.post("/search/artifacts", response_model=List[Artifact])
def search_artifacts(req: SearchRequest):
    """Full-text search across artifacts"""
    return registry.search_artifacts(req.query, req.limit)


# ============================================================================
# IMPORT ENDPOINTS (Placeholders for Phase 2)
# ============================================================================

@app.post("/import/chat")
async def import_chat(file: UploadFile = File(...)):
    """
    Import chat export (HTML/JSON).
    
    TODO: Implement in Phase 2
    - Parse HTML/JSON
    - Extract content
    - Store in sources table
    - Index for search
    """
    return {
        "status": "not_implemented",
        "message": "Chat import will be implemented in Phase 2",
        "filename": file.filename
    }


@app.post("/import/document")
async def import_document(file: UploadFile = File(...)):
    """
    Import document (PDF/DOCX/MD).
    
    TODO: Implement in Phase 2
    - Extract text
    - Store in sources table
    - Index for search
    """
    return {
        "status": "not_implemented",
        "message": "Document import will be implemented in Phase 2",
        "filename": file.filename
    }


# ============================================================================
# BUILD ENDPOINTS (Placeholders for Phase 4)
# ============================================================================

@app.post("/build/typst/{artifact_id}")
def build_typst(artifact_id: str):
    """
    Build artifact to PDF using Typst.
    
    TODO: Implement in Phase 4
    - Get artifact
    - Convert to Typst
    - Compile to PDF
    - Return download link
    """
    return {
        "status": "not_implemented",
        "message": "Typst assembler will be implemented in Phase 4",
        "artifact_id": artifact_id
    }


# ============================================================================
# AUTH ENDPOINTS (Placeholders for Phase 5)
# ============================================================================

@app.post("/auth/proof/{artifact_id}")
def create_auth_proof(artifact_id: str):
    """
    Create cryptographic proof for artifact.
    
    TODO: Implement in Phase 5
    - Get artifact hash
    - Sign with Ed25519
    - Generate JSON proof
    - Optional: anchor to blockchain/TSA
    """
    return {
        "status": "not_implemented",
        "message": "OS-AUTH will be implemented in Phase 5",
        "artifact_id": artifact_id
    }


# ============================================================================
# MAIN
# ============================================================================

def start_daemon(host: str = "127.0.0.1", port: int = 8000):
    """Start Allux daemon"""
    print(f"""
    ╔══════════════════════════════════════╗
    ║        ALLUX DAEMON v1.0.0          ║
    ╠══════════════════════════════════════╣
    ║  Local Ontology Core                ║
    ║  Canon Governance System            ║
    ║  Offline-First • Sovereign          ║
    ╚══════════════════════════════════════╝
    
    🌐 Server: http://{host}:{port}
    📚 Docs:   http://{host}:{port}/docs
    🔍 Stats:  http://{host}:{port}/stats
    
    Press CTRL+C to stop
    """)
    
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    start_daemon()
