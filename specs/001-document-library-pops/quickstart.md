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

## RT Role Strategy

- The effective baseline documented in `docs/prisma-baseline-plan.md` says
  production role enums were converted to TEXT during prior hotfixes.
- This feature therefore treats `User.role` as TEXT-safe in Prisma
  (`role String @default("OPERADOR")`) and in the migration.
- The feature migration does not depend on `ALTER TYPE "UserRole" ADD VALUE`.
  If a local database still has `User.role` backed by the old enum type, the
  migration converts that column to TEXT while preserving existing values.
- Existing roles are not removed. `RT` is accepted by application guards and
  permission checks as a string role.

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

## Assisted generation source quality

- A selected library item is considered useful for assisted POP generation only
  when its normalized textual content has at least 300 useful characters.
- Normalization collapses excessive spaces and line breaks, ignores title-only
  content and removes evident placeholder phrases before counting useful text.
- Placeholder-like content such as "complete a minuta", "sem conteudo",
  "placeholder", "teste" and "lorem ipsum" must not be enough to generate a
  draft.
- If no selected source reaches this minimum, the API must return 422 with:
  "Selecione ao menos uma fonte documental com conteúdo técnico suficiente para
  gerar a minuta."
- Passing this gate only allows creation of a rascunho/minuta assistida; RT
  review and approval remain mandatory before operational use.

## Delivery evidence expected

- Files modified.
- Migration name and local migration result.
- Rationale for role/RT approval handling.
- Tenant isolation checks performed.
- Commands run and results.
- Known risks and next steps.

## Implementation Evidence - 2026-05-18

### Analyze Status Before Runtime Work

- C1, C2, I1 and U1 were resolved before implementation.
- Coverage after remediation was recorded as 100%.
- No HIGH, MEDIUM or CRITICAL findings were pending.
- D1 and A1 remain LOW documentary debt for future review.

### Pre-Runtime Verification

- Current Prisma baseline reviewed in `docs/prisma-baseline-plan.md`.
- `UserRole` gap confirmed before changes: previous enum was `SUPER_ADMIN`, `ADMIN`, `OPERADOR`.
- RT strategy: normalize `User.role` as TEXT-safe and accept `RT` through application guards/permissions. Production remains gated by the documented baseline flow before deploy.
- Tenant isolation risk found and fixed in POP creation: non-super users no longer use `tenantId` from request body.
- Audit gaps addressed with canonical `DocumentLifecycleEvent` events for library, draft, approval, version, training link and evidence.
- Regulatory copy checklist applied: UI and generated evidence use minuta, rascunho, artefato auxiliar, registro operacional and Responsável Técnico language.

### Migration Evidence

- Migration created: `prisma/migrations/20260518_document_library_pops/migration.sql`.
- Reconciliation migration created after disposable local validation:
  `prisma/migrations/20260519180327_document_library_pops/migration.sql`.
  It drops the legacy `UserRole` enum with `IF EXISTS` after `User.role` is
  TEXT-safe and normalizes the generated `DocumentLifecycleEvent` related-entity
  index name.
- Migration adds RT role handling, library items, assisted drafts, draft sources, approved POP versions, RT approval events, document lifecycle events and optional training snapshot/version fields.
- RT strategy corrected after post-implementation audit: `User.role` is now TEXT-safe to match documented production hotfixes; the migration no longer depends on the PostgreSQL enum type existing.
- `prisma db push` was not used.
- T011 local validation executed on 2026-05-19 against disposable Docker
  PostgreSQL only:
  `postgresql://postgres:****@localhost:55432/visadocs_t011_disposable`.
- The disposable database was recreated from zero tables before the final run.
  `yarn prisma migrate dev --name document_library_pops` applied
  `20260512_baseline_current_schema`, `20260518_document_library_pops` and
  `20260519180327_document_library_pops`, then reported the database in sync
  with `prisma/schema.prisma`.
- Neon, `.env.local`, `.env.production.local`, production, preview and tenant
  real databases were not used or touched.
- Rollback/mitigation: new tables can be dropped and optional `Treinamento` columns removed in reverse migration for local rollback; production rollback must follow backup and baseline rules.

### Verification Commands

```bash
yarn prisma format
yarn prisma generate
yarn lint
yarn tsc --noEmit
rg -n "conformidade automática|aprovado pela Anvisa|homologado pela Anvisa|substitui.*RT|habilitação profissional|certificação sanitária" app lib README.md docs
rg -n "process\\.env|secret|token|prompt|raw|provider|console\\.log|tenantId" app/api/document-library app/api/pops
```

Results:

- `yarn prisma format`: passed after allowing Prisma binary access.
- `yarn prisma generate`: passed after allowing Prisma binary access.
- T011 `yarn prisma migrate dev --name document_library_pops`: passed against
  disposable Docker PostgreSQL on `localhost:55432`.
- `yarn lint`: passed with existing warnings.
- `yarn tsc --noEmit`: passed.
- Forbidden-claims scan returned only policy-document references in `docs/`, not new product claims.
- Sensitive-route scan found expected tenant checks and an existing `app/api/pops/rag/route.ts` environment reference outside the new route set.

### Manual Verification Pending

- T024 completed on 2026-05-19 against disposable local PostgreSQL
  `visadocs_t024_t031_disposable` on `localhost:55433`.
- T031 completed on 2026-05-19 against disposable local PostgreSQL
  `visadocs_t024_t031_disposable` on `localhost:55433`.
