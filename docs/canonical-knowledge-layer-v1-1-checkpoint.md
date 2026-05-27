# Canonical Knowledge Layer v1.1 - Checkpoint

## Status Geral

Canonical Knowledge Layer v1.1 foi validada em producao como base documental canonica, ainda sem IA, embeddings, RAG, LangGraph ou geracao automatica de POP.

## Implementado

- `CanonicalIngestionJob` implementado.
- `CanonicalDocument` implementado.
- Acao de UI "Enviar para Biblioteca Canonica" implementada na biblioteca documental.
- UI read-only de status canonico implementada na biblioteca documental.
- `CanonicalChunk` implementado como camada de chunking canonico interno.
- Endpoint `POST /api/canonical/ingestion-jobs` implementado.
- Endpoint `GET /api/canonical/ingestion-jobs` implementado.
- Endpoint `POST /api/canonical/documents/[id]/chunks` implementado.

## Migrations

- `20260526130947_canonical_knowledge_layer_phase_1` aplicada em producao.
- `20260526172238_canonical_chunking_v1` aplicada em producao.
- `CanonicalIngestionJob`, `CanonicalDocument` e `CanonicalChunk` existem no banco de producao.
- Migrations aplicadas via `yarn prisma migrate deploy`.
- `prisma db push` nao foi usado.

## Validacoes

- PR #40: ingestao canonica e documentos canonicos.
- PR #42: acao de envio da biblioteca para camada canonica.
- PR #43: UI read-only de status canonico.
- PR #44: Canonical Chunking v1.
- Preview QA do chunking validou `401`, `201`, `409` e `422`.
- Producao validou chunking com dataset QA temporario:
  - `201` para documento com texto;
  - `409` em duplicidade;
  - `422` para documento sem texto;
  - `AuditLog` criado;
  - `DocumentLifecycleEvent` criado;
  - `CanonicalDocument.status = CHUNKED`.
- Dataset QA temporario de producao removido.
- Smoke final de producao passou sem `500`.

## Limites

- Nao ha IA nesta fase.
- Nao ha embeddings nesta fase.
- Nao ha RAG nesta fase.
- Nao ha geracao automatica de POP nesta fase.
- O chunking atual e `Canonical Chunking v1`, nao o pipeline FRAG-ALL completo.
- A camada foi posicionada como `FRAG-ALL compatible storage layer` para futura importacao de `FRAG_PACK`.

## Riscos Residuais

- Migrations de producao continuam exigindo execucao controlada via runbook.
- `CanonicalChunk.semanticRole` permanece `UNKNOWN` ate futura classificacao.
- Nao ha UI dedicada para visualizar chunks individualmente.
- Ainda nao existe `RagRetrievalLog`.
- Ainda nao ha importacao de `corpus_inventory.json`, `corpus_chunks.json`, `corpus_classification.json`, `corpus_deduplication.json` ou `frag_pack.json`.

## Proxima Fase

Prioridade recomendada:

1. Canonical Chunk Viewer read-only.
2. `RagRetrievalLog` v1 para registrar buscas/recuperacoes.
3. Somente depois evoluir para RAG governado.

Nao iniciar geracao automatica de POP antes de visualizacao, auditoria e log de recuperacao estarem fechados.
