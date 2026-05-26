# Canonical Knowledge Layer Phase 2 API Plan

## Objetivo

Adicionar uma API interna minima para registrar jobs de ingestao canonica a partir de `DocumentaryLibraryItem` existente, sem processar conteudo, sem IA, sem embeddings, sem RAG e sem alterar a UX atual.

## Rota

```http
POST /api/canonical/ingestion-jobs
```

## Payload

```json
{
  "tenantId": "tenant-id-opcional-para-super-admin",
  "libraryItemId": "documentary-library-item-id",
  "sourceType": "DOCUMENTARY_LIBRARY_ITEM"
}
```

Regras:

- `sourceType` aceita somente `DOCUMENTARY_LIBRARY_ITEM` nesta fase.
- `tenantId` e resolvido via sessao para usuarios tenant-scoped.
- `SUPER_ADMIN` deve informar `tenantId`.
- Apenas `SUPER_ADMIN`, `ADMIN` e `RT` podem criar jobs.

## Comportamento

A rota:

1. autentica a sessao;
2. valida permissao;
3. resolve `tenantId`;
4. valida payload;
5. confirma que o item documental pertence ao tenant;
6. bloqueia job ativo duplicado para o mesmo item;
7. bloqueia documento canonico ativo duplicado para o mesmo item;
8. cria `CanonicalDocument` com status `PENDING_REVIEW`;
9. cria `CanonicalIngestionJob` com status `PENDING`;
10. registra `AuditLog`;
11. registra `DocumentLifecycleEvent`.

## O que a rota nao faz

- Nao processa `content`.
- Nao gera hash.
- Nao cria chunks.
- Nao chama IA.
- Nao cria embeddings.
- Nao faz RAG.
- Nao cria POP.
- Nao altera `DocumentaryLibraryItem`.
- Nao altera fluxos atuais de biblioteca, POPs, treinamentos ou auditoria.

## Estados usados nesta fase

Os estados seguem a estrategia TEXT-safe do projeto e nao criam enums PostgreSQL.

`CanonicalIngestionJob.status`:

- `PENDING`

Estados tratados como job ativo para bloqueio de duplicidade:

- `PENDING`
- `QUEUED`
- `PROCESSING`

`CanonicalDocument.status`:

- `PENDING_REVIEW`

Estados tratados como documento ativo para bloqueio de duplicidade:

- `DRAFT`
- `PENDING_REVIEW`
- `ACTIVE`

## Teste manual local

Pre-condicoes:

- banco local/QA com migration da Fase 1 aplicada;
- usuario autenticado com papel `ADMIN`, `RT` ou `SUPER_ADMIN`;
- `DocumentaryLibraryItem` existente no tenant.

Exemplo de chamada, sem imprimir cookies no terminal compartilhado:

```bash
curl -X POST http://localhost:3000/api/canonical/ingestion-jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie-local>" \
  -d '{
    "tenantId": "<tenant-id>",
    "libraryItemId": "<library-item-id>",
    "sourceType": "DOCUMENTARY_LIBRARY_ITEM"
  }'
```

Resultado esperado:

- HTTP `201`;
- `success: true`;
- `ingestionJob.status: "PENDING"`;
- `canonicalDocument.status: "PENDING_REVIEW"`;
- `canonicalDocument.libraryItemId` igual ao item informado;
- uma segunda chamada para o mesmo item retorna `409`.

## Validações técnicas

Executar:

```bash
yarn prisma generate
yarn build
```

## Riscos residuais

- A API ainda nao processa conteudo, portanto o documento canonico e apenas um registro preparatorio.
- Estados sao `String` por compatibilidade com o baseline TEXT-safe; constantes compartilhadas podem ser extraidas em patch futuro.
- Teste manual autenticado exige sessao local valida, mas nao deve expor cookie, token ou senha.
- Proximas fases devem adicionar processamento de conteudo com logs seguros e fail-closed.
