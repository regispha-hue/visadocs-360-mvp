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
    const colaborador = await prisma.colaborador.findUnique({
      where: { id: params.id },
      include: {
        treinamentos: {
          include: {
            pop: { select: { id: true, codigo: true, titulo: true, setor: true } },
            tentativasQuiz: {
              where: { aprovado: true },
              select: { id: true, nota: true, aprovado: true, codigoValidacao: true, completadoEm: true },
              orderBy: { completadoEm: "desc" },
              take: 1,
            },
          },
          orderBy: { dataTreinamento: "desc" },
        },
      },
    });

    if (!colaborador) {
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
    }

    // Check tenant access
    if (user.role !== "SUPER_ADMIN" && colaborador.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ colaborador });
  } catch (error: any) {
    console.error("Error fetching colaborador:", error);
    return NextResponse.json({ error: "Erro ao buscar colaborador" }, { status: 500 });
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

    const colaborador = await prisma.colaborador.findUnique({ where: { id: params.id } });

    if (!colaborador) {
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
    }

    // Check tenant access
    if (user.role !== "SUPER_ADMIN" && colaborador.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const data = await request.json();

    const updatedColaborador = await prisma.colaborador.update({
      where: { id: params.id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.funcao && { funcao: data.funcao }),
        ...(data.setor && { setor: data.setor }),
        ...(data.dataAdmissao && { dataAdmissao: new Date(data.dataAdmissao) }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.status && { status: data.status }),
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.COLABORADOR_UPDATED,
      entity: "Colaborador",
      entityId: colaborador.id,
      userId: user.id,
      userName: user.name,
      tenantId: colaborador.tenantId,
      details: { nome: colaborador.nome, changes: Object.keys(data) },
    });

    return NextResponse.json({ success: true, colaborador: updatedColaborador });
  } catch (error: any) {
    console.error("Error updating colaborador:", error);
    return NextResponse.json({ error: "Erro ao atualizar colaborador" }, { status: 500 });
  }
}
