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
    const treinamento = await prisma.treinamento.findUnique({
      where: { id: params.id },
      include: {
        pop: true,
        colaborador: true,
      },
    });

    if (!treinamento) {
      return NextResponse.json({ error: "Treinamento não encontrado" }, { status: 404 });
    }

    // Check tenant access
    if (user.role !== "SUPER_ADMIN" && treinamento.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ treinamento });
  } catch (error: any) {
    console.error("Error fetching treinamento:", error);
    return NextResponse.json({ error: "Erro ao buscar treinamento" }, { status: 500 });
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

    // Check permissions
    if (!["SUPER_ADMIN", "ADMIN_FARMACIA", "RT"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const treinamento = await prisma.treinamento.findUnique({
      where: { id: params.id },
      include: { pop: true, colaborador: true },
    });

    if (!treinamento) {
      return NextResponse.json({ error: "Treinamento não encontrado" }, { status: 404 });
    }

    // Check tenant access
    if (user.role !== "SUPER_ADMIN" && treinamento.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const data = await request.json();

    const updatedTreinamento = await prisma.treinamento.update({
      where: { id: params.id },
      data: {
        ...(data.dataTreinamento && { dataTreinamento: new Date(data.dataTreinamento) }),
        ...(data.instrutor && { instrutor: data.instrutor }),
        ...(data.duracao !== undefined && { duracao: data.duracao ? parseFloat(data.duracao) : null }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes || null }),
        ...(data.status && { status: data.status }),
      },
      include: {
        pop: { select: { codigo: true, titulo: true } },
        colaborador: { select: { nome: true } },
      },
    });

    const auditAction = data.status === "CONCLUIDO" ? AUDIT_ACTIONS.TREINAMENTO_COMPLETED : AUDIT_ACTIONS.TREINAMENTO_UPDATED;

    await createAuditLog({
      action: auditAction,
      entity: "Treinamento",
      entityId: treinamento.id,
      userId: user.id,
      userName: user.name,
      tenantId: treinamento.tenantId,
      details: {
        pop: treinamento.pop?.codigo,
        colaborador: treinamento.colaborador?.nome,
        changes: Object.keys(data),
      },
    });

    return NextResponse.json({ success: true, treinamento: updatedTreinamento });
  } catch (error: any) {
    console.error("Error updating treinamento:", error);
    return NextResponse.json({ error: "Erro ao atualizar treinamento" }, { status: 500 });
  }
}
