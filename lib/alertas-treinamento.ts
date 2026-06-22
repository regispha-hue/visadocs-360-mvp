import { prisma } from "@/lib/db";

export type TrainingAlertType = "proximo_vencimento" | "vencido" | "pendente";

type GeneratedTrainingAlert = {
  tipo: TrainingAlertType;
  mensagem: string;
  treinamentoId: string;
};

type GenerateTrainingAlertsForUserInput = {
  tenantId: string;
  usuarioId: string;
  colaboradorId?: string | null;
  now?: Date;
};

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function buildTrainingAlerts(treinamento: {
  id: string;
  status: string;
  createdAt: Date;
  dataTreinamento: Date;
  pop: { codigo: string; validadeAnos: number };
}, now: Date): GeneratedTrainingAlert[] {
  const alerts: GeneratedTrainingAlert[] = [];
  const validade = treinamento.status === "CONCLUIDO"
    ? addYears(treinamento.dataTreinamento, treinamento.pop.validadeAnos || 2)
    : null;
  const diasParaVencer = validade ? Math.ceil((validade.getTime() - now.getTime()) / 86400000) : null;
  const pendenteHa = Math.ceil((now.getTime() - treinamento.createdAt.getTime()) / 86400000);

  if (treinamento.status !== "CONCLUIDO" && pendenteHa > 15) {
    alerts.push({
      tipo: "pendente",
      mensagem: `Treinamento obrigatório pendente há ${pendenteHa} dias: ${treinamento.pop.codigo}`,
      treinamentoId: treinamento.id,
    });
  }

  if (validade && validade < now) {
    alerts.push({
      tipo: "vencido",
      mensagem: `Certificado vencido: ${treinamento.pop.codigo}`,
      treinamentoId: treinamento.id,
    });
  } else if (validade && diasParaVencer !== null && diasParaVencer <= 30) {
    alerts.push({
      tipo: "proximo_vencimento",
      mensagem: `Certificado vence em ${diasParaVencer} dias: ${treinamento.pop.codigo}`,
      treinamentoId: treinamento.id,
    });
  }

  return alerts;
}

export async function generateTrainingAlertsForUser({
  tenantId,
  usuarioId,
  colaboradorId,
  now = new Date(),
}: GenerateTrainingAlertsForUserInput) {
  const treinamentos = await prisma.treinamento.findMany({
    where: {
      tenantId,
      ...(colaboradorId ? { colaboradorId } : {}),
    },
    include: { pop: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const expected = new Map<string, GeneratedTrainingAlert>();
  for (const treinamento of treinamentos) {
    for (const alert of buildTrainingAlerts(treinamento, now)) {
      expected.set(`${alert.treinamentoId}:${alert.tipo}`, alert);
    }
  }

  const generated = [];
  for (const alert of expected.values()) {
    generated.push(await prisma.alertaTreinamento.upsert({
      where: {
        usuarioId_treinamentoId_tipo: {
          usuarioId,
          treinamentoId: alert.treinamentoId,
          tipo: alert.tipo,
        },
      },
      update: {
        mensagem: alert.mensagem,
        lido: false,
        tenantId,
      },
      create: {
        usuarioId,
        treinamentoId: alert.treinamentoId,
        tipo: alert.tipo,
        mensagem: alert.mensagem,
        tenantId,
      },
    }));
  }

  const existing = await prisma.alertaTreinamento.findMany({
    where: {
      tenantId,
      usuarioId,
      tipo: { in: ["proximo_vencimento", "vencido", "pendente"] },
    },
    select: { id: true, treinamentoId: true, tipo: true, lido: true },
    take: 1000,
  });

  const staleIds = existing
    .filter((alert) => !expected.has(`${alert.treinamentoId}:${alert.tipo}`))
    .map((alert) => alert.id);

  if (staleIds.length > 0) {
    await prisma.alertaTreinamento.updateMany({
      where: { id: { in: staleIds }, tenantId },
      data: { lido: true },
    });
  }

  return { generated, staleResolved: staleIds.length };
}

export async function generateTrainingAlertsForTenant(tenantId: string) {
  const colaboradores = await prisma.colaborador.findMany({
    where: { tenantId, status: "ATIVO", email: { not: null } },
    select: { id: true, email: true },
  });

  let usuariosProcessados = 0;
  let alertasGerados = 0;
  let alertasResolvidos = 0;

  for (const colaborador of colaboradores) {
    const user = await prisma.user.findFirst({
      where: { tenantId, email: colaborador.email || "__none__" },
      select: { id: true },
    });

    if (!user) continue;

    const result = await generateTrainingAlertsForUser({
      tenantId,
      usuarioId: user.id,
      colaboradorId: colaborador.id,
    });
    usuariosProcessados += 1;
    alertasGerados += result.generated.length;
    alertasResolvidos += result.staleResolved;
  }

  return { usuariosProcessados, alertasGerados, alertasResolvidos };
}
