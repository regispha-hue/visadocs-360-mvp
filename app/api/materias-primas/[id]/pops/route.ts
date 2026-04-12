import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
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
    const { popId, quantidade, observacoes } = data;

    if (!popId) {
      return NextResponse.json({ error: "POP é obrigatório" }, { status: 400 });
    }

    const pop = await prisma.pop.findUnique({ where: { id: popId } });

    if (!pop || pop.tenantId !== materiaPrima.tenantId) {
      return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });
    }

    const existingLink = await prisma.popMateriaPrima.findFirst({
      where: { popId, materiaPrimaId: params.id },
    });

    if (existingLink) {
      return NextResponse.json({ error: "Esta matéria-prima já está vinculada a este POP" }, { status: 400 });
    }

    const link = await prisma.popMateriaPrima.create({
      data: {
        popId,
        materiaPrimaId: params.id,
        quantidade: quantidade ? parseFloat(quantidade) : null,
        observacoes: observacoes || null,
      },
      include: {
        pop: { select: { id: true, codigo: true, titulo: true } },
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_MP_LINKED,
      entity: "PopMateriaPrima",
      entityId: link.id,
      userId: user.id,
      userName: user.name,
      tenantId: materiaPrima.tenantId,
      details: { materiaPrima: materiaPrima.nome, pop: pop.titulo },
    });

    return NextResponse.json({ success: true, link });
  } catch (error: any) {
    console.error("Error linking MP to POP:", error);
    return NextResponse.json({ error: "Erro ao vincular matéria-prima ao POP" }, { status: 500 });
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

    if (!["SUPER_ADMIN", "ADMIN_FARMACIA", "RT", "ANALISTA_CQ"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const popId = searchParams.get("popId");

    if (!popId) {
      return NextResponse.json({ error: "POP é obrigatório" }, { status: 400 });
    }

    const link = await prisma.popMateriaPrima.findFirst({
      where: { popId, materiaPrimaId: params.id },
      include: {
        materiaPrima: { select: { tenantId: true, nome: true } },
        pop: { select: { titulo: true } },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Vínculo não encontrado" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && link.materiaPrima.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.popMateriaPrima.delete({ where: { id: link.id } });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_MP_UNLINKED,
      entity: "PopMateriaPrima",
      entityId: link.id,
      userId: user.id,
      userName: user.name,
      tenantId: link.materiaPrima.tenantId,
      details: { materiaPrima: link.materiaPrima.nome, pop: link.pop.titulo },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error unlinking MP from POP:", error);
    return NextResponse.json({ error: "Erro ao desvincular matéria-prima do POP" }, { status: 500 });
  }
}
