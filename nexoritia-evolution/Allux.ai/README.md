# Allux MVP - Ontology Core & Canon Governance System

**Version:** 1.0.0  
**Status:** Phase 1 - Canon Registry ✅

---

## 🎯 What is Allux?

Allux is an **ontology-first AI governance system** that provides:

- **Canon Registry**: Immutable, versioned artifact management
- **Fail-Closed Governance**: Nothing publishes without validation
- **Provenance Tracking**: Every artifact traces to sources
- **Multi-LLM Support**: Not locked to any single AI provider
- **OS-AUTH**: Cryptographic proof of authorship
- **OS-TRSLATE**: Ontological translation (not literal)

---

## 📦 MVP Components

### Phase 1: Canon Registry ✅ (COMPLETED)
- SQLite database with full schema
- Pydantic models matching SCHEMA.json
- Canon Registry core implementation
- FastAPI daemon with REST API
- Artifact CRUD operations
- Patch system (git-like versioning)
- Full-text search (FTS5)

### Phase 2: Import & Indexing (TODO)
- Chat import (HTML/JSON)
- Document import (PDF/DOCX/MD)
- FAISS embeddings
- Agravador de Conteúdo (similarity alerts)

### Phase 3: Ontology Inference (TODO)
- Entity extraction (spaCy)
- Relation extraction
- Knowledge Graph (Neo4j or in-memory)
- JSON-LD export

### Phase 4: Assembler (TODO)
- Typst pipeline
- Markdown → PDF (A5 premium)
- ISBN generation
- Multi-language support

### Phase 5: OS-AUTH (TODO)
- Ed25519 signing
- SHA-256 hashing
- JSON proof generation
- Blockchain/TSA anchoring (optional)

### Phase 6: OS-TRSLATE (TODO)
- Translation pipeline
- Semantic verification
- Editorial reduction
- Multi-language builds

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd allux_mvp
pip install -r requirements.txt
```

### 2. Initialize Database

The database will be auto-created on first run using `database/schema.sql`.

### 3. Start Daemon

```bash
python daemon.py
```

You should see:

```
╔══════════════════════════════════════╗
║        ALLUX DAEMON v1.0.0          ║
╠══════════════════════════════════════╣
║  Local Ontology Core                ║
║  Canon Governance System            ║
║  Offline-First • Sovereign          ║
╚══════════════════════════════════════╝

🌐 Server: http://127.0.0.1:8000
📚 Docs:   http://127.0.0.1:8000/docs
🔍 Stats:  http://127.0.0.1:8000/stats
```

### 4. Test API

Open your browser to:
- **Interactive Docs**: http://127.0.0.1:8000/docs
- **Stats Dashboard**: http://127.0.0.1:8000/stats

Or use curl:

```bash
# Health check
curl http://localhost:8000/

# Get stats
curl http://localhost:8000/stats

# Create artifact
curl -X POST http://localhost:8000/canon/artifact \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Monte I - Prólogo",
    "type": "chapter",
    "content": "# Monte I\n\n[VÁCUO]\n\nNo princípio...",
    "sources": [{
      "source_type": "chat",
      "source_id": "claude_2026-01-15",
      "range": "messages:1-10"
    }],
    "ontology_refs": ["desconciliacao"],
    "axioms": ["Lei da Não-Reconciliação"]
  }'

# List all artifacts
curl http://localhost:8000/canon/artifacts
```

---

## 📁 Project Structure

```
allux_mvp/
├── core/
│   ├── models.py         # Pydantic models (SCHEMA.json)
│   └── registry.py       # Canon Registry implementation
├── database/
│   └── schema.sql        # SQLite schema
├── data/
│   └── allux_canon.db    # Database (auto-created)
├── daemon.py             # FastAPI server
├── requirements.txt      # Dependencies
└── README.md            # This file
```

---

## 🧪 Testing

Run the test suite:

```bash
pytest tests/ -v
```

---

## 🔒 Governance Principles

### Fail-Closed
- Nothing publishes without validation
- All tests must PASS (conformance, ontology, editorial)
- Errors halt the process

### Immutability
- Artifacts are never overwritten
- Changes create new versions (semver)
- Patches apply git-like operations

### Provenance
- Every artifact links to sources
- Full audit trail maintained
- Cryptographic hashing ensures integrity

### Determinism
- Same input → same output
- Canon can be reconstructed from patches
- No hidden state

---

## 📊 Database Schema

### Core Tables
- `artifacts` - Main artifact storage
- `artifact_sources` - Source provenance
- `artifact_ontology_refs` - Ontology links
- `artifact_axioms` - Axiom declarations
- `patches` - Version control
- `patch_operations` - Patch details
- `patch_tests` - Validation results
- `auth_proofs` - Cryptographic proofs
- `translations` - OS-TRSLATE outputs
- `sources` - Chat/document imports

### Search Tables (FTS5)
- `artifacts_fts` - Full-text search on artifacts
- `sources_fts` - Full-text search on sources

---

## 🛣️ Roadmap

**Phase 1 (Week 1-2):** ✅ Canon Registry + Daemon
**Phase 2 (Week 3):** Import + Indexing + Agravador
**Phase 3 (Week 4):** Ontology Inference + Knowledge Graph
**Phase 4 (Week 5):** Typst Assembler + PDF Build
**Phase 5 (Week 6):** OS-AUTH + Cryptographic Proofs
**Phase 6 (Week 7-8):** OS-TRSLATE + Multi-language

---

## 🤝 Contributing

This is an MVP implementation. Contributions should:
- Follow SCHEMA.json specification
- Maintain fail-closed governance
- Include tests
- Document in docstrings

---

## 📄 License

Proprietary - R.Gis Antônimo Veniloqa  
Allux Core Ontology & Canon Governance System

---

## 🔗 Related Documents

- `PRD.md` - Product Requirements
- `GOVERNANCE.md` - Governance Principles
- `SCHEMA.json` - Data Contracts
- `ASSEMBLER.md` - Typst Pipeline
- `OS-TRSLATE.md` - Translation System

---

**Built with fail-closed principles for Big Tech-ready ontological AI governance.**
