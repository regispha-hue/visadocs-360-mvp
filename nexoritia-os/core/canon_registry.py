"""
Nexoritia OS - Canon Registry
Gestão do Canon de Axiomas do Livro dos Montes
"""

import sqlite3
import json
import hashlib
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from .models import (
    Canon, Axiom, CanonMetadata, Artifact, ArtifactType, 
    ArtifactStatus, TestResult, Source
)


class CanonRegistry:
    """Sistema de gestão do Canon de Axiomas"""
    
    def __init__(self, db_path: str = "data/nexoritia.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()
        self.canon = self._load_canon()
    
    def init_db(self):
        """Inicializa banco de dados SQLite"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                -- Artifacts table
                CREATE TABLE IF NOT EXISTS artifacts (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    status TEXT NOT NULL,
                    version TEXT DEFAULT '1.0.0',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ontology_refs TEXT,  -- JSON array
                    axioms TEXT,         -- JSON array
                    conformance TEXT,
                    ontology TEXT,
                    editorial TEXT,
                    tenant_id TEXT,
                    created_by TEXT,
                    tags TEXT            -- JSON array
                );
                
                -- Sources table for provenance
                CREATE TABLE IF NOT EXISTS sources (
                    id TEXT PRIMARY KEY,
                    artifact_id TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    source_id TEXT NOT NULL,
                    range_text TEXT,
                    url TEXT,
                    title TEXT,
                    author TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
                );
                
                -- Patches table for versioning
                CREATE TABLE IF NOT EXISTS patches (
                    id TEXT PRIMARY KEY,
                    patch_id TEXT NOT NULL,
                    target_artifact_id TEXT NOT NULL,
                    description TEXT NOT NULL,
                    operations TEXT NOT NULL,  -- JSON array
                    proposed_by TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'pending',
                    applied_at TIMESTAMP,
                    applied_by TEXT,
                    FOREIGN KEY (target_artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
                );
                
                -- Patch tests
                CREATE TABLE IF NOT EXISTS patch_tests (
                    id TEXT PRIMARY KEY,
                    patch_id TEXT NOT NULL,
                    conformance TEXT NOT NULL,
                    ontology TEXT NOT NULL,
                    editorial TEXT NOT NULL,
                    details TEXT,  -- JSON
                    FOREIGN KEY (patch_id) REFERENCES patches(id) ON DELETE CASCADE
                );
                
                -- AUTH-AI proofs
                CREATE TABLE IF NOT EXISTS auth_proofs (
                    id TEXT PRIMARY KEY,
                    artifact_id TEXT NOT NULL,
                    artifact_type TEXT NOT NULL,
                    content_hash TEXT NOT NULL,
                    author_signature TEXT NOT NULL,
                    public_key_pem TEXT NOT NULL,
                    tsa_timestamp TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    valid_until TIMESTAMP,
                    FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
                );
                
                -- Working state for sessions
                CREATE TABLE IF NOT EXISTS working_state (
                    session_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    tenant_id TEXT,
                    current_context TEXT,  -- JSON
                    axioms_loaded TEXT,     -- JSON array
                    recent_operations TEXT, -- JSON array
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- Memory entries
                CREATE TABLE IF NOT EXISTS memory_entries (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    expires_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES working_state(session_id) ON DELETE CASCADE
                );
                
                -- Full-text search indexes
                CREATE VIRTUAL TABLE IF NOT EXISTS artifacts_fts USING fts5(
                    title, content, tags
                );
                
                CREATE VIRTUAL TABLE IF NOT EXISTS sources_fts USING fts5(
                    title, author, url
                );
                
                -- Triggers for FTS
                CREATE TRIGGER IF NOT EXISTS artifacts_fts_insert AFTER INSERT ON artifacts BEGIN
                    INSERT INTO artifacts_fts(rowid, title, content, tags) 
                    VALUES (new.id, new.title, new.content, new.tags);
                END;
                
                CREATE TRIGGER IF NOT EXISTS artifacts_fts_delete AFTER DELETE ON artifacts BEGIN
                    DELETE FROM artifacts_fts WHERE rowid = old.id;
                END;
                
                CREATE TRIGGER IF NOT EXISTS sources_fts_insert AFTER INSERT ON sources BEGIN
                    INSERT INTO sources_fts(rowid, title, author, url) 
                    VALUES (new.id, new.title, new.author, new.url);
                END;
                
                CREATE TRIGGER IF NOT EXISTS sources_fts_delete AFTER DELETE ON sources BEGIN
                    DELETE FROM sources_fts WHERE rowid = old.id;
                END;
            """)
    
    def _load_canon(self) -> Optional[Canon]:
        """Carrega Canon v1.0 do arquivo"""
        canon_path = Path(__file__).parent.parent / "data" / "canon_v1.0.json"
        
        if not canon_path.exists():
            return None
            
        try:
            with open(canon_path, 'r', encoding='utf-8') as f:
                canon_data = json.load(f)
            
            # Converter para modelo Pydantic
            axioms = {}
            for key, axiom_data in canon_data["axioms"].items():
                axioms[key] = Axiom(**axiom_data)
            
            return Canon(
                version=canon_data["version"],
                frozen_at=canon_data["frozen_at"],
                author=canon_data["author"],
                work=canon_data["work"],
                activation_code=canon_data["activation_code"],
                total_axioms=canon_data["total_axioms"],
                axioms=axioms,
                metadata=canon_data["metadata"],
                manifest_hash=canon_data["manifest_hash"]
            )
        except Exception as e:
            print(f"Erro ao carregar Canon: {e}")
            return None
    
    def get_canon_info(self) -> Optional[Dict[str, Any]]:
        """Retorna informações do Canon carregado"""
        if not self.canon:
            return None
            
        return {
            "version": self.canon.version,
            "author": self.canon.author,
            "work": self.canon.work,
            "frozen_at": self.canon.frozen_at,
            "activation_code": self.canon.activation_code,
            "total_axioms": self.canon.total_axioms,
            "manifest_hash": self.canon.manifest_hash,
            "metadata": self.canon.metadata
        }
    
    def find_axiom_by_hash(self, text_hash: str) -> Optional[Axiom]:
        """Busca axioma pelo hash SHA256"""
        if not self.canon:
            return None
            
        for axiom in self.canon.axioms.values():
            if axiom.hash == text_hash:
                return axiom
        return None
    
    def find_axiom_by_text(self, text: str) -> Optional[Axiom]:
        """Busca axioma pelo texto exato"""
        normalized_text = " ".join(text.split())
        text_hash = hashlib.sha256(normalized_text.encode('utf-8')).hexdigest()
        return self.find_axiom_by_hash(text_hash)
    
    def list_axioms(self, 
                   monte: Optional[str] = None,
                   priority: Optional[str] = None,
                   category: Optional[str] = None,
                   domain: Optional[str] = None) -> Dict[str, Axiom]:
        """Lista axiomas com filtros"""
        if not self.canon:
            return {}
        
        axioms = self.canon.axioms.copy()
        
        # Aplicar filtros
        if monte:
            axioms = {k: v for k, v in axioms.items() if v.monte == monte}
        if priority:
            axioms = {k: v for k, v in axioms.items() if v.priority == priority}
        if category:
            axioms = {k: v for k, v in axioms.items() if v.category == category}
        if domain:
            axioms = {k: v for k, v in axioms.items() if v.domain == domain}
        
        return axioms
    
    def validate_text(self, text: str, strict_mode: bool = True) -> Dict[str, Any]:
        """Valida texto contra o Canon"""
        if not self.canon:
            return {
                "valid": False,
                "coherent": False,
                "reason": "Canon not loaded",
                "axioms_found": [],
                "axioms_missing": [],
                "violations": ["Canon not available"],
                "confidence_score": 0.0
            }
        
        # Normalizar texto
        normalized_text = " ".join(text.split())
        text_hash = hashlib.sha256(normalized_text.encode('utf-8')).hexdigest()
        
        # Buscar axioma correspondente
        matching_axiom = self.find_axiom_by_hash(text_hash)
        
        if matching_axiom:
            return {
                "valid": True,
                "coherent": True,
                "reason": "Valid canonical axiom",
                "axioms_found": [matching_axiom.id],
                "axioms_missing": [],
                "violations": [],
                "confidence_score": 1.0
            }
        
        # Se strict_mode, qualquer coisa não canônica é inválida
        if strict_mode:
            return {
                "valid": False,
                "coherent": False,
                "reason": "Text not found in Canon (strict mode)",
                "axioms_found": [],
                "axioms_missing": [],
                "violations": ["Non-canonical text"],
                "confidence_score": 0.0
            }
        
        # Modo permissivo: analisar similaridades
        axioms_found = []
        axioms_missing = []
        violations = []
        
        # Buscar por similaridade simples (poderia usar embeddings)
        for axiom in self.canon.axioms.values():
            words_text = set(normalized_text.lower().split())
            words_axiom = set(axiom.text.lower().split())
            
            similarity = len(words_text & words_axiom) / len(words_text | words_axiom)
            
            if similarity > 0.7:  # 70% similaridade
                axioms_found.append(axiom.id)
            elif similarity > 0.3:  # 30% similaridade
                axioms_missing.append(axiom.id)
        
        confidence_score = len(axioms_found) / len(self.canon.axioms) if self.canon.axioms else 0.0
        
        return {
            "valid": confidence_score > 0.5,
            "coherent": confidence_score > 0.3,
            "reason": f"Similarity analysis: {confidence_score:.2f}",
            "axioms_found": axioms_found,
            "axioms_missing": axioms_missing,
            "violations": violations,
            "confidence_score": confidence_score
        }
    
    def create_artifact(self, artifact: Artifact) -> str:
        """Cria novo artifact"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO artifacts (
                    id, title, type, content, status, version,
                    created_at, updated_at, ontology_refs, axioms,
                    conformance, ontology, editorial, tenant_id,
                    created_by, tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                artifact.id, artifact.title, artifact.type, artifact.content,
                artifact.status, artifact.version, artifact.created_at,
                artifact.updated_at, json.dumps(artifact.ontology_refs),
                json.dumps(artifact.axioms), artifact.conformance,
                artifact.ontology, artifact.editorial, artifact.tenant_id,
                artifact.created_by, json.dumps(artifact.tags)
            ))
            
            # Adicionar sources
            for source in artifact.sources:
                cursor.execute("""
                    INSERT INTO sources (
                        id, artifact_id, source_type, source_id, range_text,
                        url, title, author
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"source_{datetime.now().timestamp()}",
                    artifact.id, source.source_type, source.source_id,
                    source.range, source.url, source.title, source.author
                ))
            
            conn.commit()
            return artifact.id
    
    def get_artifact(self, artifact_id: str) -> Optional[Artifact]:
        """Busca artifact por ID"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM artifacts WHERE id = ?
            """, (artifact_id,))
            
            row = cursor.fetchone()
            if not row:
                return None
            
            # Buscar sources
            cursor.execute("""
                SELECT * FROM sources WHERE artifact_id = ?
            """, (artifact_id,))
            sources = []
            for source_row in cursor.fetchall():
                sources.append(Source(
                    source_type=source_row["source_type"],
                    source_id=source_row["source_id"],
                    range=source_row["range_text"],
                    url=source_row["url"],
                    title=source_row["title"],
                    author=source_row["author"]
                ))
            
            return Artifact(
                id=row["id"],
                title=row["title"],
                type=row["type"],
                content=row["content"],
                status=row["status"],
                version=row["version"],
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"]),
                ontology_refs=json.loads(row["ontology_refs"] or "[]"),
                axioms=json.loads(row["axioms"] or "[]"),
                conformance=row["conformance"],
                ontology=row["ontology"],
                editorial=row["editorial"],
                tenant_id=row["tenant_id"],
                created_by=row["created_by"],
                tags=json.loads(row["tags"] or "[]"),
                sources=sources
            )
    
    def search_artifacts(self, query: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Busca full-text em artifacts"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT artifacts.* FROM artifacts_fts
                JOIN artifacts ON artifacts.id = artifacts_fts.rowid
                WHERE artifacts_fts MATCH ?
                ORDER BY rank
                LIMIT ? OFFSET ?
            """, (query, limit, offset))
            
            artifacts = []
            for row in cursor.fetchall():
                artifacts.append(Artifact(
                    id=row["id"],
                    title=row["title"],
                    type=row["type"],
                    content=row["content"],
                    status=row["status"],
                    version=row["version"],
                    created_at=datetime.fromisoformat(row["created_at"]),
                    updated_at=datetime.fromisoformat(row["updated_at"]),
                    ontology_refs=json.loads(row["ontology_refs"] or "[]"),
                    axioms=json.loads(row["axioms"] or "[]"),
                    conformance=row["conformance"],
                    ontology=row["ontology"],
                    editorial=row["editorial"],
                    tenant_id=row["tenant_id"],
                    created_by=row["created_by"],
                    tags=json.loads(row["tags"] or "[]")
                ))
            
            # Count total
            cursor.execute("""
                SELECT COUNT(*) as total FROM artifacts_fts
                WHERE artifacts_fts MATCH ?
            """, (query,))
            total = cursor.fetchone()["total"]
            
            return {
                "artifacts": artifacts,
                "total": total,
                "query": query,
                "limit": limit,
                "offset": offset
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do sistema"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Contagens básicas
            cursor.execute("SELECT COUNT(*) as count FROM artifacts")
            total_artifacts = cursor.fetchone()["count"]
            
            cursor.execute("SELECT COUNT(*) as count FROM auth_proofs")
            total_proofs = cursor.fetchone()["count"]
            
            cursor.execute("SELECT COUNT(*) as count FROM patches")
            total_patches = cursor.fetchone()["count"]
            
            # Distribuição por tipo
            cursor.execute("""
                SELECT type, COUNT(*) as count 
                FROM artifacts 
                GROUP BY type
            """)
            artifact_types = dict(cursor.fetchall())
            
            # Status distribution
            cursor.execute("""
                SELECT status, COUNT(*) as count 
                FROM artifacts 
                GROUP BY status
            """)
            status_distribution = dict(cursor.fetchall())
            
            return {
                "total_artifacts": total_artifacts,
                "total_proofs": total_proofs,
                "total_patches": total_patches,
                "canon_axioms": len(self.canon.axioms) if self.canon else 0,
                "artifact_types": artifact_types,
                "status_distribution": status_distribution,
                "canon_loaded": self.canon is not None,
                "canon_version": self.canon.version if self.canon else None
            }
