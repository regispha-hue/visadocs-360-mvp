-- Document library, assisted POP drafts, RT approval, approved versions and lifecycle events.
-- Production rule: do not deploy before the baseline in docs/prisma-baseline-plan.md is resolved.
-- Role strategy: keep User.role TEXT-safe, matching documented production hotfixes.
-- Existing role values are preserved; RT is accepted by application authorization checks.

DO $$
DECLARE
  role_data_type TEXT;
BEGIN
  SELECT data_type INTO role_data_type
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'User'
    AND column_name = 'role';

  IF role_data_type = 'USER-DEFINED' THEN
    ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
    ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERADOR';
  ELSIF role_data_type = 'text' THEN
    ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERADOR';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "DocumentaryLibraryItem" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "code" TEXT,
  "category" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "version" TEXT,
  "content" TEXT,
  "fileUrl" TEXT,
  "source" TEXT,
  "sourcePopId" TEXT,
  "createdByUserId" TEXT,
  "createdByUserName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentaryLibraryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssistedPopDraft" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "popId" TEXT,
  "title" TEXT NOT NULL,
  "code" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
  "version" TEXT NOT NULL DEFAULT '0.1',
  "objective" TEXT,
  "content" TEXT,
  "notes" TEXT,
  "submittedAt" TIMESTAMP(3),
  "submittedByUserId" TEXT,
  "submittedByUserName" TEXT,
  "createdByUserId" TEXT,
  "createdByUserName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssistedPopDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssistedPopDraftSource" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "draftId" TEXT NOT NULL,
  "libraryItemId" TEXT NOT NULL,
  "sourceTitle" TEXT,
  "sourceVersion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssistedPopDraftSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ApprovedPopVersion" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "popId" TEXT NOT NULL,
  "draftId" TEXT,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CURRENT',
  "contentSnapshot" TEXT,
  "approvedByUserId" TEXT NOT NULL,
  "approvedByUserName" TEXT,
  "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "obsoleteAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApprovedPopVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RTApprovalEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "popId" TEXT NOT NULL,
  "draftId" TEXT,
  "approvedPopVersionId" TEXT,
  "decision" TEXT NOT NULL,
  "statusFrom" TEXT,
  "statusTo" TEXT NOT NULL,
  "version" TEXT,
  "comment" TEXT,
  "userId" TEXT NOT NULL,
  "userName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RTApprovalEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentLifecycleEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "relatedEntityType" TEXT,
  "relatedEntityId" TEXT,
  "action" TEXT NOT NULL,
  "statusFrom" TEXT,
  "statusTo" TEXT,
  "version" TEXT,
  "userId" TEXT,
  "userName" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "DocumentLifecycleEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Treinamento" ADD COLUMN IF NOT EXISTS "approvedPopVersionId" TEXT;
ALTER TABLE "Treinamento" ADD COLUMN IF NOT EXISTS "popCodigoSnapshot" TEXT;
ALTER TABLE "Treinamento" ADD COLUMN IF NOT EXISTS "popTituloSnapshot" TEXT;
ALTER TABLE "Treinamento" ADD COLUMN IF NOT EXISTS "popVersaoSnapshot" TEXT;

