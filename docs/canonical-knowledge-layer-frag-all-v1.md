# Canonical Knowledge Layer - FRAG-ALL v1

## Objetivo

Implementar o primeiro chunking deterministico de documentos canonicos, sem IA, embeddings, RAG, LangGraph ou chamadas LLM.

## Escopo

- Criar `CanonicalChunk` como tabela aditiva.
- Gerar chunks por tenant para um `CanonicalDocument` existente.
- Usar texto ja disponivel no documento canonico ou na fonte vinculada.
- Registrar `AuditLog` e `DocumentLifecycleEvent`.
- Bloquear duplicidade quando o documento ja possui chunks.

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

## Endpoint

`POST /api/canonical/documents/[id]/chunks`

Comportamento esperado:

- `201`: chunks criados.
- `401/403`: usuario sem sessao ou sem papel permitido.
- `404`: documento canonico inexistente no tenant.
- `409`: chunks ja existem para o documento.
- `422`: documento sem texto util para chunking.

## Limites

Esta fase nao classifica semantica, nao cria embeddings, nao faz recuperacao RAG e nao gera POP automaticamente. O objetivo e preparar uma base textual rastreavel e auditavel para fases futuras.