- T038 remains open: training linkage has technical evidence, but no manual US3 acceptance result.
- T045 has technical coverage: the POP history UI shows internal trainings tied
  to obsolete approved versions and their relationship to the current approved
  version when available. Manual end-to-end acceptance remains pending in
  T047/T048/T054.
- T046 remains open: admin logs count document events, but do not expose navigable document history.
- T047 and T048 remain open: complete lifecycle reconstruction is pending manual acceptance.
- SC-001 timed manual check remains pending: authorized user must locate a library item, start assisted draft generation, record total time and confirm completion in up to 5 minutes.
- Full manual acceptance remains pending: library -> draft -> RT decision -> approved version -> training -> evidence -> history.

### Functional Acceptance Evidence - T024/T031 - 2026-05-19

- Environment: disposable Docker PostgreSQL only,
  `postgresql://postgres:****@localhost:55433/visadocs_t024_t031_disposable`.
  Neon and `DATABASE_URL` from `.env.local`/`.env.production.local` were not
  used; those files were not modified. `prisma db push` and deploy were not
  used.
- Migrations applied before the test:
  `20260512_baseline_current_schema`, `20260518_document_library_pops` and
  `20260519180327_document_library_pops`.
- Seeded test users in the disposable tenant:
  `ADMIN` (`admin-t024-t031@example.com`), `OPERADOR`
  (`operador-t024-t031@example.com`) and `RT` (`rt-t024-t031@example.com`).
- T024 result: authorized `ADMIN` created and located active library sources;
  a source with useful technical content generated an assisted POP draft and POP
  in `RASCUNHO`; a placeholder/insufficient source returned HTTP `422` with
  `Selecione ao menos uma fonte documental com conteúdo técnico suficiente para gerar a minuta.`
- T031 result: `OPERADOR` approval attempt returned HTTP `403` with
  `Apenas Responsável Técnico pode decidir aprovação documental`; `RT` approval
  returned HTTP `200`, created `ApprovedPopVersion` status `CURRENT` and moved
  the POP to `VIGENTE`; `RT` rejection returned HTTP `200` without approved
  version.
- Lifecycle evidence: `DocumentLifecycleEvent` recorded `GENERATED`,
  `APPROVED` and `REJECTED` events with tenant, document, version, user and
  timestamp; `RTApprovalEvent` recorded both `APPROVED` and `REJECTED`
  decisions under user `RT Aceite`.
- Remaining manual acceptance: T038, T046, T047, T048, T053 and T054 remain
  open; the feature is still not complete and not ready for deploy.

### Post-Implementation Remediation - 2026-05-18

- A1 addressed: T011 was reopened because local `migrate dev` was not executed.
- A2 addressed: role strategy is now TEXT-safe and no longer depends on `ALTER TYPE UserRole`.
- A3 addressed: manual/acceptance tasks were reopened where evidence is not yet sufficient.
- A4 addressed with a small runtime patch: approving a new version now creates `DocumentLifecycleEvent` entries with action `VERSION_OBSOLETED` for prior current approved versions.
- A7 addressed in a small follow-up patch: assisted generation now requires at
  least one selected source with 300 useful normalized characters and blocks
  empty/title-only/placeholder-like content before creating a draft.
- A5 addressed in a small follow-up patch: POP history now exposes trainings
  affected by obsolete approved versions as internal historical records without
  adding new operational actions.
- A6.1 addressed in a minimal follow-up patch: the certificate/evidence route
  now uses `lib/auth-guards.ts` for session retrieval while preserving the
  existing tenant-safe access check and response payload.
- A6 broader standardization, A8 and A9 remain non-blocking follow-up items for a later remediation block.

### Files Modified

- `.gitignore`
- `.eslintignore`
- `prisma/schema.prisma`
- `prisma/migrations/20260518_document_library_pops/migration.sql`
- `lib/types.ts`
- `lib/validations.ts`
- `lib/auth-guards.ts`
- `lib/audit.ts`
- `app/api/document-library/route.ts`
- `app/api/document-library/[id]/history/route.ts`
- `app/api/pops/route.ts`
- `app/api/pops/[id]/route.ts`
- `app/api/pops/[id]/approve/route.ts`
- `app/api/pops/[id]/history/route.ts`
- `app/api/pops/assisted-drafts/route.ts`
- `app/api/pops/assisted-drafts/[id]/history/route.ts`
- `app/api/treinamentos/route.ts`
- `app/api/treinamentos/[id]/route.ts`
- `app/api/treinamentos/[id]/history/route.ts`
- `app/api/certificados/[tentativaId]/route.ts`
- `lib/certificado-pdf.ts`
- `lib/certificado-template.ts`
- `app/(dashboard)/dashboard/biblioteca/page.tsx`
- `app/(dashboard)/dashboard/pops/page.tsx`
- `app/(dashboard)/dashboard/pops/[id]/page.tsx`
- `app/(dashboard)/dashboard/pops/_components/pop-form-dialog.tsx`
- `app/(dashboard)/dashboard/treinamentos/page.tsx`
- `app/(dashboard)/dashboard/treinamentos/_components/treinamento-form-dialog.tsx`
- `app/(dashboard)/admin/logs/page.tsx`
- `specs/001-document-library-pops/tasks.md`
- `specs/001-document-library-pops/quickstart.md`

### Next Steps

- Run the migration against a confirmed disposable local database.
- Execute SC-001 timed check and full manual acceptance with seeded users for `ADMIN`, `RT` and `OPERADOR`.
- Review existing RAG POP route separately for alignment with the new assisted-draft lifecycle.
