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
- Migration adds RT role handling, library items, assisted drafts, draft sources, approved POP versions, RT approval events, document lifecycle events and optional training snapshot/version fields.
- RT strategy corrected after post-implementation audit: `User.role` is now TEXT-safe to match documented production hotfixes; the migration no longer depends on the PostgreSQL enum type existing.
- `prisma db push` was not used.
- `yarn prisma migrate dev --name document_library_pops` was not executed because no disposable local database was confirmed in this run. The SQL migration is present for local review and must not be deployed to production until the baseline in `docs/prisma-baseline-plan.md` is resolved.
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
- `yarn lint`: passed with existing warnings.
- `yarn tsc --noEmit`: passed.
- Forbidden-claims scan returned only policy-document references in `docs/`, not new product claims.
- Sensitive-route scan found expected tenant checks and an existing `app/api/pops/rag/route.ts` environment reference outside the new route set.

### Manual Verification Pending

- T011 remains open: migration SQL exists, but `yarn prisma migrate dev --name document_library_pops` still needs a confirmed disposable local database.
- T024 remains open: US1 has technical evidence, but no timed/manual acceptance result.
- T031 remains open: RT/non-RT gate has technical evidence, but no manual role test result.
- T038 remains open: training linkage has technical evidence, but no manual US3 acceptance result.
- T045 remains open: API returns training/version data, but UI does not yet show affected trainings after a new version.
- T046 remains open: admin logs count document events, but do not expose navigable document history.
- T047 and T048 remain open: complete lifecycle reconstruction is pending manual acceptance.
- SC-001 timed manual check remains pending: authorized user must locate a library item, start assisted draft generation, record total time and confirm completion in up to 5 minutes.
- Full manual acceptance remains pending: library -> draft -> RT decision -> approved version -> training -> evidence -> history.

### Post-Implementation Remediation - 2026-05-18

- A1 addressed: T011 was reopened because local `migrate dev` was not executed.
- A2 addressed: role strategy is now TEXT-safe and no longer depends on `ALTER TYPE UserRole`.
- A3 addressed: manual/acceptance tasks were reopened where evidence is not yet sufficient.
- A4 addressed with a small runtime patch: approving a new version now creates `DocumentLifecycleEvent` entries with action `VERSION_OBSOLETED` for prior current approved versions.
- A5, A6, A7, A8 and A9 remain non-blocking follow-up items for a later remediation block.

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
