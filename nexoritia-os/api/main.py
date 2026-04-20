"""
Nexoritia OS - API Principal
FastAPI server com todos os endpoints integrados
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import json
from pathlib import Path
from datetime import datetime
import time

# Importar componentes do OS
from ..core.canon_registry import CanonRegistry
from ..core.os_notarius import OSNotarius
from ..core.os_radar import OSRADAR
from ..core.models import (
    Artifact, ArtifactCreateRequest, AuthRequest, AuthVerification,
    ValidationRequest, CommandRequest, SearchRequest,
    HealthCheck, StatsResponse
)

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Nexoritia OS API",
    description="Sistema Operacional de Governança IA",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Arquivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

# ============================================================================
# INICIALIZAÇÃO DO OS
# ============================================================================

# Inicializar componentes
canon_registry = CanonRegistry()
os_notarius = OSNotarius()
os_radar = OSRADAR(canon_registry)

# Variáveis globais para stats
start_time = time.time()

# ============================================================================
# MIDDLEWARE DE LOGGING
# ============================================================================

@app.middleware("http")
async def log_requests(request, call_next):
    """Middleware para logging de requisições"""
    start_time_req = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time_req
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "process_time_ms": round(process_time * 1000, 2),
        "user_agent": request.headers.get("user-agent"),
        "remote_addr": request.client.host if request.client else None
    }
    
    # Log simples (poderia ser enviado para sistema de logs)
    print(f"🔍 API Request: {json.dumps(log_data)}")
    
    return response

# ============================================================================
# ENDPOINTS PRINCIPAIS
# ============================================================================

@app.get("/", response_model=HealthCheck)
async def root():
    """Health check do sistema"""
    uptime_seconds = int(time.time() - start_time)
    
    return HealthCheck(
        status="operational",
        version="2.0.0",
        components={
            "canon_registry": "operational" if canon_registry.canon else "error",
            "os_notarius": "operational",
            "os_radar": "operational",
            "database": "operational"
        },
        uptime_seconds=uptime_seconds,
        memory_usage_mb=0.0  # TODO: Implementar monitoramento
    )


@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Estatísticas completas do sistema"""
    stats = canon_registry.get_stats()
    
    # Adicionar stats específicos do OS
    stats.update({
        "os_notarius_keys": os_notarius.get_key_info(),
        "os_radar_domains": len(os_radar.contracts),
        "uptime_hours": round((time.time() - start_time) / 3600, 2),
        "api_version": "2.0.0"
    })
    
    return StatsResponse(**stats)


# ============================================================================
# CANON ENDPOINTS
# ============================================================================

@app.get("/canon/info")
async def get_canon_info():
    """Informações do Canon carregado"""
    info = canon_registry.get_canon_info()
    if not info:
        raise HTTPException(status_code=503, detail="Canon not loaded")
    return info


@app.get("/canon/axioms")
async def list_axioms(
    monte: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    domain: Optional[str] = None
):
    """Lista axiomas do Canon com filtros"""
    axioms = canon_registry.list_axioms(monte, priority, category, domain)
    return {
        "total": len(axioms),
        "filters": {
            "monte": monte,
            "priority": priority,
            "category": category,
            "domain": domain
        },
        "axioms": axioms
    }


@app.post("/canon/validate")
async def validate_text(request: ValidationRequest):
    """Valida texto contra Canon e contratos semânticos"""
    validation = os_radar.validate_content(request)
    return validation


@app.post("/canon/artifact", response_model=Dict[str, str])
async def create_artifact(request: ArtifactCreateRequest):
    """Cria novo artifact no Canon Registry"""
    artifact = Artifact(
        title=request.title,
        type=request.type,
        content=request.content,
        ontology_refs=request.ontology_refs,
        axioms=request.axioms,
        sources=request.sources
    )
    
    artifact_id = canon_registry.create_artifact(artifact)
    
    return {
        "artifact_id": artifact_id,
        "message": "Artifact created successfully",
        "status": "created"
    }


