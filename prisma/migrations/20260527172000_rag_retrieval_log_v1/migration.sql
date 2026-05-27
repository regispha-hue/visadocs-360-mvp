-- CreateTable
CREATE TABLE "RagRetrievalLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'CANONICAL_SEARCH',
    "queryPreview" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "documentId" TEXT,
    "retrievedChunkIds" JSONB NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "filtersJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RagRetrievalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RagRetrievalLog_tenantId_createdAt_idx" ON "RagRetrievalLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "RagRetrievalLog_tenantId_purpose_idx" ON "RagRetrievalLog"("tenantId", "purpose");

-- CreateIndex
CREATE INDEX "RagRetrievalLog_tenantId_documentId_idx" ON "RagRetrievalLog"("tenantId", "documentId");

-- CreateIndex
CREATE INDEX "RagRetrievalLog_tenantId_queryHash_idx" ON "RagRetrievalLog"("tenantId", "queryHash");

-- AddForeignKey
ALTER TABLE "RagRetrievalLog" ADD CONSTRAINT "RagRetrievalLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
