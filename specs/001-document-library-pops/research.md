# Research: Biblioteca documental com POPs assistidos

## Decision: Extend existing POPs/Biblioteca/Treinamentos modules

**Rationale**: The project already has dashboard pages and API routes for POPs,
Biblioteca de POPs, Treinamentos, Certificados, AuditLog and Prisma models for
tenant-scoped records. Extending these surfaces keeps the change incremental and
reduces regression risk.

**Alternatives considered**:

- Create a separate document management app: rejected because it would duplicate
  auth, tenant scoping, UI and audit behavior.
- Replace the POP model wholesale: rejected because existing POPs, trainings and
  quizzes already depend on it.

## Decision: Introduce explicit lifecycle records around current POPs

**Rationale**: The existing `Pop.status`, `versao`, `validadoEm` and `validadoPor`
fields are useful but not enough for immutable source references, draft lineage,
RT approval decisions and historical training links. New lifecycle/version records
allow audit without mutating past evidence.

**Alternatives considered**:

- Store all lifecycle data in `AuditLog.details`: rejected because it is hard to
  query and validate as a primary domain model.
- Only add more fields to `Pop`: rejected because multiple versions and events
  need a one-to-many history.

## Decision: Add or normalize RT authorization before approval work

**Rationale**: The spec requires only RT approval for operational POP use. Current
code references `"RT"` in permission checks, while the Prisma `UserRole` enum only
lists `SUPER_ADMIN`, `ADMIN` and `OPERADOR`. Planning must include a role strategy
before implementation.

**Alternatives considered**:

- Treat `ADMIN` as RT: rejected for approval semantics because it weakens the
  explicit RT gate.
- Add ad hoc text field checks: rejected because role authorization should be
  consistent and testable.

## Decision: Use fail-closed assisted generation

**Rationale**: Assisted POP generation must depend on tenant library/acervo sources
and remain a draft. If sources are insufficient, generation should be blocked or
produce a clearly incomplete draft requiring human completion, never a confident
regulatory answer.

**Alternatives considered**:

- Generate from generic fallback text: rejected due to regulatory and hallucination
  risk.
- Expose raw RAG/provider responses to the UI: rejected because it risks leaking
  prompts, internal logs or improper claims.

## Decision: New Prisma migrations after baseline only

**Rationale**: The repository has a documented baseline migration and production
constraints in `docs/prisma-baseline-plan.md`. Future schema changes must be
reviewable, generated locally and deployed only after baseline resolution.

**Alternatives considered**:

- `prisma db push`: rejected by project policy for production and unsafe for
  auditable schema evolution.
- Manual production edits: rejected unless separately documented with backup,
  responsible person and evidence.

## Decision: API contracts remain server-side tenant scoped

**Rationale**: Existing API routes use `getServerSession`, user role and tenant
filtering. The new contracts should follow this model while tightening cross-tenant
behavior, especially for library search, approval, history and training linkage.

**Alternatives considered**:

- Client-side tenant filtering: rejected because it cannot enforce isolation.
- Public unauthenticated library endpoints: rejected because library and POP data
  are tenant-scoped operational records.
