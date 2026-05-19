# Data Model: Biblioteca documental com POPs assistidos

## Entity: DocumentaryLibraryItem

Represents a tenant-scoped source item in the documentary library/acervo.

**Fields**:

- `id`: unique identifier
- `tenantId`: owning tenant
- `type`: POP_MODEL, POP_APPROVED, RQ, MANUAL, ANNEX, SUPPORTING_REFERENCE
- `title`: display title
- `code`: optional document code
- `category`: sector/category for browsing
- `status`: DRAFT, ACTIVE, OBSOLETE, ARCHIVED
- `version`: source item version
- `content`: searchable source content or normalized text
- `fileUrl`: optional stored file URL
- `sourcePopId`: optional existing POP source
- `createdByUserId`: creator/importer
- `createdAt`, `updatedAt`

**Relationships**:

- Belongs to `Tenant`
- May reference `Pop`
- May be referenced by `AssistedPopDraftSource`

**Validation Rules**:

- `tenantId`, `type`, `title`, `status` are required.
- Search and reads must always filter by tenant unless user is `SUPER_ADMIN` with
  explicit tenant selection.
- Obsolete or archived items may be visible for history but should not be default
  generation sources.

## Entity: AssistedPopDraft

Represents a draft/minuta generated or adapted from library sources.

**Fields**:

- `id`: unique identifier
- `tenantId`: owning tenant
- `popId`: optional linked `Pop` record when draft is materialized as POP
- `title`, `code`, `sector`
- `content`: draft content
- `status`: DRAFT, IN_REVIEW, REJECTED, APPROVED, CURRENT, OBSOLETE, ARCHIVED
- `draftVersion`: draft revision label
- `generatedByUserId`: user who started assisted generation
- `generationMode`: LIBRARY_ASSISTED, MANUAL_ADAPTATION, RAG_ASSISTED
- `insufficientSources`: boolean flag when generation cannot proceed confidently
- `reviewNotes`: RT or reviewer notes
- `createdAt`, `updatedAt`

**Relationships**:

- Belongs to `Tenant`
- Created by `User`
- Has many `AssistedPopDraftSource`
- Has many `DocumentLifecycleEvent`
- May produce one or more `ApprovedPopVersion`

**Validation Rules**:

- Drafts are never trainable.
- Drafts must retain source references or an explicit insufficient-source marker.
- Status changes must create lifecycle events.

## Entity: AssistedPopDraftSource

Join record between an assisted draft and its library sources.

**Fields**:

- `id`
- `tenantId`
- `draftId`
- `libraryItemId`
- `sourceVersion`
- `snippetSummary`: short non-sensitive source summary
- `createdAt`

**Validation Rules**:

- `tenantId` must match both draft and library item.
- Do not store raw prompts, provider logs or secrets.

## Entity: ApprovedPopVersion

Immutable reference to a POP version approved by the RT.

**Fields**:

- `id`
- `tenantId`
- `popId`
- `draftId`: optional source draft
- `code`
- `title`
- `version`
- `status`: APPROVED, CURRENT, OBSOLETE, ARCHIVED
- `approvedByUserId`
- `approvedAt`
- `effectiveFrom`
- `obsoleteAt`
- `contentSnapshot`
- `sourceEventId`
- `createdAt`

**Relationships**:

- Belongs to `Tenant`
- Belongs to `Pop`
- Has one or more `RTApprovalEvent`
- Referenced by `TrainingAssignment`/`Treinamento` records

**Validation Rules**:

- Only RT approval creates an approved version.
- Existing training evidence must keep the approved version used at the time of
  training, even after later versions are approved.

## Entity: RTApprovalEvent

Records a review decision by the Responsável Técnico.

**Fields**:

- `id`
- `tenantId`
- `draftId`
- `popId`
- `approvedPopVersionId`: set on approval
- `reviewedByUserId`
- `decision`: APPROVED, REJECTED, CHANGES_REQUESTED
- `notes`
- `createdAt`

**Validation Rules**:

- `reviewedByUserId` must have RT approval permission.
- Approval must atomically create/update the approved version and lifecycle event.

## Entity: TrainingAssignment

Planned internal training tied to an exact approved POP version.

**Fields**:

- Existing `Treinamento` fields remain.
- Add `approvedPopVersionId` or equivalent immutable version reference.
- Preserve `popId`, `colaboradorId`, `tenantId`, `status`, dates and instructor.

**Validation Rules**:

- New trainings must require an approved/current POP version.
- Draft, rejected and obsolete POPs are blocked unless a documented corrective
  workflow explicitly allows historical retraining.

## Entity: TrainingEvidenceRecord

Operational evidence of ciência, leitura, avaliação or completion.

**Fields**:

- Existing quiz/certificate/training evidence fields remain.
- Add or expose exact `approvedPopVersionId`, POP code/title/version snapshot,
  collaborator, tenant, completion date/time, status and responsible user.

**Validation Rules**:

- Evidence must use internal operational language.
- Evidence must not claim sanitary compliance, Anvisa approval or professional
  habilitation.

## Entity: DocumentLifecycleEvent

Immutable event log for library items, drafts, POP versions and training links.

**Fields**:

- `id`
- `tenantId`
- `entityType`: LIBRARY_ITEM, POP_DRAFT, POP_VERSION, TRAINING, EVIDENCE
- `entityId`
- `action`: CREATED, GENERATED, EDITED, SUBMITTED_FOR_REVIEW, APPROVED, REJECTED,
  MADE_CURRENT, OBSOLETED, LINKED_TO_TRAINING, EVIDENCE_CREATED, EXPORTED
- `fromStatus`, `toStatus`
- `version`
- `userId`, `userName`
- `details`: structured non-sensitive metadata
- `createdAt`

**Validation Rules**:

- Events are append-only.
- Details must not include secrets, raw prompts, internal logs or cross-tenant data.

## State Transitions

```text
Library item: DRAFT -> ACTIVE -> OBSOLETE -> ARCHIVED

Assisted POP draft:
DRAFT -> IN_REVIEW -> APPROVED -> CURRENT -> OBSOLETE
DRAFT -> IN_REVIEW -> REJECTED
REJECTED -> DRAFT

Training:
PENDENTE -> EM_AVALIACAO -> CONCLUIDO
Only APPROVED/CURRENT POP versions may start the training path.
```

## Migration Notes

- Add new models through a Prisma migration after `20260512_baseline_current_schema`.
- Add RT role support explicitly before approval enforcement. If the production
  role column is text, document migration behavior; if it is an enum, add values
  safely before inserting RT users.
- Add indexes on tenant/status/category/search fields and on version/history
  foreign keys.
- Do not delete existing POP, Treinamento or AuditLog data.
