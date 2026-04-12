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
    const pop = await prisma.pop.findUnique({
      where: { id: params.id },
      include: {
        treinamentos: {
          include: {
            colaborador: { select: { id: true, nome: true, funcao: true } },
          },
          orderBy: { dataTreinamento: "desc" },
        },
        documentos: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            tipo: true,
            categoria: true,
            versao: true,
          },
          orderBy: { codigo: "asc" },
        },
      },
    });

    if (!pop) {
      return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });
    }

    // Check tenant access
    if (user.role !== "SUPER_ADMIN" && pop.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ pop });
  } catch (error: any) {
    console.error("Error fetching POP:", error);
    return NextResponse.json({ error: "Erro ao buscar POP" }, { status: 500 });
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

    const pop = await prisma.pop.findUnique({ where: { id: params.id } });

    if (!pop) {
      return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });
    }

    // Check tenant access
    if (user.role !== "SUPER_ADMIN" && pop.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const data = await request.json();

    const updatedPop = await prisma.pop.update({
      where: { id: params.id },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.setor && { setor: data.setor }),
        ...(data.versao && { versao: data.versao }),
        ...(data.dataRevisao && { dataRevisao: new Date(data.dataRevisao) }),
        ...(data.responsavel && { responsavel: data.responsavel }),
        ...(data.objetivo && { objetivo: data.objetivo }),
        ...(data.descricao && { descricao: data.descricao }),
        ...(data.equipeEnvolvida !== undefined && { equipeEnvolvida: data.equipeEnvolvida || null }),
        ...(data.glossario !== undefined && { glossario: data.glossario || null }),
        ...(data.literaturaConsultada !== undefined && { literaturaConsultada: data.literaturaConsultada || null }),
        ...(data.validadoPor !== undefined && { validadoPor: data.validadoPor || null }),
        ...(data.implantadoPor !== undefined && { implantadoPor: data.implantadoPor || null }),
        ...(data.implantadoEm !== undefined && { implantadoEm: data.implantadoEm ? new Date(data.implantadoEm) : null }),
        ...(data.validadeAnos !== undefined && { validadeAnos: data.validadeAnos || 2 }),
        ...(data.arquivoUrl !== undefined && { arquivoUrl: data.arquivoUrl }),
        ...(data.arquivoNome !== undefined && { arquivoNome: data.arquivoNome }),
        ...(data.arquivoPublic !== undefined && { arquivoPublic: data.arquivoPublic }),
        ...(data.status && { status: data.status }),
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_UPDATED,
      entity: "Pop",
      entityId: pop.id,
      userId: user.id,
      userName: user.name,
      tenantId: pop.tenantId,
      details: { codigo: pop.codigo, changes: Object.keys(data) },
    });

    return NextResponse.json({ success: true, pop: updatedPop });
  } catch (error: any) {
    console.error("Error updating POP:", error);
    return NextResponse.json({ error: "Erro ao atualizar POP" }, { status: 500 });
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

    // Check permissions
    if (!["SUPER_ADMIN", "ADMIN_FARMACIA"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const pop = await prisma.pop.findUnique({ where: { id: params.id } });

    if (!pop) {
      return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });
    }

    // Check tenant access
    if (user.role !== "SUPER_ADMIN" && pop.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.pop.delete({ where: { id: params.id } });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_ARCHIVED,
      entity: "Pop",
      entityId: pop.id,
      userId: user.id,
      userName: user.name,
      tenantId: pop.tenantId,
      details: { codigo: pop.codigo },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting POP:", error);
    return NextResponse.json({ error: "Erro ao excluir POP" }, { status: 500 });
  }
}
