-- CreateTable
CREATE TABLE "CanonicalIngestionJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "requestedByUserId" TEXT,
    "requestedByUserName" TEXT,
    "canonicalDocumentId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessageSafe" TEXT,
    "sourceHash" TEXT,
    "normalizedTextHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalIngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT,
    "version" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "libraryItemId" TEXT,
    "approvedPopVersionId" TEXT,
    "sourceHash" TEXT,
    "normalizedTextHash" TEXT,
    "normalizedTextPreview" TEXT,
    "effectiveAt" TIMESTAMP(3),
    "obsoleteAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdByUserName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CanonicalIngestionJob_tenantId_status_idx" ON "CanonicalIngestionJob"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CanonicalIngestionJob_tenantId_sourceType_sourceId_idx" ON "CanonicalIngestionJob"("tenantId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "CanonicalIngestionJob_tenantId_canonicalDocumentId_idx" ON "CanonicalIngestionJob"("tenantId", "canonicalDocumentId");

-- CreateIndex
CREATE INDEX "CanonicalIngestionJob_tenantId_createdAt_idx" ON "CanonicalIngestionJob"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "CanonicalDocument_tenantId_kind_idx" ON "CanonicalDocument"("tenantId", "kind");

-- CreateIndex
CREATE INDEX "CanonicalDocument_tenantId_status_idx" ON "CanonicalDocument"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CanonicalDocument_tenantId_libraryItemId_idx" ON "CanonicalDocument"("tenantId", "libraryItemId");

-- CreateIndex
CREATE INDEX "CanonicalDocument_tenantId_approvedPopVersionId_idx" ON "CanonicalDocument"("tenantId", "approvedPopVersionId");

-- CreateIndex
CREATE INDEX "CanonicalDocument_tenantId_sourceHash_idx" ON "CanonicalDocument"("tenantId", "sourceHash");

-- CreateIndex
CREATE INDEX "CanonicalDocument_tenantId_updatedAt_idx" ON "CanonicalDocument"("tenantId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalDocument_tenantId_sourceType_sourceId_version_key" ON "CanonicalDocument"("tenantId", "sourceType", "sourceId", "version");

-- AddForeignKey
ALTER TABLE "CanonicalIngestionJob" ADD CONSTRAINT "CanonicalIngestionJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalIngestionJob" ADD CONSTRAINT "CanonicalIngestionJob_canonicalDocumentId_fkey" FOREIGN KEY ("canonicalDocumentId") REFERENCES "CanonicalDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalDocument" ADD CONSTRAINT "CanonicalDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalDocument" ADD CONSTRAINT "CanonicalDocument_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "DocumentaryLibraryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalDocument" ADD CONSTRAINT "CanonicalDocument_approvedPopVersionId_fkey" FOREIGN KEY ("approvedPopVersionId") REFERENCES "ApprovedPopVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
