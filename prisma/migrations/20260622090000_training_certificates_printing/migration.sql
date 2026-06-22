CREATE TABLE IF NOT EXISTS "DocumentoImpressaoLog" (
  "id" TEXT NOT NULL,
  "documentoId" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "usuarioNome" TEXT,
  "tipo" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentoImpressaoLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Certificado" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "usuarioNome" TEXT,
  "colaboradorId" TEXT,
  "colaboradorNome" TEXT,
  "treinamentoId" TEXT NOT NULL,
  "tentativaId" TEXT,
  "arquivoUrl" TEXT NOT NULL,
  "codigoValidacao" TEXT,
  "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validade" TIMESTAMP(3),
  "tenantId" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AlertaTreinamento" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "treinamentoId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "lido" BOOLEAN NOT NULL DEFAULT false,
  "tenantId" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AlertaTreinamento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Certificado_tenantId_treinamentoId_key" ON "Certificado"("tenantId", "treinamentoId");
CREATE INDEX IF NOT EXISTS "Certificado_tenantId_usuarioId_idx" ON "Certificado"("tenantId", "usuarioId");
CREATE INDEX IF NOT EXISTS "Certificado_tenantId_colaboradorId_idx" ON "Certificado"("tenantId", "colaboradorId");
CREATE INDEX IF NOT EXISTS "Certificado_tenantId_validade_idx" ON "Certificado"("tenantId", "validade");

CREATE UNIQUE INDEX IF NOT EXISTS "AlertaTreinamento_usuarioId_treinamentoId_tipo_key" ON "AlertaTreinamento"("usuarioId", "treinamentoId", "tipo");
CREATE INDEX IF NOT EXISTS "AlertaTreinamento_tenantId_usuarioId_lido_idx" ON "AlertaTreinamento"("tenantId", "usuarioId", "lido");
CREATE INDEX IF NOT EXISTS "AlertaTreinamento_tenantId_tipo_idx" ON "AlertaTreinamento"("tenantId", "tipo");
CREATE INDEX IF NOT EXISTS "AlertaTreinamento_tenantId_criadoEm_idx" ON "AlertaTreinamento"("tenantId", "criadoEm");

CREATE INDEX IF NOT EXISTS "DocumentoImpressaoLog_tenantId_documentoId_idx" ON "DocumentoImpressaoLog"("tenantId", "documentoId");
CREATE INDEX IF NOT EXISTS "DocumentoImpressaoLog_tenantId_criadoEm_idx" ON "DocumentoImpressaoLog"("tenantId", "criadoEm");
CREATE INDEX IF NOT EXISTS "DocumentoImpressaoLog_tenantId_usuarioId_idx" ON "DocumentoImpressaoLog"("tenantId", "usuarioId");

DO $$ BEGIN
  ALTER TABLE "DocumentoImpressaoLog"
    ADD CONSTRAINT "DocumentoImpressaoLog_documentoId_fkey"
    FOREIGN KEY ("documentoId") REFERENCES "DocumentaryLibraryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DocumentoImpressaoLog"
    ADD CONSTRAINT "DocumentoImpressaoLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Certificado"
    ADD CONSTRAINT "Certificado_tentativaId_fkey"
    FOREIGN KEY ("tentativaId") REFERENCES "TentativaQuiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Certificado"
    ADD CONSTRAINT "Certificado_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AlertaTreinamento"
    ADD CONSTRAINT "AlertaTreinamento_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
