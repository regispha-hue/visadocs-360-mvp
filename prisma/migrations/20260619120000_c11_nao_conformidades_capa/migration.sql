ALTER TABLE "NaoConformidade"
  ADD COLUMN IF NOT EXISTS "loteId" TEXT,
  ADD COLUMN IF NOT EXISTS "equipamentoId" TEXT,
  ADD COLUMN IF NOT EXISTS "colaboradorId" TEXT,
  ADD COLUMN IF NOT EXISTS "reclamacaoId" TEXT,
  ADD COLUMN IF NOT EXISTS "criadoPorId" TEXT,
  ADD COLUMN IF NOT EXISTS "criadoPorNome" TEXT,
  ADD COLUMN IF NOT EXISTS "investigadoPorId" TEXT,
  ADD COLUMN IF NOT EXISTS "investigadoPorNome" TEXT,
  ADD COLUMN IF NOT EXISTS "dataInvestigacao" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "planoAcao" TEXT,
  ADD COLUMN IF NOT EXISTS "responsavelCapaId" TEXT,
  ADD COLUMN IF NOT EXISTS "responsavelCapaNome" TEXT,
  ADD COLUMN IF NOT EXISTS "prazoImplementacao" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "exigeAprovacaoRt" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "aprovadoPorRtId" TEXT,
  ADD COLUMN IF NOT EXISTS "aprovadoPorRtNome" TEXT,
  ADD COLUMN IF NOT EXISTS "dataAprovacaoRt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dataImplementacao" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "implementadoPorId" TEXT,
  ADD COLUMN IF NOT EXISTS "implementadoPorNome" TEXT,
  ADD COLUMN IF NOT EXISTS "verificacaoEfetividade" TEXT,
  ADD COLUMN IF NOT EXISTS "dataVerificacao" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verificadoPorId" TEXT,
  ADD COLUMN IF NOT EXISTS "verificadoPorNome" TEXT,
  ADD COLUMN IF NOT EXISTS "fechadoPorId" TEXT,
  ADD COLUMN IF NOT EXISTS "fechadoPorNome" TEXT,
  ADD COLUMN IF NOT EXISTS "dataFechamento" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "observacaoFechamento" TEXT,
  ADD COLUMN IF NOT EXISTS "sugestaoTreinamento" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sugestaoRevisaoPop" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "comentarios" JSONB,
  ADD COLUMN IF NOT EXISTS "historico" JSONB;

CREATE INDEX IF NOT EXISTS "NaoConformidade_tenantId_status_idx" ON "NaoConformidade"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "NaoConformidade_tenantId_severidade_idx" ON "NaoConformidade"("tenantId", "severidade");
CREATE INDEX IF NOT EXISTS "NaoConformidade_tenantId_origem_idx" ON "NaoConformidade"("tenantId", "origem");
CREATE INDEX IF NOT EXISTS "NaoConformidade_tenantId_createdAt_idx" ON "NaoConformidade"("tenantId", "createdAt");
