"""Nexoritia OS - Canon Registry | Otimizado para deploy"""
import sqlite3, json, hashlib
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from .models import Canon, Axiom, Artifact, Source, AuthProof, AuthRequest

class CanonRegistry:
    def __init__(self, db_path="data/nexoritia.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()
        self.canon = self._load_canon()

    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS artifacts (id TEXT PRIMARY KEY, title TEXT, type TEXT, content TEXT, status TEXT, version TEXT, created_at TIMESTAMP, updated_at TIMESTAMP, ontology_refs TEXT, axioms TEXT, conformance TEXT, ontology TEXT, editorial TEXT, tenant_id TEXT, created_by TEXT, tags TEXT);
                CREATE TABLE IF NOT EXISTS sources (id TEXT PRIMARY KEY, artifact_id TEXT, source_type TEXT, source_id TEXT, range_text TEXT, url TEXT, title TEXT, author TEXT, created_at TIMESTAMP);
                CREATE TABLE IF NOT EXISTS auth_proofs (id TEXT PRIMARY KEY, artifact_id TEXT, artifact_type TEXT, content_hash TEXT, author_signature TEXT, public_key_pem TEXT, tsa_timestamp TEXT, created_at TIMESTAMP, valid_until TIMESTAMP);
                CREATE VIRTUAL TABLE IF NOT EXISTS artifacts_fts USING fts5(title, content, tags);
                CREATE TRIGGER IF NOT EXISTS artifacts_fts_insert AFTER INSERT ON artifacts BEGIN INSERT INTO artifacts_fts(rowid, title, content, tags) VALUES (new.id, new.title, new.content, new.tags); END;
            """)

    def _load_canon(self):
        canon_path = Path(__file__).parent.parent / "data" / "canon_v1.0.json"
        if not canon_path.exists(): return None
        try:
            with open(canon_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            axioms = {k: Axiom(**v) for k, v in data["axioms"].items()}
            return Canon(axioms=axioms, **{k: v for k, v in data.items() if k != "axioms"})
        except Exception as e:
            print(f"Canon load error: {e}"); return None

    def get_canon_info(self):
        if not self.canon: return None
        return {"version": self.canon.version, "author": self.canon.author, "work": self.canon.work, "frozen_at": self.canon.frozen_at, "activation_code": self.canon.activation_code, "total_axioms": self.canon.total_axioms, "manifest_hash": self.canon.manifest_hash}

    def find_axiom_by_hash(self, text_hash):
        if not self.canon: return None
        for axiom in self.canon.axioms.values():
            if axiom.hash == text_hash: return axiom
        return None

    def find_axiom_by_text(self, text):
        normalized = " ".join(text.split())
        return self.find_axiom_by_hash(hashlib.sha256(normalized.encode('utf-8')).hexdigest())

    def list_axioms(self, monte=None, priority=None, category=None, domain=None):
        if not self.canon: return {}
        axioms = self.canon.axioms.copy()
        if monte: axioms = {k: v for k, v in axioms.items() if v.monte == monte}
        if priority: axioms = {k: v for k, v in axioms.items() if v.priority == priority}
        if category: axioms = {k: v for k, v in axioms.items() if v.category == category}
        if domain: axioms = {k: v for k, v in axioms.items() if v.domain == domain}
        return axioms

    def validate_text(self, text, strict_mode=True):
        if not self.canon:
            return {"valid": False, "coherent": False, "reason": "Canon not loaded", "axioms_found": [], "axioms_missing": [], "violations": ["Canon not available"], "confidence_score": 0.0}
        normalized = " ".join(text.split())
        text_hash = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
        matching = self.find_axiom_by_hash(text_hash)
        if matching:
            return {"valid": True, "coherent": True, "reason": "Valid canonical axiom", "axioms_found": [matching.id], "axioms_missing": [], "violations": [], "confidence_score": 1.0}
        if strict_mode:
            return {"valid": False, "coherent": False, "reason": "Text not found in Canon (strict mode)", "axioms_found": [], "axioms_missing": [], "violations": ["Non-canonical text"], "confidence_score": 0.0}
        found, missing = [], []
        for axiom in self.canon.axioms.values():
            w_t, w_a = set(normalized.lower().split()), set(axiom.text.lower().split())
            sim = len(w_t & w_a) / len(w_t | w_a)
            if sim > 0.7: found.append(axiom.id)
            elif sim > 0.3: missing.append(axiom.id)
        score = len(found) / len(self.canon.axioms) if self.canon.axioms else 0.0
        return {"valid": score > 0.5, "coherent": score > 0.3, "reason": f"Similarity: {score:.2f}", "axioms_found": found, "axioms_missing": missing, "violations": [], "confidence_score": score}

    def create_artifact(self, artifact: Artifact) -> str:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("INSERT INTO artifacts VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (artifact.id, artifact.title, artifact.type, artifact.content, artifact.status, artifact.version,
                 artifact.created_at, artifact.updated_at, json.dumps(artifact.ontology_refs), json.dumps(artifact.axioms),
                 artifact.conformance, artifact.ontology, artifact.editorial, artifact.tenant_id, artifact.created_by, json.dumps(artifact.tags)))
            for source in artifact.sources:
                conn.execute("INSERT INTO sources VALUES (?,?,?,?,?,?,?,?,?)",
                    (f"s_{datetime.now().timestamp()}", artifact.id, source.source_type, source.source_id,
                     source.range, source.url, source.title, source.author, datetime.now()))
            conn.commit()
        return artifact.id

    def get_artifact(self, artifact_id):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM artifacts WHERE id=?", (artifact_id,)).fetchone()
            if not row: return None
            sources = []
            for r in conn.execute("SELECT * FROM sources WHERE artifact_id=?", (artifact_id,)):
                d = dict(r)
                d["range"] = d.pop("range_text", None)
                sources.append(Source(**d))
            return Artifact(id=row["id"], title=row["title"], type=row["type"], content=row["content"],
                          status=row["status"], version=row["version"], ontology_refs=json.loads(row["ontology_refs"] or "[]"),
                          axioms=json.loads(row["axioms"] or "[]"), sources=sources)

    def get_stats(self):
        with sqlite3.connect(self.db_path) as conn:
            return {"total_artifacts": conn.execute("SELECT COUNT(*) FROM artifacts").fetchone()[0],
                    "total_proofs": conn.execute("SELECT COUNT(*) FROM auth_proofs").fetchone()[0],
                    "canon_axioms": len(self.canon.axioms) if self.canon else 0,
                    "canon_loaded": self.canon is not None}
