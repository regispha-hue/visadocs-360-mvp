# Implementation Plan: Biblioteca documental com POPs assistidos

**Branch**: `001-document-library-pops` | **Date**: 2026-05-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-document-library-pops/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Create a tenant-scoped documentary library that supports assisted POP drafting,
mandatory RT review and approval, POP version history, and linkage of approved POP
versions to internal trainings and evidence records. The implementation extends
the existing Next.js dashboard, Prisma/PostgreSQL schema, POPs, Biblioteca,
Treinamentos and AuditLog surfaces with explicit document lifecycle states and
server-side tenant/role gates.

## Technical Context

**Language/Version**: TypeScript 5.2, React 18, Next.js 14 App Router

**Primary Dependencies**: NextAuth.js, Prisma 6.7, PostgreSQL, Zod,
react-hook-form, Tailwind CSS, Radix/Shadcn UI, lucide-react, existing RAG helper
surface under `/api/pops/rag`

**Storage**: PostgreSQL via Prisma ORM, existing S3/document URL fields for files,
tenant-scoped records with `AuditLog` for traceability

**Testing**: `yarn lint`, `yarn prisma generate`, local Prisma migration checks,
manual acceptance through dashboard flows; targeted tests should be added for
tenant isolation, RT approval gates and training linkage when test harness is
introduced

**Target Platform**: Web SaaS dashboard running in Next.js App Router

**Project Type**: Web application with server-side API routes and client dashboard
pages

**Performance Goals**: Authorized users can search/browse library items and start
a draft in under 5 minutes; common list/search interactions should remain
perceptibly responsive for the MVP tenant dataset

**Constraints**: Must preserve tenant isolation, existing auth, audit trail,
regulatory positioning, Prisma baseline migration policy, and the rule that
assisted outputs remain drafts until RT approval

**Scale/Scope**: MVP extension of existing POPs/biblioteca/treinamentos modules
for tenant library items, assisted drafts, RT approval, version history and
training linkage. RQs/manuals may reuse the lifecycle later but are not required
for first implementation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Regulatory positioning**: PASS. The feature text and design classify assisted
  generation as draft/minuta support only. No compliance, Anvisa approval, legal
  certification or RT replacement claim is introduced.
- **RT review flow**: PASS. Drafts cannot become current/approved or be trained
  until RT approval event records actor, role, tenant, date/time and version.
- **Tenant/auth boundary**: PASS. Every planned API contract requires
  `getServerSession`, tenant scoping on server queries and explicit role checks.
  `SUPER_ADMIN` access must remain explicit and tenant-selected.
- **Traceability**: PASS. Data model introduces lifecycle events and immutable
  version references for drafts, approvals, obsolete versions, training links and
  evidence records.
- **Database safety**: PASS WITH REQUIRED CONTROL. New tables/fields require a
  Prisma migration after the baseline. The implementation must not use `prisma db
  push` in production and must follow `docs/prisma-baseline-plan.md`.
- **Sensitive data and claims**: PASS. Contracts avoid returning prompts, secrets,
  sensitive URLs, env vars, cross-tenant personal data and improper regulatory
  claims. Generated text must include auxiliary/draft positioning.
- **Patch discipline**: PASS. Scope is incremental: extend existing modules and
  shared helpers rather than replacing POPs, trainings or auth architecture.
- **Evidence plan**: PASS. Final implementation evidence must list files changed,
  migration commands, lint/generate results, tenant isolation checks, RT gate
  checks, risks and next steps.

## Project Structure

### Documentation (this feature)

```text
specs/001-document-library-pops/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   └── dashboard/
│       ├── biblioteca/
│       │   └── page.tsx
│       ├── pops/
│       │   ├── page.tsx
│       │   ├── [id]/page.tsx
│       │   └── _components/
│       │       └── pop-form-dialog.tsx
│       └── treinamentos/
│           ├── page.tsx
│           └── _components/
│               └── treinamento-form-dialog.tsx
└── api/
    ├── document-library/
    ├── pops/
    │   ├── route.ts
    │   ├── [id]/route.ts
    │   ├── [id]/history/route.ts
    │   ├── [id]/approve/route.ts
    │   └── rag/route.ts
    └── treinamentos/
        └── route.ts

lib/
├── audit.ts
├── auth-options.ts
├── db.ts
├── types.ts
└── validations.ts

prisma/
├── schema.prisma
└── migrations/
```

**Structure Decision**: Use the existing web application layout. Add only the API
routes, dashboard components, Prisma models and shared constants needed for the
documentary library and POP lifecycle. Keep RAG/generation integration behind
server routes and do not expose source prompts or provider internals to the UI.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations are planned.

## Phase 0 Research

See [research.md](./research.md).

## Phase 1 Design

See [data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md), and
[quickstart.md](./quickstart.md).

## Post-Design Constitution Check

- **Regulatory positioning**: PASS. Contracts and quickstart assert draft/minuta
  language and internal operational records.
- **RT review flow**: PASS. Data model separates draft, approval event and
  approved version references; contracts block training links for unapproved POPs.
- **Tenant/auth boundary**: PASS. Contracts require tenant-scoped server checks
  for every read/write/export surface.
- **Traceability**: PASS. Data model includes `DocumentLifecycleEvent`,
  `RTApprovalEvent`, exact POP version references and audit metadata.
- **Database safety**: PASS WITH REQUIRED CONTROL. All schema changes must ship as
  new Prisma migrations after the baseline and be tested locally before deployment.
- **Sensitive data and claims**: PASS. Contracts exclude raw prompts, provider
  internals, secrets and prohibited claims.
- **Patch discipline**: PASS. The design extends existing modules and avoids broad
  replacement of the dashboard, auth or training system.
- **Evidence plan**: PASS. Quickstart lists verification commands and acceptance
  checks expected during implementation.
