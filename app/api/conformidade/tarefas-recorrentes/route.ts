import { NextResponse } from "next/server";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";
import { getPeriodicComplianceTasks } from "@/lib/periodic-compliance-tasks";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["SUPER_ADMIN", "ADMIN", "RT", "OPERADOR", "ANALISTA_CQ"].includes(user.role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
  if (response) return response;

  const [alertasRegulatorios, treinamentosPendentes, ncsVencidas] = await Promise.all([
    prisma.alertaNorma.count({ where: { tenantId: tenantId!, status: { in: ["NOVO", "PENDENTE", "EM_ANALISE"] } } }),
    prisma.treinamento.count({ where: { tenantId: tenantId!, NOT: { status: "CONCLUIDO" } } }),
    prisma.naoConformidade.count({
      where: {
        tenantId: tenantId!,
        prazoImplementacao: { lt: new Date() },
        NOT: { status: { in: ["CONCLUIDA", "FECHADA", "CANCELADA"] } },
      },
    }),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    mode: "template-operacional",
    disclaimer:
      "Esta lista e o pacote inicial de controles periodicos. O registro persistente de execucoes exige a proxima migracao do banco.",
    indicadores: {
      alertasRegulatorios,
      treinamentosPendentes,
      ncsVencidas,
    },
    tarefas: getPeriodicComplianceTasks().map((task) => ({
      ...task,
      statusSugerido:
        (task.code === "REG-RADAR-001" && alertasRegulatorios > 0) ||
        (task.code === "BPM-TREIN-001" && treinamentosPendentes > 0)
          ? "ACAO_NECESSARIA"
          : "PROGRAMADA",
    })),
  });
}
