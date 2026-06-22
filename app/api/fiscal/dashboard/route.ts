import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(request.url);
  const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
  if (response) return response;

  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const [totalTreinamentos, treinamentosConcluidos, certificados, naoConformidades] = await Promise.all([
    prisma.treinamento.count({ where: { tenantId: tenantId! } }),
    prisma.treinamento.count({ where: { tenantId: tenantId!, status: "CONCLUIDO" } }),
    prisma.certificado.findMany({
      where: { tenantId: tenantId!, dataEmissao: { gte: since } },
      orderBy: { dataEmissao: "asc" },
    }),
    prisma.naoConformidade.findMany({
      where: { tenantId: tenantId! },
      select: { status: true, createdAt: true, dataConclusao: true },
    }),
  ]);

  const abertas = naoConformidades.filter((item) => item.status !== "CONCLUIDA" && item.status !== "FECHADA");
  const fechadasComPrazo = naoConformidades.filter((item) => item.dataConclusao);
  const mediaResolucaoDias = fechadasComPrazo.length
    ? Math.round(
        fechadasComPrazo.reduce((sum, item) => {
          return sum + ((item.dataConclusao!.getTime() - item.createdAt.getTime()) / 86400000);
        }, 0) / fechadasComPrazo.length
      )
    : null;

  const certsPorMes = certificados.reduce((map, certificado) => {
    const key = certificado.dataEmissao.toISOString().slice(0, 7);
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {} as Record<string, number>);

  return NextResponse.json({
    validadeMinutos: 15,
    disclaimer: "Painel fiscal de apoio. A evidência oficial continua sendo o documento controlado e seus registros.",
    treinamento: {
      total: totalTreinamentos,
      concluidos: treinamentosConcluidos,
      percentualConclusao: totalTreinamentos ? Math.round((treinamentosConcluidos / totalTreinamentos) * 100) : 0,
    },
    certificados: {
      ultimos12Meses: certificados.length,
      porMes: certsPorMes,
      vencidos: certificados.filter((item) => item.validade && item.validade < new Date()).length,
    },
    naoConformidades: {
      abertas: abertas.length,
      mediaResolucaoDias,
    },
    calibracoes: {
      validas: 0,
      vencidas: 0,
      observacao: "Status de calibração será consolidado quando o módulo de equipamentos estiver persistido.",
    },
  });
}
