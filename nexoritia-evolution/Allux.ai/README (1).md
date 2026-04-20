# 🎯 Allux.ai - Complete System

**Canon-First Ontological AI Governance**

Allux is an ontology-first AI governance system that ensures artifact integrity through fail-closed principles, immutable versioning, and canonical knowledge management.

This release integrates:
- ✅ **Phase 1**: Canon Registry with fail-closed governance
- ✅ **Phase 2**: Canonical RAG (migrated from LDMux)
- ✅ **Phase 3** (partial): Knowledge Graph foundations
- 🔄 **Phase 4**: Assembler (Typst pipeline) - in progress
- 🔄 **Phase 5**: OS-AUTH (cryptographic proofs) - schema ready
- 🔄 **Phase 6**: OS-TRSLATE (multi-language) - schema ready

---

## 🚀 Quick Start

### Installation

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run demo
python demo.py

# 3. Start daemon
python daemon.py
```

Then visit: http://localhost:8000/docs

---

## 📦 What's Included

### **Core Components**

| Component | Status | Description |
|-----------|--------|-------------|
| **Canon Registry** | ✅ Complete | Immutable artifact store with git-like versioning |
| **Canonical RAG** | ✅ Complete | Dual-threshold retrieval with fail-closed principle |
| **FastAPI Daemon** | ✅ Complete | REST API with 12+ endpoints |
| **SQLite Database** | ✅ Complete | 10 tables + 2 FTS5 indexes |
| **Pydantic Models** | ✅ Complete | Type-safe data models |

### **LDMux-Migrated Features**

All core LDMux components successfully migrated:

✅ **Ontology Kernel** → Canon Registry core  
✅ **Canon Hash Protocol** → SHA-256 hashing  
✅ **Fail-Closed Validation** → Patch rejection system  
✅ **Dual Threshold RAG** → 0.88 (core) / 0.82 (echo)  
✅ **Silêncio > Invenção** → Returns empty if below threshold  
✅ **Semver Versioning** → Git-like patch system  
✅ **Immutability** → Frozen status enforcement  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ALLUX.AI                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│  │ Canon        │───▶│ Canonical    │───▶│ FastAPI  │ │
│  │ Registry     │    │ RAG          │    │ Daemon   │ │
│  │ (Phase 1)    │    │ (Phase 2)    │    │          │ │
│  └──────────────┘    └──────────────┘    └──────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌─────────────────────────────────────────────────┐  │
│  │           SQLite Database                       │  │
│  │  • 10 tables • FTS5 search • Foreign keys      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎮 Core Features

### 1. **Canon Registry** (Fail-Closed Governance)

Create, version, and govern artifacts with immutability guarantees:

```python
from core.registry import CanonRegistry
from core.models import Artifact, ArtifactType

registry = CanonRegistry()

# Create artifact
artifact = Artifact(
    artifact_id="chapter_1",
    type=ArtifactType.CHAPTER,
    title="Chapter 1: The Beginning",
    content="# Chapter 1\n\nIn the beginning...",
    ontology_refs=["concept_x", "axiom_y"]
)

created = registry.create_artifact(artifact)

# Promote to canon
registry.promote_to_canon(created.artifact_id)

# Freeze (immutable)
registry.freeze_artifact(created.artifact_id)
```

**Key Principles:**
- ✅ **Fail-Closed**: Patches with failing tests are rejected
- ✅ **Immutable**: Frozen artifacts cannot be modified
- ✅ **Versioned**: Git-like semver (1.0.0 → 1.0.1 → 1.1.0)
- ✅ **Provenance**: All sources tracked

---

### 2. **Canonical RAG** (LDMux Migrated)

Dual-threshold retrieval with fail-closed principle:

```python
from indexing.canonical_rag import CanonicalRAG

rag = CanonicalRAG()

# Add to corpus
rag.add("Canonical fragment text", metadata={"rating": 5})

# Retrieve with core threshold (0.88)
core_results = rag.retrieve("query", mode="core")

# Retrieve with echo threshold (0.82)
echo_results = rag.retrieve("query", mode="echo")

