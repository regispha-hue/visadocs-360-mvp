ALTER TABLE "NaoConformidade"
  ADD COLUMN "loteId" TEXT,
  ADD COLUMN "equipamentoId" TEXT,
  ADD COLUMN "colaboradorId" TEXT,
  ADD COLUMN "reclamacaoId" TEXT,
  ADD COLUMN "criadoPorId" TEXT,
  ADD COLUMN "criadoPorNome" TEXT,
  ADD COLUMN "investigadoPorId" TEXT,
  ADD COLUMN "investigadoPorNome" TEXT,
  ADD COLUMN "dataInvestigacao" TIMESTAMP(3),
  ADD COLUMN "planoAcao" TEXT,
  ADD COLUMN "responsavelCapaId" TEXT,
  ADD COLUMN "responsavelCapaNome" TEXT,
  ADD COLUMN "prazoImplementacao" TIMESTAMP(3),
  ADD COLUMN "exigeAprovacaoRt" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "aprovadoPorRtId" TEXT,
  ADD COLUMN "aprovadoPorRtNome" TEXT,
  ADD COLUMN "dataAprovacaoRt" TIMESTAMP(3),
  ADD COLUMN "dataImplementacao" TIMESTAMP(3),
  ADD COLUMN "implementadoPorId" TEXT,
  ADD COLUMN "implementadoPorNome" TEXT,
  ADD COLUMN "verificacaoEfetividade" TEXT,
  ADD COLUMN "dataVerificacao" TIMESTAMP(3),
  ADD COLUMN "verificadoPorId" TEXT,
  ADD COLUMN "verificadoPorNome" TEXT,
  ADD COLUMN "fechadoPorId" TEXT,
  ADD COLUMN "fechadoPorNome" TEXT,
  ADD COLUMN "dataFechamento" TIMESTAMP(3),
  ADD COLUMN "observacaoFechamento" TEXT,
  ADD COLUMN "sugestaoTreinamento" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sugestaoRevisaoPop" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "comentarios" JSONB,
  ADD COLUMN "historico" JSONB;

CREATE INDEX "NaoConformidade_tenantId_status_idx" ON "NaoConformidade"("tenantId", "status");
CREATE INDEX "NaoConformidade_tenantId_severidade_idx" ON "NaoConformidade"("tenantId", "severidade");
CREATE INDEX "NaoConformidade_tenantId_origem_idx" ON "NaoConformidade"("tenantId", "origem");
CREATE INDEX "NaoConformidade_tenantId_createdAt_idx" ON "NaoConformidade"("tenantId", "createdAt");
