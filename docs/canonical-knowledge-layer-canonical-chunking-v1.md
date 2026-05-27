# Canonical Knowledge Layer - Canonical Chunking v1

## Objetivo

Implementar o primeiro chunking deterministico interno de documentos canonicos, sem IA, embeddings, RAG, LangGraph ou chamadas LLM.

Esta fase nao e uma implementacao completa do FRAG-ALL. Ela cria uma camada de armazenamento compativel com FRAG-ALL para futura importacao de `FRAG_PACK`.

## Escopo

- Criar `CanonicalChunk` como tabela aditiva.
- Gerar chunks por tenant para um `CanonicalDocument` existente.
- Usar texto ja disponivel no documento canonico ou na fonte vinculada.
- Registrar `AuditLog` e `DocumentLifecycleEvent`.
- Bloquear duplicidade quando o documento ja possui chunks.
- Preparar compatibilidade futura com outputs do pipeline FRAG-ALL.

## Fonte de Texto

A API usa, nessa ordem:

1. `CanonicalDocument.normalizedTextPreview`
2. `DocumentaryLibraryItem.content`
3. `ApprovedPopVersion.contentSnapshot`

Se nenhum texto estiver disponivel, a API retorna erro claro com status `422` e nao cria registros.

## Estrategia Deterministica

- Tamanho alvo: aproximadamente 1200 a 1800 caracteres.
- Overlap: 200 caracteres.
- Estimativa simples de tokens: `ceil(text.length / 4)`.
- `semanticRole` inicial: `UNKNOWN`.
- `sourceHash`: SHA-256 do texto de cada chunk.

O pipeline completo FRAG-ALL do NexoBook contem as etapas `scan -> chunk -> classify -> dedupe -> pack`. Esta fase do Visadocs implementa apenas o armazenamento canonico e o chunking deterministico minimo. Nao porta `scan`, `classify`, `dedupe` ou `pack`.

## Integracao Futura com FRAG_PACK

Uma fase posterior pode importar, de forma controlada:

- `corpus_inventory.json`
- `corpus_chunks.json`
- `corpus_classification.json`
- `corpus_deduplication.json`
- `frag_pack.json`

Essa importacao devera mapear os artefatos para `CanonicalDocument` e `CanonicalChunk`, preservando `tenantId`, origem, hash, versao e trilha auditavel.

## Endpoint

`POST /api/canonical/documents/[id]/chunks`

Comportamento esperado:

- `201`: chunks criados.
- `401/403`: usuario sem sessao ou sem papel permitido.
- `404`: documento canonico inexistente no tenant.
- `409`: chunks ja existem para o documento.
- `422`: documento sem texto util para chunking.

## Limites

Esta fase nao classifica semantica, nao cria embeddings, nao faz recuperacao RAG e nao gera POP automaticamente. O objetivo e preparar uma base textual rastreavel e auditavel para fases futuras e compativel com importacao posterior de FRAG_PACK.
