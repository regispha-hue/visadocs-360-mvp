"""
Allux.ai v2.0 - FastAPI Daemon
REST API completa com todas as features

Novidades v2.0:
- Sources Vault (Fontes Externas)
- FRAG-ALL (Destilação de Sessão)
- OS-RADAR (Radar de Consistência)
- Dicionário de Invariantes
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import sys

# Adicionar diretório core ao path
sys.path.append(os.path.dirname(__file__))

# Imports dos módulos v1
from core.registry import CanonRegistry
from core.models import Artifact, Patch, ArtifactType, ArtifactStatus
from indexing.canonical_rag import CanonicalRAG

# Imports dos módulos v2
from core.sources import SourcesVault, SourceType
from core.frag import SessionDistiller, NodeLayer, NodeType
from core.invariants import InvariantsDictionary, OSRadar


# ===== FastAPI App =====

app = FastAPI(
    title="Allux.ai",
    version="2.0.0",
    description="Canon-First AI Operating System with Sources, FRAG-ALL & OS-RADAR"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Inicialização =====

registry = CanonRegistry()
rag = CanonicalRAG()
sources_vault = SourcesVault()
distiller = SessionDistiller()
invariants = InvariantsDictionary()
radar = OSRadar(invariants)


# ===== Models para API =====

class ArtifactCreate(BaseModel):
    type: ArtifactType
    title: str
    content: str
    ontology_refs: List[str] = []
    axioms: List[str] = []

class PatchCreate(BaseModel):
    artifact_id: str
    operations: List[Dict]
    tests: Optional[List[Dict]] = None

class RAGAdd(BaseModel):
    content: str
    metadata: Optional[Dict] = None

class RAGSearch(BaseModel):
    query: str
    top_k: int = 5

class SourceUploadText(BaseModel):
    content: str
    title: str
    source_type: SourceType = SourceType.TEXT
    author: Optional[str] = None
    monte: Optional[str] = None
    tags: List[str] = []

class FragSession(BaseModel):
    messages: List[Dict[str, str]]
    session_id: str
    monte: Optional[str] = None
    voz: Optional[str] = None

class RadarScan(BaseModel):
    text: str
    monte: Optional[str] = None
    voz: Optional[str] = None


# ===== Endpoints v1.0 (Mantidos) =====

@app.get("/")
def root():
    """System info"""
    return {
        "service": "Allux Daemon",
        "version": "2.0.0",
        "status": "operational",
        "components": {
            "canon_registry": "active",
            "canonical_rag": "active",
            "sources_vault": "active",
            "frag_distiller": "active",
            "os_radar": "active"
        }
    }

@app.get("/health")
def health():
    """Health check"""
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/stats")
def get_stats():
    """System statistics"""
    return {
        "registry": registry.get_stats(),
        "rag": {
            "chunks_count": len(rag.chunks)
        }
    }

@app.get("/ontology")
def get_ontology():
    """List available ontology refs"""
    return {
        "ontology_refs": [
            "desconciliacao_sagrados",
            "vacuo",
            "nexoritmo",
            "monte_i",
            "monte_ii",
            "monte_iii"
        ]
    }

# Canon Registry endpoints
@app.post("/artifacts")
def create_artifact(data: ArtifactCreate):
    """Create new artifact (draft)"""
    artifact = registry.create_artifact(
        type=data.type,
        title=data.title,
        content=data.content,
        ontology_refs=data.ontology_refs,
        axioms=data.axioms
    )
    return artifact.model_dump()

@app.get("/artifacts/{artifact_id}")
def get_artifact(artifact_id: str):
    """Get artifact by ID"""
    artifact = registry.get_artifact(artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return artifact.model_dump()

@app.post("/artifacts/{artifact_id}/promote")
def promote_artifact(artifact_id: str):
    """Promote artifact to canon"""
    result = registry.promote_to_canon(artifact_id)
    if not result:
        raise HTTPException(status_code=400, detail="Failed to promote")
    return {"status": "promoted", "artifact_id": artifact_id}

@app.post("/artifacts/{artifact_id}/freeze")
def freeze_artifact(artifact_id: str):
    """Freeze artifact (immutable)"""
    result = registry.freeze_artifact(artifact_id)
    if not result:
        raise HTTPException(status_code=400, detail="Failed to freeze")
    return {"status": "frozen", "artifact_id": artifact_id}

@app.post("/patches")
def create_patch(data: PatchCreate):
    """Create patch for artifact"""
    patch = registry.apply_patch(
        artifact_id=data.artifact_id,
        operations=data.operations,
        tests=data.tests
    )
    if not patch:
        raise HTTPException(status_code=400, detail="Patch failed (fail-closed)")
    return patch.model_dump()

@app.get("/patches/{patch_id}")
def get_patch(patch_id: str):
    """Get patch by ID"""
    # Implementar se necessário
    return {"patch_id": patch_id}

# RAG endpoints
@app.post("/rag/add")
def rag_add(data: RAGAdd):
    """Add content to RAG"""
    rag.add_to_rag(data.content, data.metadata or {})
    return {"status": "added", "chunks": len(rag.chunks)}

@app.post("/rag/search")
def rag_search(data: RAGSearch):
    """Search RAG"""
    results = rag.retrieve(data.query, top_k=data.top_k)
    return {
        "query": data.query,
        "results": results
    }


# ===== Endpoints v2.0 (NOVOS) =====

# === SOURCES VAULT ===

@app.post("/sources/upload/pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    title: str = "",
    author: str = "",
    monte: str = "",
    tags: str = ""
):
    """Upload PDF source"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    file_bytes = await file.read()
    
    source = sources_vault.upload_pdf(
        file_bytes=file_bytes,
        title=title or file.filename,
        author=author or None,
        monte=monte or None,
        tags=tags.split(",") if tags else []
    )
    
    return {
        "status": "uploaded",
        "source_id": source.source_id,
        "title": source.title,
        "page_count": source.page_count
    }

