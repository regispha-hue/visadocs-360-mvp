import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  NC_ACTION_AUDIT,
  NC_STATUS,
  auditNcTransition,
  calculateDueDate,
  isNcManager,
  nextNcCode,
  normalizeText,
  requiresRtApproval,
  validateGravidade,
  validateRequiredLinkage,
} from "@/lib/nao-conformidades";
import { badRequest, forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isNcManager(user)) return forbidden();

    const { searchParams } = new URL(request.url);
    const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
    if (response) return response;

    const status = searchParams.get("status");
    const gravidade = searchParams.get("gravidade");
    const origem = searchParams.get("origem");
    const q = searchParams.get("q");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const items = await prisma.naoConformidade.findMany({
      where: {
        tenantId: tenantId!,
        ...(status && { status }),
        ...(gravidade && { severidade: gravidade }),
        ...(origem && { origem }),
        ...(from || to
          ? {
              createdAt: {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
              },
            }
          : {}),
        ...(q && {
          OR: [
            { codigo: { contains: q, mode: "insensitive" } },
            { titulo: { contains: q, mode: "insensitive" } },
            { descricao: { contains: q, mode: "insensitive" } },
            { setor: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        pop: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            setor: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 200,
    });

    const stats = {
      total: items.length,
      abertas: items.filter((item) => item.status !== NC_STATUS.FECHADA && item.status !== NC_STATUS.CANCELADA).length,
      criticas: items.filter((item) => item.severidade === "CRITICA").length,
      vencidas: items.filter((item) => {
        if (!item.prazoCorrecao || item.status === NC_STATUS.FECHADA || item.status === NC_STATUS.CANCELADA) return false;
        return item.prazoCorrecao.getTime() < Date.now();
      }).length,
    };

    return NextResponse.json({ items, stats });
  } catch (error) {
    console.error("Error fetching nonconformities:", error);
    return NextResponse.json({ error: "Erro ao buscar não conformidades" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isNcManager(user)) return forbidden();

    const body = await request.json();
    const { tenantId, response } = requireTenantId(user, body.tenantId);
    if (response) return response;

    const gravidade = validateGravidade(body.gravidade);
    if (!gravidade) return badRequest("Gravidade inválida");

    const titulo = normalizeText(body.titulo);
    const descricao = normalizeText(body.descricao);
    const origem = normalizeText(body.origem);
    if (!titulo || !descricao || !origem) {
      return badRequest("Informe título, descrição e origem da não conformidade");
    }
    if (!validateRequiredLinkage(body)) {
      return badRequest("Vincule ao menos um POP, lote, equipamento, colaborador ou reclamação");
    }

    const codigo = await nextNcCode(tenantId!);
    const dueDate = calculateDueDate(gravidade);
    const userName = user.name || user.email || "Usuário";
    const history = [
      {
        action: "ABERTURA",
        statusTo: NC_STATUS.ABERTA,
        userId: user.id,
        userName,
        at: new Date().toISOString(),
      },
    ];

    const item = await prisma.naoConformidade.create({
      data: {
        codigo,
        titulo,
        descricao,
        setor: normalizeText(body.setor),
        tipo: "CAPA",
        severidade: gravidade,
        status: NC_STATUS.ABERTA,
        origem,
        dataOcorrencia: body.dataOcorrencia ? new Date(body.dataOcorrencia) : null,
        dataIdentificacao: new Date(),
        reportadoPor: userName,
        popId: normalizeText(body.popId),
        loteId: normalizeText(body.loteId),
        equipamentoId: normalizeText(body.equipamentoId),
        colaboradorId: normalizeText(body.colaboradorId),
        reclamacaoId: normalizeText(body.reclamacaoId),
        criadoPorId: user.id,
        criadoPorNome: userName,
        prazoCorrecao: dueDate,
        exigeAprovacaoRt: requiresRtApproval(gravidade),
        tenantId: tenantId!,
        historico: history,
        comentarios: [],
      },
      include: {
        pop: {
          select: { id: true, codigo: true, titulo: true, setor: true },
        },
      },
    });

    await auditNcTransition({
      tenantId: tenantId!,
      entityId: item.id,
      action: NC_ACTION_AUDIT.created,
      statusTo: item.status,
      user,
      details: {
        codigo: item.codigo,
        gravidade,
        origem,
        prazoCorrecao: item.prazoCorrecao?.toISOString(),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Error creating nonconformity:", error);
    return NextResponse.json({ error: "Erro ao criar não conformidade" }, { status: 500 });
  }
}
