import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

const OPEN_STATUS = ["NOVO", "PENDENTE", "EM_ANALISE"];

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["SUPER_ADMIN", "ADMIN", "RT", "ANALISTA_CQ"].includes(user.role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
  if (response) return response;

  const status = searchParams.get("status");
  const take = Math.min(Number(searchParams.get("take") || 50), 100);

  const alertas = await prisma.alertaNorma.findMany({
    where: {
      tenantId: tenantId!,
      ...(status && status !== "TODOS" ? { status } : {}),
    },
    include: {
      norma: {
        select: {
          id: true,
          codigo: true,
          numero: true,
          titulo: true,
          descricao: true,
          tipo: true,
          versao: true,
          dataAtualizacao: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { prioridade: "desc" }, { dataAlerta: "desc" }],
    take,
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    resumo: {
      total: alertas.length,
      abertos: alertas.filter((alerta) => OPEN_STATUS.includes(alerta.status)).length,
      criticos: alertas.filter((alerta) => alerta.severidade === "CRITICA" || (alerta.prioridade || 0) >= 4).length,
    },
    alertas: alertas.map((alerta) => ({
      id: alerta.id,
      tipo: alerta.tipo,
      severidade: alerta.severidade,
      prioridade: alerta.prioridade,
      status: alerta.status,
      dataAlerta: alerta.dataAlerta,
      descricao: alerta.descricao,
      norma: alerta.norma,
      acaoObrigatoria:
        "RT/admin deve avaliar relevancia, decidir se revisa POP, gerar treinamento quando houver mudanca operacional e registrar a decisao.",
    })),
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["SUPER_ADMIN", "ADMIN", "RT", "ANALISTA_CQ"].includes(user.role)) return forbidden();

  const body = await request.json();
  const { tenantId, response } = requireTenantId(user, body.tenantId);
  if (response) return response;

  const id = String(body.id || "");
  const status = String(body.status || "");
  if (!id || !["PENDENTE", "EM_ANALISE", "RESOLVIDO", "DESCARTADO"].includes(status)) {
    return NextResponse.json({ error: "Informe id e status valido." }, { status: 400 });
  }

  const alerta = await prisma.alertaNorma.findFirst({ where: { id, tenantId: tenantId! } });
  if (!alerta) return NextResponse.json({ error: "Alerta nao encontrado." }, { status: 404 });

  const descricaoAtualizada = [
    alerta.descricao || "",
    "",
    `Decisao registrada por ${user.name || user.email || user.id} em ${new Date().toISOString()}: ${status}.`,
    body.comentario ? `Comentario: ${String(body.comentario).slice(0, 1000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const updated = await prisma.alertaNorma.update({
    where: { id: alerta.id },
    data: {
      status,
      descricao: descricaoAtualizada,
    },
  });

  return NextResponse.json({ success: true, alerta: updated });
}
