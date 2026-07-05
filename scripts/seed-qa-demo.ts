// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const QA = {
  tenantName: "Farmácia Demonstração",
  tenantCnpj: "00999999000191",
  adminEmail: "qa.admin.demo@visadocs.local",
  rtEmail: "qa.rt.demo@visadocs.local",
  operadorEmail: "qa.operador.demo@visadocs.local",
  password: "QA-Demo-Visadocs-2026!",
  popDraftCode: "QA-POP-RASCUNHO-001",
  popApprovedCode: "QA-POP-APROVADO-001",
  libraryCodeUseful: "QA-FONTE-UTIL-001",
  libraryCodeInsufficient: "QA-FONTE-INSUF-001",
};

function assertSafeEnvironment() {
  if (process.env.VISADOCS_QA_SEED_CONFIRM !== "true") {
    throw new Error("Abortado: defina VISADOCS_QA_SEED_CONFIRM=true para executar este seed QA.");
  }

  const databaseUrl = process.env.DATABASE_URL || "";
  const nodeEnv = process.env.NODE_ENV || "";
  const vercelEnv = process.env.VERCEL_ENV || "";

  const productionSignals = [
    nodeEnv === "production",
    vercelEnv === "production",
    /visadocs-360-mvp\.vercel\.app/i.test(process.env.NEXTAUTH_URL || ""),
    /prod|production/i.test(databaseUrl),
  ];

  if (productionSignals.some(Boolean)) {
    throw new Error("Abortado: ambiente parece produção/remoto sensível. Use apenas QA, Preview ou Postgres local descartável.");
  }

  if (!/localhost|127\.0\.0\.1|preview|qa|demo|test/i.test(databaseUrl)) {
    throw new Error("Abortado: DATABASE_URL não parece apontar para ambiente local/QA/Preview seguro.");
  }
}

async function deleteExistingQaData(tenantId: string) {
  const pops = await prisma.pop.findMany({
    where: { tenantId },
    select: { id: true },
  });
  const popIds = pops.map((pop) => pop.id);
  const treinamentos = await prisma.treinamento.findMany({
    where: { tenantId },
    select: { id: true },
  });
  const treinamentoIds = treinamentos.map((treinamento) => treinamento.id);
  const quizzes = await prisma.quiz.findMany({
    where: { tenantId },
    select: { id: true },
  });
  const quizIds = quizzes.map((quiz) => quiz.id);
  const tentativas = await prisma.tentativaQuiz.findMany({
    where: { treinamentoId: { in: treinamentoIds } },
    select: { id: true },
  });
  const tentativaIds = tentativas.map((tentativa) => tentativa.id);

  await prisma.resposta.deleteMany({ where: { tentativaQuizId: { in: tentativaIds } } });
  await prisma.tentativaQuiz.deleteMany({
    where: { treinamentoId: { in: treinamentoIds } },
  });
  await prisma.alternativa.deleteMany({ where: { questao: { quizId: { in: quizIds } } } });
  await prisma.questao.deleteMany({ where: { quizId: { in: quizIds } } });
  await prisma.quiz.deleteMany({ where: { tenantId } });
  await prisma.verificacaoPratica.deleteMany({ where: { tenantId } });
  await prisma.treinamento.deleteMany({ where: { tenantId } });
  await prisma.rTApprovalEvent.deleteMany({ where: { tenantId } });
  await prisma.documentLifecycleEvent.deleteMany({ where: { tenantId } });
  await prisma.auditLog.deleteMany({ where: { tenantId } });
  await prisma.auditoriaFiscalizacao.deleteMany({ where: { tenantId } });
  await prisma.assistedPopDraftSource.deleteMany({ where: { tenantId } });
  await prisma.assistedPopDraft.deleteMany({ where: { tenantId } });
  await prisma.approvedPopVersion.deleteMany({ where: { tenantId } });
  await prisma.documentaryLibraryItem.deleteMany({ where: { tenantId } });
  await prisma.documento.deleteMany({ where: { tenantId } });
  await prisma.popMateriaPrima.deleteMany({ where: { tenantId } });
  await prisma.pop.deleteMany({ where: { id: { in: popIds } } });
  await prisma.colaborador.deleteMany({ where: { tenantId } });
  await prisma.user.deleteMany({
    where: {
      tenantId,
      email: { in: [QA.adminEmail, QA.rtEmail, QA.operadorEmail] },
    },
  });
}

