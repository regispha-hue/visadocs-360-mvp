import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

type AlertType = "proximo_vencimento" | "vencido" | "pendente";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(request.url);
  const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
  if (response) return response;

  const targetUserId = searchParams.get("usuarioId") || user.id;
  if (targetUserId !== user.id && !["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const colaborador = await prisma.colaborador.findFirst({
    where: { tenantId: tenantId!, email: user.email || "__none__" },
  });

  const treinamentos = await prisma.treinamento.findMany({
    where: {
      tenantId: tenantId!,
      ...(colaborador && targetUserId === user.id ? { colaboradorId: colaborador.id } : {}),
    },
    include: { pop: true, colaborador: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const now = new Date();
  const generated = [];

  for (const treinamento of treinamentos) {
    const alerts: Array<{ tipo: AlertType; mensagem: string }> = [];
    const validade = treinamento.status === "CONCLUIDO"
      ? addYears(treinamento.dataTreinamento, treinamento.pop.validadeAnos || 2)
      : null;
    const diasParaVencer = validade ? Math.ceil((validade.getTime() - now.getTime()) / 86400000) : null;
    const pendenteHa = Math.ceil((now.getTime() - treinamento.createdAt.getTime()) / 86400000);

    if (treinamento.status !== "CONCLUIDO" && pendenteHa > 15) {
      alerts.push({
        tipo: "pendente",
        mensagem: `Treinamento obrigatório pendente há ${pendenteHa} dias: ${treinamento.pop.codigo}`,
      });
    }
    if (validade && validade < now) {
      alerts.push({
        tipo: "vencido",
        mensagem: `Certificado vencido: ${treinamento.pop.codigo}`,
      });
    } else if (validade && diasParaVencer !== null && diasParaVencer <= 30) {
      alerts.push({
        tipo: "proximo_vencimento",
        mensagem: `Certificado vence em ${diasParaVencer} dias: ${treinamento.pop.codigo}`,
      });
    }

    for (const alert of alerts) {
      generated.push(await prisma.alertaTreinamento.upsert({
        where: {
          usuarioId_treinamentoId_tipo: {
            usuarioId: targetUserId,
            treinamentoId: treinamento.id,
            tipo: alert.tipo,
          },
        },
        update: {
          mensagem: alert.mensagem,
          lido: false,
          tenantId: tenantId!,
        },
        create: {
          usuarioId: targetUserId,
          treinamentoId: treinamento.id,
          tipo: alert.tipo,
          mensagem: alert.mensagem,
          tenantId: tenantId!,
        },
      }));
    }
  }

  const alertas = await prisma.alertaTreinamento.findMany({
    where: { tenantId: tenantId!, usuarioId: targetUserId },
    orderBy: [{ lido: "asc" }, { criadoEm: "desc" }],
    take: 100,
  });

  return NextResponse.json({ alertas, gerados: generated.length });
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}