@app.get("/canon/artifact/{artifact_id}")
async def get_artifact(artifact_id: str):
    """Busca artifact por ID"""
    artifact = canon_registry.get_artifact(artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return artifact


@app.post("/canon/search")
async def search_artifacts(request: SearchRequest):
    """Busca full-text em artifacts"""
    results = canon_registry.search_artifacts(
        query=request.query,
        limit=request.limit,
        offset=request.offset
    )
    return results


# ============================================================================
# AUTH-AI ENDPOINTS
# ============================================================================

@app.post("/auth/authenticate")
async def authenticate_artifact(request: AuthRequest):
    """Gera prova AUTH-AI para artifact"""
    try:
        proof = os_notarius.authenticate_artifact(request)
        return {
            "success": True,
            "proof": proof.dict(),
            "message": "Artifact authenticated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


@app.post("/auth/verify")
async def verify_proof(content: str, proof: Dict[str, Any]):
    """Verifica prova AUTH-AI"""
    try:
        from ..core.models import AuthProof
        auth_proof = AuthProof(**proof)
        verification = os_notarius.verify_proof(content, auth_proof)
        return verification.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@app.get("/auth/public-key")
async def get_public_key():
    """Retorna chave pública para verificação"""
    return os_notarius.export_public_key()


@app.post("/auth/batch")
async def batch_authenticate(artifacts: List[Dict[str, Any]]):
    """Autenticação em lote"""
    try:
        proofs = os_notarius.batch_authenticate(artifacts)
        return {
            "success": True,
            "total_processed": len(artifacts),
            "proofs": [proof.dict() for proof in proofs],
            "message": f"Successfully authenticated {len(artifacts)} artifacts"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch authentication failed: {str(e)}")


# ============================================================================
# OS-RADAR ENDPOINTS
# ============================================================================

@app.get("/radar/domains")
async def list_domains():
    """Lista domínios de validação disponíveis"""
    return {
        "domains": list(os_radar.contracts.keys()),
        "total": len(os_radar.contracts),
        "default_domain": "geral"
    }


@app.get("/radar/stats/{domain}")
async def get_domain_stats(domain: str):
    """Estatísticas de validação por domínio"""
    if domain not in os_radar.contracts:
        raise HTTPException(status_code=404, detail=f"Domain '{domain}' not found")
    
    stats = os_radar.get_domain_stats(domain)
    return stats


@app.post("/radar/validate")
async def validate_with_radar(request: ValidationRequest):
    """Validação avançada com OS-RADAR"""
    validation = os_radar.validate_content(request)
    
    # Ação Fail-Closed
    action = os_radar.fail_closed_action(validation.violations)
    
    return {
        "validation": validation.dict(),
        "fail_closed_action": action,
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# OS-AGENT ENDPOINTS (Placeholder para implementação futura)
# ============================================================================

@app.post("/agent/execute")
async def execute_command(request: CommandRequest):
    """Executa comando via OS-Agent"""
    # TODO: Implementar integração com OS-Agent
    return {
        "success": False,
        "message": "OS-Agent not yet implemented",
        "command": request.command
    }


@app.get("/agent/status")
async def get_agent_status():
    """Status do OS-Agent"""
    # TODO: Implementar monitoramento do agente
    return {
        "status": "not_implemented",
        "message": "OS-Agent coming in v2.1"
    }


# ============================================================================
# UTILITIES
# ============================================================================

@app.get("/version")
async def get_version():
    """Informações de versão do sistema"""
    return {
        "system": "Nexoritia OS",
        "version": "2.0.0",
        "build_date": datetime.now().isoformat(),
        "canon_version": canon_registry.canon.version if canon_registry.canon else None,
        "components": {
            "canon_registry": "v1.0",
            "os_notarius": "v1.0",
            "os_radar": "v1.0",
            "os_agent": "v0.0 (planned)"
        }
    }


@app.get("/health/detailed")
async def detailed_health():
    """Health check detalhado com componentes"""
    components_status = {}
    
    # Verificar Canon
    components_status["canon"] = {
        "status": "operational" if canon_registry.canon else "error",
        "axioms_loaded": len(canon_registry.canon.axioms) if canon_registry.canon else 0,
        "version": canon_registry.canon.version if canon_registry.canon else None
    }
    
    # Verificar AUTH-AI
    key_info = os_notarius.get_key_info()
    components_status["auth_ai"] = {
        "status": "operational" if key_info["private_key_exists"] else "error",
        "keys_exist": key_info["private_key_exists"] and key_info["public_key_exists"],
        "fingerprint": key_info.get("key_fingerprint")
    }
    
    # Verificar OS-RADAR
    components_status["os_radar"] = {
        "status": "operational",
        "domains_loaded": len(os_radar.contracts),
        "memory_entries": len(os_radar.memory.validation_history)
    }
    
    # Status geral
    all_operational = all(
        comp["status"] == "operational" 
        for comp in components_status.values()
    )
    
    return {
        "overall_status": "operational" if all_operational else "degraded",
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": int(time.time() - start_time),
        "components": components_status
    }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Resource not found", "path": str(request.url.path)}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════╗
║                    NEXORITIA OS v2.0                          ║
╠══════════════════════════════════════════════════════════════╣
║  Sistema Operacional de Governança IA                           ║
║  Canon Registry • OS-RADAR • OS-Notarius • OS-Agent          ║
║  Fail-Closed • Determinístico • Imutável                      ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    print("🌐 Iniciando servidor API...")
    print("📚 Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health/detailed")
    print("📊 Statistics: http://localhost:8000/stats")
    print("🔐 AUTH-AI: http://localhost:8000/auth/public-key")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )
