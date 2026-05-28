# Canonical Knowledge Layer v1.3 Checkpoint

Status: accepted for controlled use
Tag target: v1.3.0-rag-retrieval-log
Scope: RagRetrievalLog v1

## Summary

The v1.3 `RagRetrievalLog` phase adds auditable textual retrieval over `CanonicalChunk` records.

This checkpoint does not add AI generation, embeddings, generative RAG, LangGraph, or automatic POP generation.

## Implemented

- `RagRetrievalLog` table with additive Prisma migration.
- `POST /api/canonical/retrievals`.
- Authenticated retrieval endpoint.
- Tenant-scoped chunk retrieval.
- Initial role gate allowing `ADMIN` and `RT`.
- `OPERADOR` blocked with 403.
- Minimum query length validation.
- Default limit of 10 and maximum limit of 20.
- Optional `documentId` filter with tenant ownership validation.
- Textual search over `CanonicalChunk.text` and `CanonicalChunk.heading`.
- Response with matching chunks, `resultCount`, and `retrievalLogId`.

## Audit Log Fields

Each retrieval writes a `RagRetrievalLog` record containing:

- `queryPreview`, normalized and truncated.
- `queryHash`, SHA-256 hash of the normalized query.
- `retrievedChunkIds`.
- `resultCount`.
- `tenantId`.
- `userId`.
- `documentId`, when provided.
- `filtersJson`.

## Validated In Preview

- Preview migration was applied with `yarn prisma migrate deploy`.
- `RagRetrievalLog` table existed after migration.
- Unauthenticated request returned 401.
- Short query returned 400.
- Existing term returned 200, one chunk, and `retrievalLogId`.
- Missing term returned 200, empty results, and `retrievalLogId`.
- Cross-tenant document access returned 404.
- `OPERADOR` returned 403.
- Log fields were validated.
- QA Preview dataset was removed.
- No 500 was observed.

## Validated In Production

- Production deploy was ready.
- Production migration was applied with `yarn prisma migrate deploy`.
- `RagRetrievalLog` table existed after migration.
- Temporary QA production dataset was created and removed.
- Unauthenticated request returned 401.
- Short query returned 400.
- `ADMIN` retrieval returned 200, one chunk, and `retrievalLogId`.
- `RT` retrieval returned 200, one chunk, and `retrievalLogId`.
- Missing term returned 200, empty results, and `retrievalLogId`.
- `OPERADOR` returned 403.
- Cross-tenant document access returned 404.
- Three audit logs were validated with expected fields.
- Final production smoke passed.
- No 500 was observed.

## Production Smoke

- `/` returned 200.
- `/login` returned 200.
- `/cadastro` returned 200.
- `/dashboard` redirected with 307 without session.
- `/api/auth/session` returned 200.
- `POST /api/canonical/retrievals` returned 401 without session.

## Residual Risks

- Search is textual and not semantic.
- Retrieval logs store a query preview, so future UI should avoid encouraging sensitive queries.
- No dedicated retrieval log viewer exists yet.
- Ranking remains basic and ordered by document/chunk index.
- Larger corpora may require full-text indexes or a purpose-built retrieval layer.

## Next Phase

The next efficient phase is a Retrieval UI / consulta canonica auditavel.

That phase should expose controlled textual search and retrieval history without adding automatic POP generation, embeddings, LLM calls, LangGraph, or generative RAG.
