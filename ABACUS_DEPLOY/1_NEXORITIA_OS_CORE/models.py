"""Nexoritia OS - Core Models | Otimizado para deploy"""
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

class OperationType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    PATCH = "patch"

class Axiom(BaseModel):
    id: int
    text: str
    hash: str
    domain: str
    category: str
    priority: AxiomPriority
    monte: str

class Canon(BaseModel):
    version: str
    frozen_at: str
    author: str
    work: str
    activation_code: str
    total_axioms: int
    axioms: Dict[str, Axiom]
    metadata: Dict[str, Any]
    manifest_hash: str

class Source(BaseModel):
    source_type: SourceType
    source_id: str
    range: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None

class Artifact(BaseModel):
    id: str = Field(default_factory=lambda: f"a_{datetime.now().timestamp():.0f}")
    title: str
    type: ArtifactType
    content: str
    status: ArtifactStatus = ArtifactStatus.DRAFT
    version: str = "1.0.0"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    ontology_refs: List[str] = []
    axioms: List[str] = []
    conformance: Optional[TestResult] = None
    ontology: Optional[TestResult] = None
    editorial: Optional[TestResult] = None
    tenant_id: Optional[str] = None
    created_by: Optional[str] = None
    tags: List[str] = []
    sources: List[Source] = []

class AuthProof(BaseModel):
    id: str = Field(default_factory=lambda: f"p_{datetime.now().timestamp():.0f}")
    artifact_id: str
    artifact_type: str
    content_hash: str
    author_signature: str
    public_key_pem: str
    tsa_timestamp: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    valid_until: Optional[datetime] = None

class AuthRequest(BaseModel):
    artifact_id: str
    content: str
    artifact_type: str
    title: Optional[str] = None
    include_tsa: bool = True

class AuthVerification(BaseModel):
    valid: bool
    coherent: bool
    reason: str
    proof: Optional[AuthProof] = None
    verified_at: datetime = Field(default_factory=datetime.now)

class LLMRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
    axioms: List[str] = []
    validate_output: bool = True
    max_tokens: Optional[int] = None
    temperature: float = 0.0

class LLMResponse(BaseModel):
    content: str
    axioms_used: List[str]
    validation_passed: bool
    validation_details: Optional[Dict[str, Any]] = None
    model_used: str
    tokens_used: int
    response_time_ms: int

class CommandRequest(BaseModel):
    command: str
    args: List[str] = []
    cwd: Optional[str] = None
    context: Optional[str] = None
    validation_required: bool = True
    timeout: int = 300

class CommandResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: int
    validated: bool
    validation_details: Optional[Dict[str, Any]] = None

class WorkingState(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    current_context: Dict[str, Any] = {}
    axioms_loaded: List[str] = []
    recent_operations: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class ValidationRequest(BaseModel):
    content: str
    domain: Optional[str] = None
    axioms_required: List[str] = []
    strict_mode: bool = True

class ValidationResponse(BaseModel):
    valid: bool
    coherent: bool
    axioms_found: List[str]
    axioms_missing: List[str]
    violations: List[str]
    confidence_score: float
    validated_at: datetime = Field(default_factory=datetime.now)

class HealthCheck(BaseModel):
    status: str
    version: str
    components: Dict[str, str]
    uptime_seconds: int
    memory_usage_mb: float

class StatsResponse(BaseModel):
    total_artifacts: int
    total_proofs: int
    total_patches: int
    canon_axioms: int
    llm_calls_today: int
    agent_commands_today: int
    storage_used_mb: float

class SearchRequest(BaseModel):
    query: str
    type: Optional[ArtifactType] = None
    status: Optional[ArtifactStatus] = None
    limit: int = 50
    offset: int = 0

class ArtifactCreateRequest(BaseModel):
    title: str
    type: str
    content: str
    ontology_refs: List[str] = []
    axioms: List[str] = []
    sources: List[Source] = []
