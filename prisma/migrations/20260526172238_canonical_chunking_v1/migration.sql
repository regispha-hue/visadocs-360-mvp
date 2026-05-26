-- CreateTable
CREATE TABLE "CanonicalChunk" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "canonicalDocumentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "heading" TEXT,
    "text" TEXT NOT NULL,
    "tokenEstimate" INTEGER NOT NULL,
    "semanticRole" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "sourceHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CanonicalChunk_tenantId_canonicalDocumentId_idx" ON "CanonicalChunk"("tenantId", "canonicalDocumentId");

-- CreateIndex
CREATE INDEX "CanonicalChunk_tenantId_sourceHash_idx" ON "CanonicalChunk"("tenantId", "sourceHash");

-- CreateIndex
CREATE INDEX "CanonicalChunk_tenantId_semanticRole_idx" ON "CanonicalChunk"("tenantId", "semanticRole");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalChunk_tenantId_canonicalDocumentId_chunkIndex_key" ON "CanonicalChunk"("tenantId", "canonicalDocumentId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "CanonicalChunk" ADD CONSTRAINT "CanonicalChunk_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalChunk" ADD CONSTRAINT "CanonicalChunk_canonicalDocumentId_fkey" FOREIGN KEY ("canonicalDocumentId") REFERENCES "CanonicalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
