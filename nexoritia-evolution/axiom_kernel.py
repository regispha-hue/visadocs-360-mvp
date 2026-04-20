"""
LDMux-OS Axiom Seal Endpoint
Implementação do endpoint /axiom/seal para selar e verificar axiomas.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
import hashlib
import json
from datetime import datetime
from pathlib import Path

app = FastAPI(title="LDMux-OS Axiom Kernel", version="1.0.0")

# Carregar Canon congelado
CANON_PATH = Path(__file__).parent / "CANON_V1.0.json"

def load_canon():
    """Carrega o Canon congelado."""
    if not CANON_PATH.exists():
        return None
    with open(CANON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

CANON = load_canon()


class SealRequest(BaseModel):
    """Request para selar um axioma."""
    text: str = Field(..., description="Texto do axioma a ser selado")
    domain: str = Field(default="general", description="Domínio ontológico do axioma")
    category: Optional[str] = Field(default=None, description="Categoria do axioma")
    priority: Literal["critical", "high", "medium", "low"] = Field(default="medium")


class SealResponse(BaseModel):
    """Response do seal."""
    text: str
    hash: str
    domain: str
    category: Optional[str]
    priority: str
    kernel_version: str
    sealed_at: str
    canon_match: Optional[dict] = None


class VerifyRequest(BaseModel):
    """Request para verificar um axioma."""
    hash: str = Field(..., description="Hash SHA256 do axioma")
    kernel_version: Optional[str] = Field(default="1.0.0", description="Versão do kernel")


class VerifyResponse(BaseModel):
    """Response da verificação."""
    valid: bool
    coherent: bool
    reason: str
    axiom: Optional[dict] = None
    canon_info: Optional[dict] = None


def compute_hash(text: str) -> str:
    """Computa hash SHA256 de um texto."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def find_axiom_in_canon(text_hash: str) -> Optional[tuple]:
    """Busca axioma no Canon pelo hash."""
    if not CANON:
        return None
    
    for key, axiom in CANON["axioms"].items():
        if axiom["hash"] == text_hash:
            return (key, axiom)
    return None


@app.get("/ping")
def ping():
    """Health check."""
    return {
        "status": "active",
        "kernel": "LDMux-OS",
        "version": "1.0.0",
        "canon_loaded": CANON is not None,
        "canon_axioms": len(CANON["axioms"]) if CANON else 0
    }


@app.post("/axiom/seal", response_model=SealResponse)
def seal_axiom(request: SealRequest):
    """
    Sela um axioma gerando seu hash SHA256.
    Verifica se o axioma já existe no Canon.
    """
    # Normalizar texto (remover espaços extras)
    normalized_text = " ".join(request.text.split())
    
    # Gerar hash
    axiom_hash = compute_hash(normalized_text)
    
    # Buscar no Canon
    canon_match = None
    if CANON:
        match = find_axiom_in_canon(axiom_hash)
        if match:
            key, canon_axiom = match
            canon_match = {
                "key": key,
                "id": canon_axiom["id"],
                "monte": canon_axiom["monte"],
                "canonical": True
            }
    
    return SealResponse(
        text=normalized_text,
        hash=axiom_hash,
        domain=request.domain,
        category=request.category,
        priority=request.priority,
        kernel_version="1.0.0",
        sealed_at=datetime.utcnow().isoformat() + "Z",
        canon_match=canon_match
    )


@app.post("/axiom/verify", response_model=VerifyResponse)
def verify_axiom(request: VerifyRequest):
    """
    Verifica se um hash corresponde a um axioma válido no Canon.
    """
    if not CANON:
        raise HTTPException(status_code=503, detail="Canon not loaded")
    
    # Buscar axioma
    match = find_axiom_in_canon(request.hash)
    
    if not match:
        return VerifyResponse(
            valid=False,
            coherent=False,
            reason="Hash not found in Canon",
            axiom=None,
            canon_info=None
        )
    
    key, axiom = match
    
    # Verificar versão do kernel
    coherent = True
    reason = "Valid canonical axiom"
    
    if request.kernel_version != "1.0.0":
        coherent = False
        reason = f"Kernel version mismatch: expected 1.0.0, got {request.kernel_version}"
    
    return VerifyResponse(
        valid=True,
        coherent=coherent,
        reason=reason,
        axiom={
            "key": key,
            "id": axiom["id"],
            "text": axiom["text"],
            "domain": axiom["domain"],
            "category": axiom["category"],
            "priority": axiom["priority"],
            "monte": axiom["monte"]
        },
        canon_info={
            "version": CANON["version"],
            "author": CANON["author"],
            "work": CANON["work"],
            "frozen_at": CANON["frozen_at"],
            "manifest_hash": CANON["manifest_hash"]
        }
    )


@app.get("/canon/info")
def canon_info():
    """Retorna informações sobre o Canon carregado."""
    if not CANON:
        raise HTTPException(status_code=503, detail="Canon not loaded")
    
    return {
        "version": CANON["version"],
        "author": CANON["author"],
        "work": CANON["work"],
        "frozen_at": CANON["frozen_at"],
        "activation_code": CANON["activation_code"],
        "total_axioms": CANON["total_axioms"],
        "manifest_hash": CANON["manifest_hash"],
        "metadata": CANON["metadata"]
    }


@app.get("/canon/axioms")
def list_axioms(
    monte: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None
):
    """Lista axiomas do Canon com filtros opcionais."""
    if not CANON:
        raise HTTPException(status_code=503, detail="Canon not loaded")
    
    axioms = CANON["axioms"]
    
    # Aplicar filtros
    if monte:
        axioms = {k: v for k, v in axioms.items() if v["monte"] == monte}
    if priority:
        axioms = {k: v for k, v in axioms.items() if v["priority"] == priority}
    if category:
        axioms = {k: v for k, v in axioms.items() if v["category"] == category}
    
    return {
        "total": len(axioms),
        "filters": {
            "monte": monte,
            "priority": priority,
            "category": category
        },
        "axioms": axioms
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
