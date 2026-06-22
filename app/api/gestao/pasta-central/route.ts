import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
  if (response) return response;

  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : null;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : null;
  const periodo = from || to ? {
    createdAt: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    },
  } : {};

  const [
    popsVigentes,
    certificados,
    treinamentosConcluidos,
    naoConformidades,
    logsImpressao,
  ] = await Promise.all([
    prisma.pop.findMany({
      where: { tenantId: tenantId!, status: "VIGENTE" },
      select: { id: true, codigo: true, titulo: true, versao: true, setor: true, dataRevisao: true },
      orderBy: { codigo: "asc" },
      take: 100,
    }),
    prisma.certificado.findMany({
      where: { tenantId: tenantId!, ...periodo },
      orderBy: { dataEmissao: "desc" },
      take: 1000,
    }),
    prisma.treinamento.count({
      where: { tenantId: tenantId!, status: "CONCLUIDO", ...periodo },
    }),
    prisma.naoConformidade.findMany({
      where: { tenantId: tenantId!, ...periodo },
      select: { id: true, codigo: true, titulo: true, status: true, createdAt: true, dataConclusao: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.documentoImpressaoLog.findMany({
      where: { tenantId: tenantId!, ...periodo },
      include: { documento: { select: { title: true, code: true, type: true } } },
      orderBy: { criadoEm: "desc" },
      take: 50,
    }),
  ]);

  const certificadosPorColaborador = Array.from(
    certificados.reduce((map, certificado) => {
      const key = certificado.colaboradorId || certificado.usuarioId;
      const current = map.get(key) || {
        id: key,
        nome: certificado.colaboradorNome || certificado.usuarioNome || "Usuário sem vínculo",
        total: 0,
        vencidos: 0,
        proximosVencimento: 0,
      };
      current.total += 1;
      if (certificado.validade && certificado.validade < new Date()) current.vencidos += 1;
      if (
        certificado.validade &&
        certificado.validade >= new Date() &&
        certificado.validade.getTime() - Date.now() <= 30 * 86400000
      ) {
        current.proximosVencimento += 1;
      }
      map.set(key, current);
      return map;
    }, new Map<string, any>()).values()
  );

  const abertas = naoConformidades.filter((item) => item.status !== "CONCLUIDA" && item.status !== "FECHADA");
  const fechadas = naoConformidades.filter((item) => item.status === "CONCLUIDA" || item.status === "FECHADA");

  return NextResponse.json({
    popsVigentes,
    certificadosPorColaborador,
    treinamentosConcluidos,
    naoConformidades: {
      abertas: abertas.length,
      fechadas: fechadas.length,
      recentes: naoConformidades.slice(0, 20),
    },
    impressaoControlada: logsImpressao,
    calibracoes: {
      validas: 0,
      vencidas: 0,
      observacao: "Módulo de equipamentos ainda não possui modelo dedicado de calibração.",
    },
    resumo: {
      popsVigentes: popsVigentes.length,
      certificados: certificados.length,
      treinamentosConcluidos,
      naoConformidadesAbertas: abertas.length,
    },
  });
}
