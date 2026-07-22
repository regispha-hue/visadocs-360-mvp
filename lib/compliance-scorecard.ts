import { prisma } from "@/lib/db";
import { getPeriodicComplianceTasks } from "@/lib/periodic-compliance-tasks";

function percent(value: number, total: number) {
  if (!total) return 100;
  return Math.round((value / total) * 100);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function buildComplianceScorecard(tenantId: string) {
  const now = new Date();

  const [
    popsTotal,
    popsAtivos,
    versoesAprovadas,
    treinamentosTotal,
    treinamentosConcluidos,
    certificadosVencidos,
    ncsAbertas,
    ncsCriticas,
    ncsVencidas,
    alertasNormaAbertos,
    alertasNormaCriticos,
    documentosBiblioteca,
  ] = await Promise.all([
    prisma.pop.count({ where: { tenantId } }),
    prisma.pop.count({ where: { tenantId, status: "ATIVO" } }),
    prisma.approvedPopVersion.count({ where: { tenantId, status: "CURRENT" } }),
    prisma.treinamento.count({ where: { tenantId } }),
    prisma.treinamento.count({ where: { tenantId, status: "CONCLUIDO" } }),
    prisma.certificado.count({ where: { tenantId, validade: { lt: now } } }),
    prisma.naoConformidade.count({
      where: { tenantId, NOT: { status: { in: ["CONCLUIDA", "FECHADA", "CANCELADA"] } } },
    }),
    prisma.naoConformidade.count({
      where: {
        tenantId,
        severidade: { in: ["CRITICA", "CRITICO", "ALTA"] },
        NOT: { status: { in: ["CONCLUIDA", "FECHADA", "CANCELADA"] } },
      },
    }),
    prisma.naoConformidade.count({
      where: {
        tenantId,
        prazoImplementacao: { lt: now },
        NOT: { status: { in: ["CONCLUIDA", "FECHADA", "CANCELADA"] } },
      },
    }),
    prisma.alertaNorma.count({ where: { tenantId, status: { in: ["NOVO", "PENDENTE", "EM_ANALISE"] } } }),
    prisma.alertaNorma.count({
      where: {
        tenantId,
        status: { in: ["NOVO", "PENDENTE", "EM_ANALISE"] },
        OR: [{ severidade: { in: ["CRITICA", "ALTA"] } }, { prioridade: { gte: 4 } }],
      },
    }),
    prisma.documentaryLibraryItem.count({ where: { tenantId, status: "ACTIVE" } }),
  ]);

  const popScore = percent(popsAtivos, popsTotal);
  const approvedScore = percent(Math.min(versoesAprovadas, popsAtivos), popsAtivos);
  const trainingScore = percent(treinamentosConcluidos, treinamentosTotal);
  const ncPenalty = Math.min(35, ncsAbertas * 4 + ncsCriticas * 8 + ncsVencidas * 10);
  const regulatoryPenalty = Math.min(25, alertasNormaAbertos * 3 + alertasNormaCriticos * 8);
  const certificatePenalty = Math.min(15, certificadosVencidos * 5);
  const readinessScore = clampScore(
    popScore * 0.2 + approvedScore * 0.25 + trainingScore * 0.25 + 30 - ncPenalty - regulatoryPenalty - certificatePenalty
  );

  const periodicTasks = getPeriodicComplianceTasks();

  return {
    generatedAt: now.toISOString(),
    readinessScore,
    status:
      readinessScore >= 85
        ? "PRONTO_PARA_DEMO"
        : readinessScore >= 70
          ? "PRODUCAO_RESTRITA"
          : "PRECISA_CORRECAO_ANTES_DA_PRODUCAO",
    disclaimer:
      "Scorecard operacional de apoio. A decisao final de conformidade exige revisao do RT e evidencias documentais.",
    indicadores: {
      pops: {
        total: popsTotal,
        ativos: popsAtivos,
        percentAtivos: popScore,
        versoesAprovadas,
        percentComVersaoAprovada: approvedScore,
      },
      treinamentos: {
        total: treinamentosTotal,
        concluidos: treinamentosConcluidos,
        percentConcluidos: trainingScore,
        certificadosVencidos,
      },
      naoConformidades: {
        abertas: ncsAbertas,
        criticasOuAltas: ncsCriticas,
        vencidas: ncsVencidas,
      },
      inteligenciaRegulatoria: {
        alertasAbertos: alertasNormaAbertos,
        alertasCriticosOuAltaPrioridade: alertasNormaCriticos,
      },
      acervo: {
        documentosBiblioteca,
      },
      tarefasRecorrentes: {
        templatesDisponiveis: periodicTasks.length,
        observacao: "Persistencia de execucao diaria/mensal deve entrar na proxima migracao do banco.",
      },
    },
    proximasAcoes: [
      ...(alertasNormaCriticos ? ["Triar alertas regulatorios criticos do Radar ANVISA/DOU."] : []),
      ...(ncsVencidas ? ["Fechar ou replanejar nao conformidades vencidas."] : []),
      ...(certificadosVencidos ? ["Renovar certificados vencidos e atualizar trilhas."] : []),
      ...(trainingScore < 100 ? ["Concluir treinamentos pendentes vinculados aos POPs vigentes."] : []),
      "Executar checklist periodico de temperatura, limpeza, calibracao, agua e autoinspecao.",
    ],
  };
}
