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
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id: params.id },
      include: {
        materiasPrimas: {
          select: { id: true, codigo: true, nome: true, status: true },
          orderBy: { nome: "asc" },
        },
        lotes: {
          select: { id: true, numeroLote: true, status: true, dataValidade: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!fornecedor) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && fornecedor.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ fornecedor });
  } catch (error: any) {
    console.error("Error fetching fornecedor:", error);
    return NextResponse.json({ error: "Erro ao buscar fornecedor" }, { status: 500 });
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

    const fornecedor = await prisma.fornecedor.findUnique({ where: { id: params.id } });

    if (!fornecedor) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && fornecedor.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const data = await request.json();

    const updatedFornecedor = await prisma.fornecedor.update({
      where: { id: params.id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.telefone !== undefined && { telefone: data.telefone || null }),
        ...(data.endereco !== undefined && { endereco: data.endereco || null }),
        ...(data.contato !== undefined && { contato: data.contato || null }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes || null }),
        ...(data.ativo !== undefined && { ativo: data.ativo }),
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.FORNECEDOR_UPDATED,
      entity: "Fornecedor",
      entityId: fornecedor.id,
      userId: user.id,
      userName: user.name,
      tenantId: fornecedor.tenantId,
      details: { nome: fornecedor.nome, changes: Object.keys(data) },
    });

    return NextResponse.json({ success: true, fornecedor: updatedFornecedor });
  } catch (error: any) {
    console.error("Error updating fornecedor:", error);
    return NextResponse.json({ error: "Erro ao atualizar fornecedor" }, { status: 500 });
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

    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id: params.id },
      include: { _count: { select: { materiasPrimas: true, lotes: true } } },
    });

    if (!fornecedor) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && fornecedor.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (fornecedor._count.materiasPrimas > 0 || fornecedor._count.lotes > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir fornecedor com matérias-primas ou lotes vinculados" },
        { status: 400 }
      );
    }

    await prisma.fornecedor.delete({ where: { id: params.id } });

    await createAuditLog({
      action: AUDIT_ACTIONS.FORNECEDOR_DELETED,
      entity: "Fornecedor",
      entityId: fornecedor.id,
      userId: user.id,
      userName: user.name,
      tenantId: fornecedor.tenantId,
      details: { nome: fornecedor.nome },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting fornecedor:", error);
    return NextResponse.json({ error: "Erro ao excluir fornecedor" }, { status: 500 });
  }
}
