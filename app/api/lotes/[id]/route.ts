import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const lote = await prisma.lote.findUnique({
      where: { id: params.id },
      include: {
        materiaPrima: {
          select: { id: true, codigo: true, nome: true, unidadeMedida: true, especificacoes: true },
        },
        fornecedor: {
          select: { id: true, nome: true, cnpj: true, telefone: true, email: true },
        },
      },
    });

    if (!lote) {
      return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && lote.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ lote });
  } catch (error: any) {
    console.error("Error fetching lote:", error);
    return NextResponse.json({ error: "Erro ao buscar lote" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    if (!["SUPER_ADMIN", "ADMIN_FARMACIA", "RT", "ANALISTA_CQ"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const lote = await prisma.lote.findUnique({
      where: { id: params.id },
      include: { materiaPrima: { select: { nome: true } } },
    });

    if (!lote) {
      return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && lote.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const data = await request.json();
    const oldStatus = lote.status;

    const updatedLote = await prisma.lote.update({
      where: { id: params.id },
      data: {
        ...(data.loteInterno !== undefined && { loteInterno: data.loteInterno || null }),
        ...(data.dataFabricacao !== undefined && { dataFabricacao: data.dataFabricacao ? new Date(data.dataFabricacao) : null }),
        ...(data.dataValidade && { dataValidade: new Date(data.dataValidade) }),
        ...(data.quantidade !== undefined && { quantidade: parseFloat(data.quantidade) }),
        ...(data.quantidadeAtual !== undefined && { quantidadeAtual: parseFloat(data.quantidadeAtual) }),
        ...(data.precoUnitario !== undefined && { precoUnitario: data.precoUnitario ? parseFloat(data.precoUnitario) : null }),
        ...(data.notaFiscal !== undefined && { notaFiscal: data.notaFiscal || null }),
        ...(data.certificadoUrl !== undefined && { certificadoUrl: data.certificadoUrl || null }),
        ...(data.certificadoNome !== undefined && { certificadoNome: data.certificadoNome || null }),
        ...(data.certificadoPublic !== undefined && { certificadoPublic: data.certificadoPublic }),
        ...(data.laudoUrl !== undefined && { laudoUrl: data.laudoUrl || null }),
        ...(data.laudoNome !== undefined && { laudoNome: data.laudoNome || null }),
        ...(data.laudoPublic !== undefined && { laudoPublic: data.laudoPublic }),
        ...(data.analises !== undefined && { analises: data.analises || null }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes || null }),
        ...(data.status && { status: data.status }),
        ...(data.fornecedorId !== undefined && { fornecedorId: data.fornecedorId || null }),
      },
      include: {
        materiaPrima: { select: { id: true, codigo: true, nome: true } },
        fornecedor: { select: { id: true, nome: true } },
      },
    });

    const action = data.status && data.status !== oldStatus
      ? AUDIT_ACTIONS.LOTE_STATUS_CHANGED
      : AUDIT_ACTIONS.LOTE_UPDATED;

    await createAuditLog({
      action,
      entity: "Lote",
      entityId: lote.id,
      userId: user.id,
      userName: user.name,
      tenantId: lote.tenantId,
      details: {
        numeroLote: lote.numeroLote,
        materiaPrima: lote.materiaPrima.nome,
        ...(data.status && { oldStatus, newStatus: data.status }),
        changes: Object.keys(data),
      },
    });

    return NextResponse.json({ success: true, lote: updatedLote });
  } catch (error: any) {
    console.error("Error updating lote:", error);
    return NextResponse.json({ error: "Erro ao atualizar lote" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    if (!["SUPER_ADMIN", "ADMIN_FARMACIA"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const lote = await prisma.lote.findUnique({
      where: { id: params.id },
      include: { materiaPrima: { select: { nome: true } } },
    });

    if (!lote) {
      return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && lote.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.lote.delete({ where: { id: params.id } });

    await createAuditLog({
      action: AUDIT_ACTIONS.LOTE_DELETED,
      entity: "Lote",
      entityId: lote.id,
      userId: user.id,
      userName: user.name,
      tenantId: lote.tenantId,
      details: { numeroLote: lote.numeroLote, materiaPrima: lote.materiaPrima.nome },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lote:", error);
    return NextResponse.json({ error: "Erro ao excluir lote" }, { status: 500 });
  }
}
