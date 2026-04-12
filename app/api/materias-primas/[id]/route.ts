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
    const materiaPrima = await prisma.materiaPrima.findUnique({
      where: { id: params.id },
      include: {
        fornecedor: { select: { id: true, nome: true, cnpj: true, telefone: true, email: true } },
        lotes: {
          include: {
            fornecedor: { select: { id: true, nome: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        pops: {
          include: {
            pop: { select: { id: true, codigo: true, titulo: true, status: true } },
          },
        },
      },
    });

    if (!materiaPrima) {
      return NextResponse.json({ error: "Matéria-prima não encontrada" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && materiaPrima.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ materiaPrima });
  } catch (error: any) {
    console.error("Error fetching matéria-prima:", error);
    return NextResponse.json({ error: "Erro ao buscar matéria-prima" }, { status: 500 });
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

    const materiaPrima = await prisma.materiaPrima.findUnique({ where: { id: params.id } });

    if (!materiaPrima) {
      return NextResponse.json({ error: "Matéria-prima não encontrada" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && materiaPrima.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const data = await request.json();

    const updatedMP = await prisma.materiaPrima.update({
      where: { id: params.id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.descricao !== undefined && { descricao: data.descricao || null }),
        ...(data.casNumber !== undefined && { casNumber: data.casNumber || null }),
        ...(data.dci !== undefined && { dci: data.dci || null }),
        ...(data.categoria !== undefined && { categoria: data.categoria || null }),
        ...(data.unidadeMedida && { unidadeMedida: data.unidadeMedida }),
        ...(data.estoqueMinimo !== undefined && { estoqueMinimo: data.estoqueMinimo ? parseFloat(data.estoqueMinimo) : null }),
        ...(data.especificacoes !== undefined && { especificacoes: data.especificacoes || null }),
        ...(data.certificadoUrl !== undefined && { certificadoUrl: data.certificadoUrl || null }),
        ...(data.certificadoNome !== undefined && { certificadoNome: data.certificadoNome || null }),
        ...(data.certificadoPublic !== undefined && { certificadoPublic: data.certificadoPublic }),
        ...(data.fornecedorId !== undefined && { fornecedorId: data.fornecedorId || null }),
        ...(data.status && { status: data.status }),
      },
      include: {
        fornecedor: { select: { id: true, nome: true } },
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.MATERIA_PRIMA_UPDATED,
      entity: "MateriaPrima",
      entityId: materiaPrima.id,
      userId: user.id,
      userName: user.name,
      tenantId: materiaPrima.tenantId,
      details: { codigo: materiaPrima.codigo, changes: Object.keys(data) },
    });

    return NextResponse.json({ success: true, materiaPrima: updatedMP });
  } catch (error: any) {
    console.error("Error updating matéria-prima:", error);
    return NextResponse.json({ error: "Erro ao atualizar matéria-prima" }, { status: 500 });
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

    const materiaPrima = await prisma.materiaPrima.findUnique({
      where: { id: params.id },
      include: { _count: { select: { lotes: true } } },
    });

    if (!materiaPrima) {
      return NextResponse.json({ error: "Matéria-prima não encontrada" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && materiaPrima.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (materiaPrima._count.lotes > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir matéria-prima com lotes vinculados" },
        { status: 400 }
      );
    }

    await prisma.materiaPrima.delete({ where: { id: params.id } });

    await createAuditLog({
      action: AUDIT_ACTIONS.MATERIA_PRIMA_DELETED,
      entity: "MateriaPrima",
      entityId: materiaPrima.id,
      userId: user.id,
      userName: user.name,
      tenantId: materiaPrima.tenantId,
      details: { codigo: materiaPrima.codigo, nome: materiaPrima.nome },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting matéria-prima:", error);
    return NextResponse.json({ error: "Erro ao excluir matéria-prima" }, { status: 500 });
  }
}