async function main() {
  assertSafeEnvironment();

  const passwordHash = await bcrypt.hash(QA.password, 10);
  let tenant = await prisma.tenant.findFirst({ where: { cnpj: QA.tenantCnpj } });

  if (tenant) {
    await deleteExistingQaData(tenant.id);
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        nome: QA.tenantName,
        responsavel: "Farmacêutica RT Demo",
        email: "qa.demo@visadocs.local",
        telefone: "(11) 4000-0000",
        endereco: "Rua da Demonstração, 100 - Ambiente de Testes",
        status: "ATIVO",
        subscriptionStatus: "ATIVO",
      },
    });
  } else {
    tenant = await prisma.tenant.create({
      data: {
        nome: QA.tenantName,
        cnpj: QA.tenantCnpj,
        responsavel: "Farmacêutica RT Demo",
        email: "qa.demo@visadocs.local",
        telefone: "(11) 4000-0000",
        endereco: "Rua da Demonstração, 100 - Ambiente de Testes",
        status: "ATIVO",
        subscriptionStatus: "ATIVO",
      },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: QA.adminEmail },
    update: { name: "Administrador Demo", password: passwordHash, role: "ADMIN", tenantId: tenant.id },
    create: { email: QA.adminEmail, name: "Administrador Demo", password: passwordHash, role: "ADMIN", tenantId: tenant.id },
  });

  const rt = await prisma.user.upsert({
    where: { email: QA.rtEmail },
    update: { name: "Farmacêutico RT Demo", password: passwordHash, role: "RT", tenantId: tenant.id },
    create: { email: QA.rtEmail, name: "Farmacêutico RT Demo", password: passwordHash, role: "RT", tenantId: tenant.id },
  });

  await prisma.user.upsert({
    where: { email: QA.operadorEmail },
    update: { name: "Operador Demo", password: passwordHash, role: "OPERADOR", tenantId: tenant.id },
    create: { email: QA.operadorEmail, name: "Operador Demo", password: passwordHash, role: "OPERADOR", tenantId: tenant.id },
  });

  const colaborador = await prisma.colaborador.create({
    data: {
      nome: "Colaborador Demo",
      email: "colaborador.qa.demo@visadocs.local",
      funcao: "Manipulador QA",
      setor: "Manipulacao",
      cpfMasked: "000.***.***-91",
      status: "ATIVO",
      tenantId: tenant.id,
    },
  });

  const usefulContent = [
    "Procedimento interno ficticio para recebimento de materia-prima em ambiente QA.",
    "Inclui conferencia documental, avaliacao visual da embalagem, registro de lote, validade, fornecedor, quantidade recebida e condicoes de armazenamento.",
    "A equipe deve registrar divergencias, isolar material pendente e comunicar o Responsavel Tecnico para revisao antes de qualquer uso operacional.",
    "Este conteudo e demonstrativo, nao substitui revisao tecnica e serve apenas para validar a geracao assistida de minuta no ambiente QA.",
  ].join(" ");

  const usefulLibraryItem = await prisma.documentaryLibraryItem.create({
    data: {
      tenantId: tenant.id,
      type: "POP",
      title: "Fonte documental QA util",
      code: QA.libraryCodeUseful,
      category: "Recebimento",
      status: "ACTIVE",
      version: "1.0",
      content: usefulContent,
      source: "Seed QA Demo",
      createdByUserId: admin.id,
      createdByUserName: admin.name,
    },
  });

  await prisma.documentaryLibraryItem.create({
    data: {
      tenantId: tenant.id,
      type: "POP",
      title: "Fonte documental QA insuficiente",
      code: QA.libraryCodeInsufficient,
      category: "Recebimento",
      status: "ACTIVE",
      version: "1.0",
      content: "placeholder",
      source: "Seed QA Demo",
      createdByUserId: admin.id,
      createdByUserName: admin.name,
    },
  });

  const draftPop = await prisma.pop.create({
    data: {
      codigo: QA.popDraftCode,
      titulo: "POP QA em rascunho",
      setor: "Recebimento",
      status: "RASCUNHO",
      versao: "0.1",
      objetivo: "Validar exibicao de POP em rascunho no QA.",
      descricao: "Minuta ficticia aguardando revisao do Responsavel Tecnico.",
      conteudo: "Conteudo auxiliar de rascunho para QA.",
      responsavel: "Dra. Responsavel Tecnica QA",
      tenantId: tenant.id,
    },
  });

  const approvedPop = await prisma.pop.create({
    data: {
      codigo: QA.popApprovedCode,
      titulo: "POP QA aprovado e versionado",
      setor: "Recebimento",
      status: "APROVADO",
      versao: "1.0",
      objetivo: "Validar fluxo de POP aprovado com treinamento.",
      descricao: "Procedimento ficticio aprovado pelo RT para demonstracao controlada.",
      conteudo: usefulContent,
      responsavel: "Dra. Responsavel Tecnica QA",
      validadoEm: new Date("2026-05-20T12:00:00.000Z"),
      validadoPor: rt.name,
      tenantId: tenant.id,
    },
  });

  const draft = await prisma.assistedPopDraft.create({
    data: {
      tenantId: tenant.id,
      popId: draftPop.id,
      title: "Minuta assistida QA",
      code: QA.popDraftCode,
      status: "RASCUNHO",
      version: "0.1",
      objective: "Validar minuta assistida a partir da biblioteca documental.",
      content: usefulContent,
      notes: "Artefato auxiliar para QA; exige revisao e aprovacao do RT.",
      createdByUserId: admin.id,
      createdByUserName: admin.name,
      sources: {
        create: {
          tenantId: tenant.id,
          libraryItemId: usefulLibraryItem.id,
          sourceTitle: usefulLibraryItem.title,
          sourceVersion: usefulLibraryItem.version,
        },
      },
    },
  });

  const approvedVersion = await prisma.approvedPopVersion.create({
    data: {
      tenantId: tenant.id,
      popId: approvedPop.id,
      draftId: draft.id,
      code: approvedPop.codigo,
      title: approvedPop.titulo,
      version: "1.0",
      status: "CURRENT",
      contentSnapshot: usefulContent,
      approvedByUserId: rt.id,
      approvedByUserName: rt.name,
      approvedAt: new Date("2026-05-20T12:05:00.000Z"),
    },
  });

  await prisma.rTApprovalEvent.create({
    data: {
      tenantId: tenant.id,
      popId: approvedPop.id,
      draftId: draft.id,
      approvedPopVersionId: approvedVersion.id,
      decision: "APPROVED",
      statusFrom: "EM_REVISAO",
      statusTo: "APROVADO",
      version: "1.0",
      comment: "Decisao QA ficticia registrada pelo RT.",
      userId: rt.id,
      userName: rt.name,
    },
  });

  const treinamento = await prisma.treinamento.create({
    data: {
      popId: approvedPop.id,
      approvedPopVersionId: approvedVersion.id,
      popCodigoSnapshot: approvedVersion.code,
      popTituloSnapshot: approvedVersion.title,
      popVersaoSnapshot: approvedVersion.version,
      colaboradorId: colaborador.id,
      dataTreinamento: new Date("2026-05-21T14:00:00.000Z"),
      duracao: 60,
      instrutor: "QA RT Demo",
      observacoes: "Treinamento ficticio para aceite QA.",
      notaQuiz: 100,
      aprovadoQuiz: true,
      status: "CONCLUIDO",
      tenantId: tenant.id,
    },
  });

  const quiz = await prisma.quiz.create({
    data: {
      titulo: "Quiz QA - POP aprovado",
      descricao: "Quiz ficticio para validar tentativa e evidencia interna.",
      popId: approvedPop.id,
      notaMinima: 70,
      ativo: true,
      tenantId: tenant.id,
      questoesData: [
        {
          pergunta: "O uso operacional do POP depende da versao aprovada vigente?",
          alternativas: ["Sim", "Nao"],
          correta: 0,
        },
      ],
    },
  });

  const questao = await prisma.questao.create({
    data: {
      pergunta: "O uso operacional do POP depende da versao aprovada vigente?",
      ordem: 1,
      quizId: quiz.id,
    },
  });

  const alternativaCorreta = await prisma.alternativa.create({
    data: {
      texto: "Sim",
      correta: true,
      ordem: 1,
      questaoId: questao.id,
    },
  });

  await prisma.alternativa.create({
    data: {
      texto: "Nao",
      correta: false,
      ordem: 2,
      questaoId: questao.id,
    },
  });

  const tentativa = await prisma.tentativaQuiz.create({
    data: {
      quizId: quiz.id,
      colaboradorId: colaborador.id,
      treinamentoId: treinamento.id,
      nota: 100,
      aprovado: true,
      codigoValidacao: "QA-DEMO-EVIDENCIA-001",
      completadoEm: new Date("2026-05-21T15:00:00.000Z"),
      acertos: 1,
      totalQuestoes: 1,
      respostasData: [{ questaoId: questao.id, alternativaId: alternativaCorreta.id, correta: true }],
    },
  });

  await prisma.resposta.create({
    data: {
      tentativaQuizId: tentativa.id,
      questaoId: questao.id,
      alternativaId: alternativaCorreta.id,
      correta: true,
    },
  });

  await prisma.auditoriaFiscalizacao.create({
    data: {
      tenantId: tenant.id,
      status: "ATIVO",
      dataGeracao: new Date("2026-05-21T16:00:00.000Z"),
      dataExpiracao: new Date("2026-05-22T16:00:00.000Z"),
      qrCode: `VISADOCS-AUDITORIA-QA-${tenant.id}`,
      codigoAcesso: "QA-DEMO-READONLY",
      responsaveis: ["Dra. Responsavel Tecnica QA"],
      masterListPOPs: [
        {
          codigo: approvedPop.codigo,
          titulo: approvedPop.titulo,
          versao: approvedVersion.version,
          status: "CURRENT",
          responsavel: "Dra. Responsavel Tecnica QA",
        },
      ],
      certificados: [
        {
          colaborador: colaborador.nome,
          pop: approvedPop.codigo,
          status: "VALIDO",
          validade: "2027-05-21",
        },
      ],
      cronogramaValidades: [
        {
          documento: approvedPop.codigo,
          tipo: "POP",
          titulo: approvedPop.titulo,
          dataValidade: "2028-05-20",
          diasParaVencer: 725,
          status: "OK",
        },
        {
          documento: `REG-${colaborador.nome}-${approvedPop.codigo}`,
          tipo: "REGISTRO_INTERNO",
          titulo: `Registro interno ${approvedPop.codigo}`,
          colaborador: colaborador.nome,
          dataValidade: "2027-05-21",
          diasParaVencer: 361,
          status: "OK",
        },
      ],
      acessos: [],
      anotacoes: [],
    },
  });

  const lifecycleEvents = [
    {
      entityType: "DocumentaryLibraryItem",
      entityId: usefulLibraryItem.id,
      action: "LIBRARY_ITEM_CREATED",
      statusTo: usefulLibraryItem.status,
      userId: admin.id,
      userName: admin.name,
      metadata: { code: usefulLibraryItem.code, source: usefulLibraryItem.source },
    },
    {
      entityType: "AssistedPopDraft",
      entityId: draft.id,
      relatedEntityType: "DocumentaryLibraryItem",
      relatedEntityId: usefulLibraryItem.id,
      action: "POP_DRAFT_GENERATED",
      statusTo: draft.status,
      version: draft.version,
      userId: admin.id,
      userName: admin.name,
      metadata: { popCode: draft.code },
    },
    {
      entityType: "Pop",
      entityId: approvedPop.id,
      relatedEntityType: "ApprovedPopVersion",
      relatedEntityId: approvedVersion.id,
      action: "POP_RT_APPROVED",
      statusFrom: "EM_REVISAO",
      statusTo: "APROVADO",
      version: approvedVersion.version,
      userId: rt.id,
      userName: rt.name,
    },
    {
      entityType: "Treinamento",
      entityId: treinamento.id,
      relatedEntityType: "ApprovedPopVersion",
      relatedEntityId: approvedVersion.id,
      action: "TREINAMENTO_LINKED_TO_VERSION",
      statusTo: treinamento.status,
      version: approvedVersion.version,
      userId: admin.id,
      userName: admin.name,
    },
    {
      entityType: "Treinamento",
      entityId: treinamento.id,
      relatedEntityType: "TentativaQuiz",
      relatedEntityId: tentativa.id,
      action: "EVIDENCE_CREATED",
      statusTo: treinamento.status,
      version: approvedVersion.version,
      userId: admin.id,
      userName: admin.name,
      metadata: { codigoValidacao: tentativa.codigoValidacao },
    },
  ];

  for (const event of lifecycleEvents) {
    await prisma.documentLifecycleEvent.create({
      data: {
        tenantId: tenant.id,
        ...event,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      action: "QA_DEMO_SEED_CREATED",
      entity: "Tenant",
      entityId: tenant.id,
      userId: admin.id,
      userName: admin.name,
      details: {
        dataset: "qa-demo",
        warning: "Dados ficticios para QA/demo. Nao usar em producao.",
      },
    },
  });

  console.log("Seed QA/demo criado com sucesso em ambiente permitido.");
  console.log(`Tenant: ${QA.tenantName}`);
  console.log(`ADMIN: ${QA.adminEmail}`);
  console.log(`RT: ${QA.rtEmail}`);
  console.log(`OPERADOR: ${QA.operadorEmail}`);
  console.log("Senha ficticia compartilhada no documento docs/qa-demo-seed.md.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