# Dual retrieval
dual = rag.retrieve_dual("query")
```

**Key Features:**
- 🎯 **Dual Thresholds**: 0.88 (core) / 0.82 (echo)
- 🔒 **Fail-Closed**: Returns empty if below threshold
- 📊 **Silêncio > Invenção**: No hallucination, only canon

---

### 3. **FastAPI Daemon**

REST API with complete CRUD operations:

**Endpoints:**
- `POST /artifacts` - Create artifact
- `GET /artifacts/{id}` - Retrieve artifact
- `GET /artifacts?q=search` - Full-text search
- `POST /artifacts/{id}/promote` - Promote to CANON
- `POST /artifacts/{id}/freeze` - Freeze artifact
- `POST /patches` - Create patch
- `POST /patches/{id}/apply` - Apply patch (fail-closed)
- `POST /rag/add` - Add to RAG corpus
- `POST /rag/search` - Search RAG
- `GET /stats` - System statistics

Start daemon:
```bash
python daemon.py
```

Visit: http://localhost:8000/docs

---

## 📊 Database Schema

**10 Core Tables:**
1. `artifacts` - Main artifact storage
2. `artifact_sources` - Provenance tracking
3. `artifact_ontology_refs` - Ontology references
4. `artifact_axioms` - Axiom declarations
5. `patches` - Version control
6. `patch_operations` - Patch operations
7. `patch_tests` - Validation results
8. `auth_proofs` - Cryptographic proofs (Phase 5)
9. `translations` - Multi-language (Phase 6)
10. `sources` - Import metadata (Phase 2)

**2 FTS5 Tables:**
- `artifacts_fts` - Full-text search on artifacts
- `sources_fts` - Full-text search on sources

---

## 🎯 Demonstration

Run the complete demo:

```bash
python demo.py
```

**Demonstrates:**
1. ✅ Artifact creation (DRAFT status)
2. ✅ Patch application with validation
3. ✅ Fail-closed rejection (patches with failing tests)
4. ✅ Promotion to CANON
5. ✅ Freezing (immutability)
6. ✅ RAG corpus management
7. ✅ Dual-threshold retrieval
8. ✅ Integrated workflow (Registry + RAG)

---

## 🔧 Configuration

### Environment Variables

```bash
# Optional: API keys for future LLM integration
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."

# Optional: Database path
export ALLUX_DB_PATH="custom_allux.db"

# Optional: RAG configuration
export RAG_THRESHOLD_CORE="0.88"
export RAG_THRESHOLD_ECHO="0.82"
```

---

## 📈 Implementation Status

| Phase | Component | Status | LOC |
|-------|-----------|--------|-----|
| **1** | Canon Registry | ✅ Complete | ~480 |
| **1** | Pydantic Models | ✅ Complete | ~520 |
| **1** | Database Schema | ✅ Complete | ~380 |
| **1** | FastAPI Daemon | ✅ Complete | ~350 |
| **2** | Canonical RAG | ✅ Complete | ~400 |
| **2** | Import System | 🔄 Pending | - |
| **3** | Knowledge Graph | 🔄 Pending | - |
| **4** | Typst Assembler | 🔄 Pending | - |
| **5** | OS-AUTH | 🔄 Schema ready | - |
| **6** | OS-TRSLATE | 🔄 Schema ready | - |

**Total Production Code:** ~2,130 LOC  
**Database Tables:** 10 + 2 FTS5  
**API Endpoints:** 12  
**Test Coverage:** Demo validates all core functionality

---

## 🎓 Key Concepts

### **Fail-Closed Governance**
Patches are rejected if **ANY** test fails:
- Conformance test failed → ❌ Reject
- Ontology test failed → ❌ Reject
- Editorial test failed → ❌ Reject

### **Immutability**
Frozen artifacts cannot be modified:
```python
# This raises ValueError
registry.freeze_artifact("artifact_id")
registry.create_patch(...)  # ❌ Cannot patch frozen
```

### **Canonical RAG**
Silêncio > invenção principle:
- Query below threshold → Returns empty ✅
- Query above threshold → Returns canon ✅

### **Provenance**
Every artifact tracks its sources:
```python
sources=[
    Source(
        source_type="chat",
        source_id="claude_2026_01_16",
        range_start="line:1",
        range_end="line:50"
    )
]
```

---

## 🚧 Roadmap

### **Immediate (Week 1-2)**
- [ ] Chat importers (Claude/GPT/Gemini HTML)
- [ ] Document importers (PDF/DOCX/MD)
- [ ] FAISS embeddings integration
- [ ] Agravador de Conteúdo (contradiction detector)

### **Short-term (Week 3-4)**
- [ ] Entity extraction (spaCy)
- [ ] Relation extraction
- [ ] Knowledge Graph (Neo4j or in-memory)
- [ ] JSON-LD export

### **Medium-term (Week 5-8)**
- [ ] Typst pipeline (Markdown → PDF)
- [ ] A5 premium templates
- [ ] ISBN generation
- [ ] Ed25519 signing (OS-AUTH)
- [ ] Multi-LLM translation (OS-TRSLATE)

---

## 📄 License

**Copyright 2026 Regis (R.Gis Veniloqa)**

Allux.ai is proprietary software developed for Big Tech licensing.

**LDMux-Core components (migrated):** To be open-sourced under MIT license.

---

## 🙏 Acknowledgments

This system integrates and extends concepts from:
- **LDMux-OS**: Canon-first literary operating system
- **Espiritualidade Algorítmica**: Philosophical foundations
- **O Livro dos Montes**: Canonical ontology example

---

## 📞 Contact

For licensing inquiries: [contact information]

For technical documentation: See `/docs` directory

For API documentation: http://localhost:8000/docs (when daemon is running)

---

**🎯 Allux.ai - Canon-First Ontological AI Governance**

*Built with precision. Governed by principle.*
