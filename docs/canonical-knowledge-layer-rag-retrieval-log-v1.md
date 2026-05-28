# RagRetrievalLog v1

Status: draft implementation scope
Phase: v1.3 Canonical Knowledge Layer

## Objective

`RagRetrievalLog v1` introduces auditable textual retrieval over `CanonicalChunk` records.

This phase does not add AI generation, embeddings, LangGraph, automatic POP generation, or generative RAG.

## Endpoint

`POST /api/canonical/retrievals`

Body:

```json
{
  "q": "texto",
  "documentId": "opcional",
  "purpose": "CANONICAL_SEARCH",
  "limit": 10
}
```

## Behavior

- Requires an authenticated session.
- Requires a tenant.
- Initially allows `ADMIN` and `RT`.
- Requires `q` with at least 2 characters.
- Uses default limit `10` and maximum `20`.
- Searches `CanonicalChunk.text` and `CanonicalChunk.heading` with simple textual matching.
- Always scopes results by `tenantId`.
- If `documentId` is provided, validates that the document belongs to the tenant.
- Returns matching chunks and `retrievalLogId`.
- Creates `RagRetrievalLog` for both non-empty and empty results.

## Logged Data

- `queryPreview`: normalized and truncated query preview.
- `queryHash`: SHA-256 hash of the normalized query.
- `retrievedChunkIds`: IDs returned by the retrieval.
- `resultCount`: number of returned chunks.
- `filtersJson`: non-sensitive retrieval filters.

## Limits

- No generated answer is produced.
- No LLM or embedding service is called.
- No semantic ranking is performed.
- This is an auditable text retrieval layer, not a generative RAG feature.

## Validation Targets

- Unauthenticated request returns 401.
- User without tenant is blocked.
- Short query returns 400.
- Existing term returns 200 and creates a retrieval log.
- Missing term returns 200 with empty results and creates a retrieval log.
- Cross-tenant document access returns 404.
- No 500 is observed.
