# ALLUX.AI v2.0 - ÍNDICE DE ARQUIVOS

## 📁 ESTRUTURA

```
allux_v2/
├── core/
│   ├── sources.py          # Sources Vault (Fontes Externas)
│   ├── frag.py             # FRAG-ALL (Destilação de Sessão)
│   ├── invariants.py       # Dicionário + OS-RADAR
│   ├── models.py           # (copiar de v1)
│   └── registry.py         # (copiar de v1)
├── indexing/
│   └── canonical_rag.py    # (copiar de v1)
├── daemon.py               # FastAPI v2.0 (22 endpoints)
├── requirements.txt        # Dependências
├── RESUMO_V2.md           # Documento completo
├── ATIVAR_EM_LLMS.md      # Guia de ativação
└── INDEX.md               # Este arquivo
```

## 📊 FEATURES

### ✅ v1.0 (ONLINE)
- Canon Registry (12 endpoints)
- Canonical RAG
- FastAPI daemon
- SQLite + FTS5

### 🆕 v2.0 (CÓDIGO PRONTO)
- Sources Vault (5 endpoints)
- FRAG-ALL (3 endpoints)
- OS-RADAR (2 endpoints)
- Dicionário de Invariantes

## 🚀 QUICK START

### Deploy Local:
```bash
cd allux_v2/
pip install -r requirements.txt
python daemon.py
# Acesse: localhost:8000/docs
```

### Ativar em LLM:
- Leia: ATIVAR_EM_LLMS.md
- Copie comando para Claude/GPT/Gemini

## 📖 DOCUMENTAÇÃO

1. **RESUMO_V2.md** - Visão geral completa
2. **ATIVAR_EM_LLMS.md** - Como usar com Claude/GPT
3. **daemon.py** - API completa (comentada)
4. **core/sources.py** - Sources Vault (comentado)
5. **core/frag.py** - FRAG-ALL (comentado)
6. **core/invariants.py** - OS-RADAR (comentado)

## 🎯 PRÓXIMOS PASSOS

1. Testar local (20 min)
2. Deploy Railway (5 min)
3. Popular biblioteca (30 min)
4. Ativar em LLMs (5 min)
5. Escrever primeira cena! ✍️

---

**Status:** Código completo, pronto para teste
**Versão:** 2.0.0
**Data:** 16/01/2026