@app.post("/sources/upload/text")
def upload_text(data: SourceUploadText):
    """Upload text/markdown source"""
    source = sources_vault.upload_text(
        content=data.content,
        title=data.title,
        source_type=data.source_type,
        author=data.author,
        monte=data.monte,
        tags=data.tags
    )
    
    return {
        "status": "uploaded",
        "source_id": source.source_id,
        "title": source.title
    }

@app.get("/sources/{source_id}")
def get_source(source_id: str):
    """Get source by ID"""
    source = sources_vault.get_source(source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source.model_dump()

@app.post("/sources/search")
def search_sources(query: str, monte: str = "", limit: int = 5):
    """Search sources"""
    sources = sources_vault.search_sources(
        query=query,
        monte=monte or None,
        limit=limit
    )
    return {
        "query": query,
        "count": len(sources),
        "sources": [s.model_dump() for s in sources]
    }

@app.get("/sources")
def list_sources(monte: str = ""):
    """List all sources"""
    sources = sources_vault.list_sources(monte=monte or None)
    return {
        "count": len(sources),
        "sources": [
            {
                "source_id": s.source_id,
                "title": s.title,
                "type": s.type,
                "monte": s.monte
            }
            for s in sources
        ]
    }


# === FRAG-ALL (Session Distiller) ===

@app.post("/frag/distill")
def distill_session(data: FragSession):
    """
    FRAG-ALL: Distill chat session into knowledge nodes
    
    Transforms conversation into structured, eternal nodes
    without noise, volatility, or lost context.
    """
    nodes = distiller.distill_session(
        messages=data.messages,
        session_id=data.session_id,
        monte=data.monte,
        voz=data.voz
    )
    
    return {
        "status": "distilled",
        "session_id": data.session_id,
        "nodes_extracted": len(nodes),
        "nodes": [
            {
                "node_id": n.node_id,
                "layer": n.layer,
                "type": n.type,
                "content": n.content[:200] + "..." if len(n.content) > 200 else n.content
            }
            for n in nodes
        ]
    }

@app.get("/frag/nodes")
def get_nodes(
    layer: str = "",
    node_type: str = "",
    monte: str = "",
    limit: int = 20
):
    """Get knowledge nodes with filters"""
    from core.frag import NodeLayer, NodeType
    
    nodes = distiller.get_nodes(
        layer=NodeLayer(layer) if layer else None,
        node_type=NodeType(node_type) if node_type else None,
        monte=monte or None,
        limit=limit
    )
    
    return {
        "count": len(nodes),
        "nodes": [n.model_dump() for n in nodes]
    }

@app.post("/frag/search")
def search_nodes(query: str, limit: int = 10):
    """Search knowledge nodes"""
    nodes = distiller.search_nodes(query, limit)
    return {
        "query": query,
        "count": len(nodes),
        "nodes": [n.model_dump() for n in nodes]
    }


# === OS-RADAR (Consistency Radar) ===

@app.post("/radar/scan")
def radar_scan(data: RadarScan):
    """
    OS-RADAR: Scan text for invariant violations
    
    Checks against:
    - Kernel laws
    - Style rules (apneia, cinzel)
    - Canon facts
    - Legacy truths
    """
    report = radar.scan(
        text=data.text,
        monte=data.monte,
        voz=data.voz
    )
    
    return report.model_dump()

@app.get("/radar/invariants")
def get_invariants(
    layer: str = "",
    severity: str = "",
    monte: str = ""
):
    """List active invariants"""
    from core.invariants import InvariantLayer, Severity
    
    invs = invariants.get_invariants(
        layer=InvariantLayer(layer) if layer else None,
        severity=Severity(severity) if severity else None,
        monte=monte or None
    )
    
    return {
        "count": len(invs),
        "invariants": [
            {
                "invariant_id": i.invariant_id,
                "name": i.name,
                "layer": i.layer,
                "severity": i.severity,
                "description": i.description
            }
            for i in invs
        ]
    }


# ===== Run =====

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