CREATE INDEX IF NOT EXISTS "DocumentaryLibraryItem_tenantId_status_idx" ON "DocumentaryLibraryItem"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "DocumentaryLibraryItem_tenantId_type_idx" ON "DocumentaryLibraryItem"("tenantId", "type");
CREATE INDEX IF NOT EXISTS "DocumentaryLibraryItem_tenantId_category_idx" ON "DocumentaryLibraryItem"("tenantId", "category");
CREATE INDEX IF NOT EXISTS "DocumentaryLibraryItem_tenantId_sourcePopId_idx" ON "DocumentaryLibraryItem"("tenantId", "sourcePopId");
CREATE INDEX IF NOT EXISTS "AssistedPopDraft_tenantId_status_idx" ON "AssistedPopDraft"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "AssistedPopDraft_tenantId_popId_idx" ON "AssistedPopDraft"("tenantId", "popId");
CREATE INDEX IF NOT EXISTS "AssistedPopDraft_tenantId_createdAt_idx" ON "AssistedPopDraft"("tenantId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "AssistedPopDraftSource_draftId_libraryItemId_key" ON "AssistedPopDraftSource"("draftId", "libraryItemId");
CREATE INDEX IF NOT EXISTS "AssistedPopDraftSource_tenantId_draftId_idx" ON "AssistedPopDraftSource"("tenantId", "draftId");
CREATE INDEX IF NOT EXISTS "AssistedPopDraftSource_tenantId_libraryItemId_idx" ON "AssistedPopDraftSource"("tenantId", "libraryItemId");
CREATE INDEX IF NOT EXISTS "ApprovedPopVersion_tenantId_popId_idx" ON "ApprovedPopVersion"("tenantId", "popId");
CREATE INDEX IF NOT EXISTS "ApprovedPopVersion_tenantId_status_idx" ON "ApprovedPopVersion"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ApprovedPopVersion_tenantId_approvedAt_idx" ON "ApprovedPopVersion"("tenantId", "approvedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ApprovedPopVersion_tenantId_popId_version_key" ON "ApprovedPopVersion"("tenantId", "popId", "version");
CREATE INDEX IF NOT EXISTS "RTApprovalEvent_tenantId_popId_idx" ON "RTApprovalEvent"("tenantId", "popId");
CREATE INDEX IF NOT EXISTS "RTApprovalEvent_tenantId_draftId_idx" ON "RTApprovalEvent"("tenantId", "draftId");
CREATE INDEX IF NOT EXISTS "RTApprovalEvent_tenantId_decision_idx" ON "RTApprovalEvent"("tenantId", "decision");
CREATE INDEX IF NOT EXISTS "DocumentLifecycleEvent_tenantId_entityType_entityId_idx" ON "DocumentLifecycleEvent"("tenantId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "DocumentLifecycleEvent_tenantId_relatedEntityType_relatedEntityId_idx" ON "DocumentLifecycleEvent"("tenantId", "relatedEntityType", "relatedEntityId");
CREATE INDEX IF NOT EXISTS "DocumentLifecycleEvent_tenantId_action_idx" ON "DocumentLifecycleEvent"("tenantId", "action");
CREATE INDEX IF NOT EXISTS "DocumentLifecycleEvent_tenantId_occurredAt_idx" ON "DocumentLifecycleEvent"("tenantId", "occurredAt");
CREATE INDEX IF NOT EXISTS "Treinamento_tenantId_popId_idx" ON "Treinamento"("tenantId", "popId");
CREATE INDEX IF NOT EXISTS "Treinamento_tenantId_approvedPopVersionId_idx" ON "Treinamento"("tenantId", "approvedPopVersionId");

ALTER TABLE "DocumentaryLibraryItem" ADD CONSTRAINT "DocumentaryLibraryItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentaryLibraryItem" ADD CONSTRAINT "DocumentaryLibraryItem_sourcePopId_fkey" FOREIGN KEY ("sourcePopId") REFERENCES "Pop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssistedPopDraft" ADD CONSTRAINT "AssistedPopDraft_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistedPopDraft" ADD CONSTRAINT "AssistedPopDraft_popId_fkey" FOREIGN KEY ("popId") REFERENCES "Pop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssistedPopDraftSource" ADD CONSTRAINT "AssistedPopDraftSource_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "AssistedPopDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistedPopDraftSource" ADD CONSTRAINT "AssistedPopDraftSource_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "DocumentaryLibraryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovedPopVersion" ADD CONSTRAINT "ApprovedPopVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovedPopVersion" ADD CONSTRAINT "ApprovedPopVersion_popId_fkey" FOREIGN KEY ("popId") REFERENCES "Pop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovedPopVersion" ADD CONSTRAINT "ApprovedPopVersion_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "AssistedPopDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RTApprovalEvent" ADD CONSTRAINT "RTApprovalEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RTApprovalEvent" ADD CONSTRAINT "RTApprovalEvent_popId_fkey" FOREIGN KEY ("popId") REFERENCES "Pop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RTApprovalEvent" ADD CONSTRAINT "RTApprovalEvent_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "AssistedPopDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RTApprovalEvent" ADD CONSTRAINT "RTApprovalEvent_approvedPopVersionId_fkey" FOREIGN KEY ("approvedPopVersionId") REFERENCES "ApprovedPopVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentLifecycleEvent" ADD CONSTRAINT "DocumentLifecycleEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Treinamento" ADD CONSTRAINT "Treinamento_approvedPopVersionId_fkey" FOREIGN KEY ("approvedPopVersionId") REFERENCES "ApprovedPopVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
