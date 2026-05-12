-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERADOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERADOR',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "responsavel" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'ATIVO',
    "trialEndsAt" TIMESTAMP(3),
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pop" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "setor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "versao" TEXT NOT NULL DEFAULT '1.0',
    "validadeAnos" INTEGER NOT NULL DEFAULT 2,
    "validadoEm" TIMESTAMP(3),
    "validadoPor" TEXT,
    "implantadoEm" TIMESTAMP(3),
    "implantadoPor" TEXT,
    "dataRevisao" TIMESTAMP(3),
    "responsavel" TEXT,
    "objetivo" TEXT,
    "descricao" TEXT,
    "equipeEnvolvida" TEXT,
    "glossario" TEXT,
    "literaturaConsultada" TEXT,
    "conteudo" TEXT,
    "arquivoUrl" TEXT,
    "arquivoNome" TEXT,
    "arquivoPublic" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "funcao" TEXT,
    "setor" TEXT,
    "cpf" TEXT,
    "cpfHash" TEXT,
    "cpfMasked" TEXT,
    "dataAdmissao" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treinamento" (
    "id" TEXT NOT NULL,
    "popId" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "dataTreinamento" TIMESTAMP(3) NOT NULL,
    "duracao" INTEGER,
    "instrutor" TEXT,
    "observacoes" TEXT,
    "notaQuiz" INTEGER,
    "aprovadoQuiz" BOOLEAN,
    "status" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treinamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "popId" TEXT NOT NULL,
    "notaMinima" INTEGER NOT NULL DEFAULT 70,
    "questoesData" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questao" (
    "id" TEXT NOT NULL,
    "pergunta" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "quizId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternativa" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,
    "questaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alternativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaQuiz" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "treinamentoId" TEXT NOT NULL,
    "nota" INTEGER,
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "codigoValidacao" TEXT,
    "completadoEm" TIMESTAMP(3),
    "acertos" INTEGER,
    "totalQuestoes" INTEGER,
    "respostasData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resposta" (
    "id" TEXT NOT NULL,
    "tentativaQuizId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "alternativaId" TEXT,
    "correta" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risco" (
    "id" TEXT NOT NULL,
    "nivelRisco" INTEGER NOT NULL,
    "descricao" TEXT,
    "setor" TEXT,
    "categoria" TEXT,
    "probabilidade" INTEGER,
    "impacto" INTEGER,
    "tipo" TEXT,
    "severidade" TEXT,
    "planoAcao" TEXT,
    "responsavelPlano" TEXT,
    "prazoPlano" TIMESTAMP(3),
    "criadoPor" TEXT,
    "criadoEm" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "popId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NaoConformidade" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT,
    "descricao" TEXT,
    "setor" TEXT,
    "tipo" TEXT,
    "severidade" TEXT,
    "status" TEXT NOT NULL,
    "origem" TEXT,
    "dataOcorrencia" TIMESTAMP(3),
    "dataIdentificacao" TIMESTAMP(3),
    "reportadoPor" TEXT,
    "riscoId" TEXT,
    "popId" TEXT,
    "causaRaiz" TEXT,
    "acoesCorretivas" TEXT,
    "prazoCorrecao" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NaoConformidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "resultado" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaRisco" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT,
    "severidade" TEXT,
    "status" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "auditorId" TEXT,
    "auditorLider" TEXT,
    "auditores" JSONB,
    "setores" JSONB,
    "pops" JSONB,
    "criterios" JSONB,
    "tenantId" TEXT NOT NULL,
    "auditoriaId" TEXT,
    "riscoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditoriaRisco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Norma" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "numero" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT,
    "versao" TEXT,
    "dataAtualizacao" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Norma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaNorma" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidade" TEXT,
    "prioridade" INTEGER,
    "descricao" TEXT,
    "status" TEXT NOT NULL,
    "dataAlerta" TIMESTAMP(3),
    "normaId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaNorma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificacaoPratica" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "dataAgendamento" TIMESTAMP(3),
    "duracaoEstimada" INTEGER,
    "observacoes" TEXT,
    "status" TEXT NOT NULL,
    "nota" INTEGER,
    "aprovado" BOOLEAN,
    "supervisor" TEXT,
    "treinamentoId" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "popId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificacaoPratica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "versao" TEXT,
    "conteudo" TEXT,
    "arquivoUrl" TEXT,
    "popId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "contato" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaPrima" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "casNumber" TEXT,
    "dci" TEXT,
    "categoria" TEXT,
    "unidadeMedida" TEXT,
    "estoqueMinimo" DOUBLE PRECISION,
    "especificacoes" TEXT,
    "certificadoUrl" TEXT,
    "certificadoNome" TEXT,
    "certificadoPublic" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "fornecedorId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopMateriaPrima" (
    "id" TEXT NOT NULL,
    "popId" TEXT NOT NULL,
    "materiaPrimaId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION,
    "observacoes" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PopMateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" TEXT NOT NULL,
    "numeroLote" TEXT NOT NULL,
    "loteInterno" TEXT,
    "dataFabricacao" TIMESTAMP(3),
    "dataValidade" TIMESTAMP(3),
    "dataRecebimento" TIMESTAMP(3),
    "quantidade" DOUBLE PRECISION,
    "quantidadeAtual" DOUBLE PRECISION,
    "precoUnitario" DOUBLE PRECISION,
    "notaFiscal" TEXT,
    "certificadoUrl" TEXT,
    "certificadoNome" TEXT,
    "certificadoPublic" BOOLEAN NOT NULL DEFAULT false,
    "laudoUrl" TEXT,
    "laudoNome" TEXT,
    "laudoPublic" BOOLEAN NOT NULL DEFAULT false,
    "analises" JSONB,
    "observacoes" TEXT,
    "statusRisco" TEXT,
    "validadeRisco" TIMESTAMP(3),
    "classificacaoRisco" TEXT,
    "armazenamento" TEXT,
    "condicoes" TEXT,
    "localizacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "materiaPrimaId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaFiscalizacao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "dataGeracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataExpiracao" TIMESTAMP(3) NOT NULL,
    "qrCode" TEXT,
    "codigoAcesso" TEXT,
    "responsaveis" JSONB,
    "masterListPOPs" JSONB,
    "certificados" JSONB,
    "cronogramaValidades" JSONB,
    "acessos" JSONB,
    "anotacoes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditoriaFiscalizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RiscoNaoConformidades" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RiscoNaoConformidades_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AuditoriaToRisco" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AuditoriaToRisco_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pop_codigo_key" ON "Pop"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_popId_key" ON "Quiz"("popId");

-- CreateIndex
CREATE INDEX "_RiscoNaoConformidades_B_index" ON "_RiscoNaoConformidades"("B");

-- CreateIndex
CREATE INDEX "_AuditoriaToRisco_B_index" ON "_AuditoriaToRisco"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pop" ADD CONSTRAINT "Pop_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treinamento" ADD CONSTRAINT "Treinamento_popId_fkey" FOREIGN KEY ("popId") REFERENCES "Pop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treinamento" ADD CONSTRAINT "Treinamento_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treinamento" ADD CONSTRAINT "Treinamento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_popId_fkey" FOREIGN KEY ("popId") REFERENCES "Pop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternativa" ADD CONSTRAINT "Alternativa_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaQuiz" ADD CONSTRAINT "TentativaQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaQuiz" ADD CONSTRAINT "TentativaQuiz_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaQuiz" ADD CONSTRAINT "TentativaQuiz_treinamentoId_fkey" FOREIGN KEY ("treinamentoId") REFERENCES "Treinamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_tentativaQuizId_fkey" FOREIGN KEY ("tentativaQuizId") REFERENCES "TentativaQuiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risco" ADD CONSTRAINT "Risco_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risco" ADD CONSTRAINT "Risco_popId_fkey" FOREIGN KEY ("popId") REFERENCES "Pop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NaoConformidade" ADD CONSTRAINT "NaoConformidade_riscoId_fkey" FOREIGN KEY ("riscoId") REFERENCES "Risco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NaoConformidade" ADD CONSTRAINT "NaoConformidade_popId_fkey" FOREIGN KEY ("popId") REFERENCES "Pop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NaoConformidade" ADD CONSTRAINT "NaoConformidade_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaRisco" ADD CONSTRAINT "AuditoriaRisco_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaRisco" ADD CONSTRAINT "AuditoriaRisco_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaRisco" ADD CONSTRAINT "AuditoriaRisco_riscoId_fkey" FOREIGN KEY ("riscoId") REFERENCES "Risco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Norma" ADD CONSTRAINT "Norma_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaNorma" ADD CONSTRAINT "AlertaNorma_normaId_fkey" FOREIGN KEY ("normaId") REFERENCES "Norma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaNorma" ADD CONSTRAINT "AlertaNorma_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificacaoPratica" ADD CONSTRAINT "VerificacaoPratica_treinamentoId_fkey" FOREIGN KEY ("treinamentoId") REFERENCES "Treinamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificacaoPratica" ADD CONSTRAINT "VerificacaoPratica_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificacaoPratica" ADD CONSTRAINT "VerificacaoPratica_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_popId_fkey" FOREIGN KEY ("popId") REFERENCES "Pop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaPrima" ADD CONSTRAINT "MateriaPrima_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaPrima" ADD CONSTRAINT "MateriaPrima_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopMateriaPrima" ADD CONSTRAINT "PopMateriaPrima_popId_fkey" FOREIGN KEY ("popId") REFERENCES "Pop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopMateriaPrima" ADD CONSTRAINT "PopMateriaPrima_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopMateriaPrima" ADD CONSTRAINT "PopMateriaPrima_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaFiscalizacao" ADD CONSTRAINT "AuditoriaFiscalizacao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RiscoNaoConformidades" ADD CONSTRAINT "_RiscoNaoConformidades_A_fkey" FOREIGN KEY ("A") REFERENCES "NaoConformidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RiscoNaoConformidades" ADD CONSTRAINT "_RiscoNaoConformidades_B_fkey" FOREIGN KEY ("B") REFERENCES "Risco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditoriaToRisco" ADD CONSTRAINT "_AuditoriaToRisco_A_fkey" FOREIGN KEY ("A") REFERENCES "Auditoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditoriaToRisco" ADD CONSTRAINT "_AuditoriaToRisco_B_fkey" FOREIGN KEY ("B") REFERENCES "Risco"("id") ON DELETE CASCADE ON UPDATE CASCADE;
