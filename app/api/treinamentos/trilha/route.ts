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

  const colaborador = await prisma.colaborador.findFirst({
    where: {
      tenantId: tenantId!,
      ...(searchParams.get("colaboradorId")
        ? { id: searchParams.get("colaboradorId")! }
        : { email: user.email || "__none__" }),
    },
  });

  const treinamentos = await prisma.treinamento.findMany({
    where: {
      tenantId: tenantId!,
      ...(colaborador ? { colaboradorId: colaborador.id } : {}),
      ...(!colaborador && !["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role) ? { id: "__none__" } : {}),
    },
    include: { pop: true, colaborador: true },
    orderBy: [{ status: "asc" }, { dataTreinamento: "desc" }],
  });

  const now = new Date();
  const items = treinamentos.map((treinamento) => {
    const validade = treinamento.status === "CONCLUIDO"
      ? addYears(treinamento.dataTreinamento, treinamento.pop.validadeAnos || 2)
      : null;
    const dias = validade ? Math.ceil((validade.getTime() - now.getTime()) / 86400000) : null;
    const pendenteHa = Math.ceil((now.getTime() - treinamento.createdAt.getTime()) / 86400000);
    const situacao = treinamento.status !== "CONCLUIDO" && pendenteHa > 15
      ? "atrasado"
      : validade && validade < now
        ? "vencido"
        : treinamento.status === "CONCLUIDO"
          ? "concluido"
          : treinamento.status === "EM_AVALIACAO"
            ? "andamento"
            : "pendente";
    return {
      id: treinamento.id,
      status: treinamento.status,
      situacao,
      obrigatorio: true,
      dataTreinamento: treinamento.dataTreinamento,
      validade,
      diasParaVencer: dias,
      colaborador: treinamento.colaborador,
      pop: treinamento.pop,
    };
  });

  return NextResponse.json({
    colaborador,
    items,
    resumo: {
      pendentes: items.filter((item) => item.situacao === "pendente").length,
      andamento: items.filter((item) => item.situacao === "andamento").length,
      concluidos: items.filter((item) => item.situacao === "concluido").length,
      atrasados: items.filter((item) => item.situacao === "atrasado" || item.situacao === "vencido").length,
    },
  });
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}
