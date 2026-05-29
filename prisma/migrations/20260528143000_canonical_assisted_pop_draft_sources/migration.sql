-- CreateTable
CREATE TABLE "AssistedPopDraftCanonicalSource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assistedPopDraftId" TEXT NOT NULL,
    "canonicalDocumentId" TEXT NOT NULL,
    "canonicalChunkId" TEXT NOT NULL,
    "ragRetrievalLogId" TEXT,
    "chunkIndex" INTEGER NOT NULL,
    "sourceTextPreview" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistedPopDraftCanonicalSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssistedPopDraftCanonicalSource_tenantId_assistedPopDraftId_idx" ON "AssistedPopDraftCanonicalSource"("tenantId", "assistedPopDraftId");

-- CreateIndex
CREATE INDEX "AssistedPopDraftCanonicalSource_tenantId_canonicalChunkId_idx" ON "AssistedPopDraftCanonicalSource"("tenantId", "canonicalChunkId");

-- CreateIndex
CREATE INDEX "AssistedPopDraftCanonicalSource_tenantId_canonicalDocumentId_idx" ON "AssistedPopDraftCanonicalSource"("tenantId", "canonicalDocumentId");

-- CreateIndex
CREATE INDEX "AssistedPopDraftCanonicalSource_tenantId_ragRetrievalLogId_idx" ON "AssistedPopDraftCanonicalSource"("tenantId", "ragRetrievalLogId");

-- CreateIndex
CREATE UNIQUE INDEX "AssistedPopDraftCanonicalSource_assistedPopDraftId_canonicalChunkId_key" ON "AssistedPopDraftCanonicalSource"("assistedPopDraftId", "canonicalChunkId");

-- AddForeignKey
ALTER TABLE "AssistedPopDraftCanonicalSource" ADD CONSTRAINT "AssistedPopDraftCanonicalSource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistedPopDraftCanonicalSource" ADD CONSTRAINT "AssistedPopDraftCanonicalSource_assistedPopDraftId_fkey" FOREIGN KEY ("assistedPopDraftId") REFERENCES "AssistedPopDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistedPopDraftCanonicalSource" ADD CONSTRAINT "AssistedPopDraftCanonicalSource_canonicalDocumentId_fkey" FOREIGN KEY ("canonicalDocumentId") REFERENCES "CanonicalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistedPopDraftCanonicalSource" ADD CONSTRAINT "AssistedPopDraftCanonicalSource_canonicalChunkId_fkey" FOREIGN KEY ("canonicalChunkId") REFERENCES "CanonicalChunk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistedPopDraftCanonicalSource" ADD CONSTRAINT "AssistedPopDraftCanonicalSource_ragRetrievalLogId_fkey" FOREIGN KEY ("ragRetrievalLogId") REFERENCES "RagRetrievalLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
