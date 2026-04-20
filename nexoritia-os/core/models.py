"""
Nexoritia OS - Core Models
Pydantic models for the entire OS architecture
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum


class AxiomPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ArtifactType(str, Enum):
    CHAPTER = "chapter"
    POP = "pop"
    CERTIFICATE = "certificate"
    TRAINING = "training"
    DOCUMENT = "document"


class ArtifactStatus(str, Enum):
    DRAFT = "draft"
    VALIDATING = "validating"
    VALIDATED = "validated"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class TestResult(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    PENDING = "pending"


class SourceType(str, Enum):
    CHAT = "chat"
    FILE = "file"
    WEB = "web"
    API = "api"


class ProposedBy(str, Enum):
    HUMAN = "human"
    LLM = "llm"
    SYSTEM = "system"


class OperationType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    PATCH = "patch"


# ============================================================================
# CANON MODELS
# ============================================================================

class Axiom(BaseModel):
    """Canonical axiom from Livro dos Montes"""
    id: int
    text: str
    hash: str
    domain: str
    category: str
    priority: AxiomPriority
    monte: str


class CanonMetadata(BaseModel):
    """Canon v1.0 metadata"""
    version: str
    frozen_at: str
    author: str
    work: str
    activation_code: str
    total_axioms: int
    manifest_hash: str
    metadata: Dict[str, Any]


class Canon(BaseModel):
    """Complete Canon structure"""
    version: str
    frozen_at: str
    author: str
    work: str
    activation_code: str
    total_axioms: int
    axioms: Dict[str, Axiom]
    metadata: Dict[str, Any]
    manifest_hash: str


# ============================================================================
# ARTIFACT MODELS
# ============================================================================

class Source(BaseModel):
    """Source reference for provenance"""
    source_type: SourceType
    source_id: str
    range: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None


class Artifact(BaseModel):
    """Main artifact model"""
    id: str = Field(default_factory=lambda: f"artifact_{datetime.now().timestamp()}")
    title: str
    type: ArtifactType
    content: str
    status: ArtifactStatus = ArtifactStatus.DRAFT
    version: str = "1.0.0"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # Canon references
    ontology_refs: List[str] = []
    axioms: List[str] = []
    
    # Validation results
    conformance: Optional[TestResult] = None
    ontology: Optional[TestResult] = None
    editorial: Optional[TestResult] = None
    
    # Metadata
    tenant_id: Optional[str] = None
    created_by: Optional[str] = None
    tags: List[str] = []


# ============================================================================
# PATCH SYSTEM MODELS
# ============================================================================

class Operation(BaseModel):
    """Patch operation"""
    operation_type: OperationType
    path: str  # JSON path
    value: Optional[Any] = None
    old_value: Optional[Any] = None


class PatchTests(BaseModel):
    """Test results for patch"""
    conformance: TestResult
    ontology: TestResult
    editorial: TestResult
    details: Optional[Dict[str, Any]] = None


class Patch(BaseModel):
    """Git-like patch system"""
    id: str = Field(default_factory=lambda: f"patch_{datetime.now().timestamp()}")
    patch_id: str
    target_artifact_id: str
    description: str
    operations: List[Operation]
    proposed_by: ProposedBy
    created_at: datetime = Field(default_factory=datetime.now)
    
    # Test results
    tests: Optional[PatchTests] = None
    
    # Status
    status: str = "pending"  # pending, approved, rejected, applied
    applied_at: Optional[datetime] = None
    applied_by: Optional[str] = None


# ============================================================================
# AUTH-AI MODELS
# ============================================================================

class AuthProof(BaseModel):
    """AUTH-AI cryptographic proof"""
    id: str = Field(default_factory=lambda: f"proof_{datetime.now().timestamp()}")
    artifact_id: str
    artifact_type: str
    content_hash: str
    author_signature: str
    public_key_pem: str
    tsa_timestamp: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    valid_until: Optional[datetime] = None


class AuthRequest(BaseModel):
    """Request to generate AUTH-AI proof"""
    artifact_id: str
    content: str
    artifact_type: str
    title: Optional[str] = None
    include_tsa: bool = True


class AuthVerification(BaseModel):
    """AUTH-AI verification result"""
    valid: bool
    coherent: bool
    reason: str
    proof: Optional[AuthProof] = None
    verified_at: datetime = Field(default_factory=datetime.now)


# ============================================================================
# LLM GATEWAY MODELS
# ============================================================================

class LLMModel(BaseModel):
    """LLM model configuration"""
    name: str
    provider: str
    version: str
    max_tokens: int
    supports_functions: bool = False
    supports_vision: bool = False


class LLMRequest(BaseModel):
    """LLM gateway request"""
    prompt: str
    context: Optional[Dict[str, Any]] = None
    axioms: List[str] = []
    validate_output: bool = True
    max_tokens: Optional[int] = None
    temperature: float = 0.0  # Deterministic by default


class LLMResponse(BaseModel):
    """LLM gateway response"""
    content: str
    axioms_used: List[str]
    validation_passed: bool
    validation_details: Optional[Dict[str, Any]] = None
    model_used: str
    tokens_used: int
    response_time_ms: int


# ============================================================================
# OS-AGENT MODELS
# ============================================================================

class CommandRequest(BaseModel):
    """OS-Agent command request"""
    command: str
    args: List[str] = []
    cwd: Optional[str] = None
    context: Optional[str] = None
    validation_required: bool = True
    timeout: int = 300


class CommandResponse(BaseModel):
    """OS-Agent command response"""
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: int
    validated: bool
    validation_details: Optional[Dict[str, Any]] = None


class FileOperation(BaseModel):
    """File operation request"""
    operation: Literal["read", "write", "delete", "move", "copy"]
    path: str
    content: Optional[str] = None
    backup: bool = True
    validate_content: bool = True


class WebOperation(BaseModel):
    """Web automation request"""
    operation: Literal["navigate", "click", "type", "extract", "screenshot"]
    url: Optional[str] = None
    selector: Optional[str] = None
    value: Optional[str] = None
    wait_for: Optional[str] = None


# ============================================================================
# MEMORY MODELS
# ============================================================================

class WorkingState(BaseModel):
    """Persistent working state"""
    session_id: str
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    current_context: Dict[str, Any] = {}
    axioms_loaded: List[str] = []
    recent_operations: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class MemoryEntry(BaseModel):
    """Memory system entry"""
    id: str = Field(default_factory=lambda: f"memory_{datetime.now().timestamp()}")
    session_id: str
    key: str
    value: Any
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)


# ============================================================================
# API REQUEST/RESPONSE MODELS
# ============================================================================

class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    version: str
    components: Dict[str, str]
    uptime_seconds: int
    memory_usage_mb: float


class StatsResponse(BaseModel):
    """System statistics"""
    total_artifacts: int
    total_proofs: int
    total_patches: int
    canon_axioms: int
    llm_calls_today: int
    agent_commands_today: int
    storage_used_mb: float


class SearchRequest(BaseModel):
    """Search request"""
    query: str
    type: Optional[ArtifactType] = None
    status: Optional[ArtifactStatus] = None
    limit: int = 50
    offset: int = 0


class SearchResult(BaseModel):
    """Search result"""
    artifacts: List[Artifact]
    total: int
    query: str
    took_ms: int


# ============================================================================
# VALIDATION MODELS
# ============================================================================

class ValidationRequest(BaseModel):
    """Validation request"""
    content: str
    domain: Optional[str] = None
    axioms_required: List[str] = []
    strict_mode: bool = True


class ValidationResponse(BaseModel):
    """Validation response"""
    valid: bool
    coherent: bool
    axioms_found: List[str]
    axioms_missing: List[str]
    violations: List[str]
    confidence_score: float
    validated_at: datetime = Field(default_factory=datetime.now)
