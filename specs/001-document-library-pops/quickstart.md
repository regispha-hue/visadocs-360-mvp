# Quickstart: Biblioteca documental com POPs assistidos

## Prerequisites

- Work on branch `001-document-library-pops`.
- Review `docs/regulatory-positioning-policy.md` before writing UI copy.
- Review `docs/prisma-baseline-plan.md` before creating migrations.
- Ensure local `.env` has a safe local database; do not point local migration
  commands at production.

## Local setup

```bash
yarn install
yarn prisma generate
yarn dev
```

## Migration workflow

1. Update `prisma/schema.prisma` with the planned lifecycle/library/version models.
2. Create a local migration only after the baseline is understood:

```bash
yarn prisma migrate dev --name document_library_pops
yarn prisma generate
```

3. Do not use `prisma db push` for this feature.
4. Do not run production `migrate deploy` until the baseline has been resolved as
   documented in `docs/prisma-baseline-plan.md`.

## Manual acceptance path

1. Sign in as a tenant user allowed to browse POP/library content.
2. Open Biblioteca and verify only current tenant items are visible.
3. Create or select a library source and start assisted POP drafting.
4. Confirm the generated result is labeled as minuta/rascunho and cannot be used
   as current or trained.
5. Sign in as RT and approve the reviewed draft.
6. Confirm approval records user, tenant, date/time, version and status.
7. Create a training from the approved POP version.
8. Confirm the training evidence points to the exact approved version.
9. Approve a newer POP version and verify prior training evidence still points to
   the older version.
10. Attempt cross-tenant access/search/export and confirm it is blocked without
    revealing external record existence.

## Verification commands

```bash
yarn lint
yarn prisma generate
```

Optional local migration checks, when a disposable local database is configured:

```bash
yarn prisma migrate dev --name document_library_pops
```

## Regulatory copy checks

- UI must say "minuta", "rascunho", "artefato auxiliar" or "registro operacional"
  before RT approval.
- Exports/evidence must not say "certificacao sanitaria", "aprovado pela Anvisa",
  "conformidade automatica" or "habilitacao profissional".
- Assisted generation must fail closed when sources are insufficient.

## Delivery evidence expected

- Files modified.
- Migration name and local migration result.
- Rationale for role/RT approval handling.
- Tenant isolation checks performed.
- Commands run and results.
- Known risks and next steps.
