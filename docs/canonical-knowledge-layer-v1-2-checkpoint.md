# Canonical Knowledge Layer v1.2 Checkpoint

Status: accepted for controlled use
Tag target: v1.2.0-canonical-chunk-viewer
Scope: Canonical Chunk Viewer read-only

## Summary

The v1.2 Canonical Chunk Viewer adds a read-only way to inspect the chunks generated for a `CanonicalDocument`.

This checkpoint does not add AI generation, embeddings, generative RAG, LangGraph, schema changes, or new migrations.

## Implemented

- `GET /api/canonical/documents/[id]/chunks?q=&limit=&cursor=`
- Authenticated, tenant-scoped chunk listing.
- Validation that the canonical document belongs to the logged tenant.
- Chunks ordered by `chunkIndex`.
- Simple textual search over `text` and `heading`.
- Default limit of 20 and maximum limit of 50.
- Cursor pagination by `chunkIndex`.
- UI action "Ver chunks" in the Biblioteca Canonica section.
- Read-only panel with chunk index, heading, semantic role, token estimate, source hash preview, and text excerpt.
- Loading, empty, and error states.
- No delete, edit, reprocess, AI, embedding, or RAG action.

## Validated

- Preview QA:
  - unauthenticated GET returned 401;
  - authenticated ADMIN GET returned 200;
  - existing text query returned filtered chunks;
  - non-existing text query returned an empty result without 500;
  - cross-tenant access was blocked with 404;
  - UI/API shape was compatible;
  - QA Preview dataset was removed.

- Production QA:
  - temporary tenant, ADMIN user, canonical document, and chunks were created;
  - authenticated session succeeded;
  - `GET /api/canonical/documents/[id]/chunks` returned 200;
  - existing text query returned one chunk;
  - non-existing text query returned empty result without 500;
  - cross-tenant access was blocked with 404;
  - `/dashboard/biblioteca` authenticated route returned 200;
  - QA production dataset was removed;
  - final smoke passed.

## Production Smoke

- `/` returned 200.
- `/login` returned 200.
- `/cadastro` returned 200.
- `/dashboard` redirected with 307 without session.
- `/api/auth/session` returned 200.
- `GET /api/canonical/documents/fake-id/chunks` returned 401 without session.
- No 500 was observed.

## Residual Risks

- Text search is intentionally simple and not a semantic retrieval system.
- Very large chunk sets may require richer pagination or a dedicated document detail view later.
- Query text is not yet audited in a dedicated retrieval log.
- Search performance may need database-level tuning if canonical corpora grow significantly.

## Next Phase

The next phase is `RagRetrievalLog v1`.

It should add auditable retrieval logging before any generative RAG or POP generation work. The next phase should still avoid automatic POP generation until retrieval logs, privacy boundaries, tenant safety, and regulatory wording are validated.
