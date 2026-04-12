import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    if (!user.tenantId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const popId = searchParams.get("popId");
    const colaboradorId = searchParams.get("colaboradorId");
    const status = searchParams.get("status");
    const tenantIdParam = searchParams.get("tenantId");

    const tenantId = user.role === "SUPER_ADMIN" ? tenantIdParam : user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não especificado" }, { status: 400 });
    }

    const where: any = { tenantId };
    if (popId) where.popId = popId;
    if (colaboradorId) where.colaboradorId = colaboradorId;
    if (status) where.status = status;

    const treinamentos = await prisma.treinamento.findMany({
      where,
      orderBy: { dataTreinamento: "desc" },
      select: {
        id: true,
        popId: true,
        colaboradorId: true,
        dataTreinamento: true,
        instrutor: true,
        duracao: true,
        observacoes: true,
        notaQuiz: true,
        aprovadoQuiz: true,
        status: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        pop: { select: { id: true, codigo: true, titulo: true, setor: true } },
        colaborador: { select: { id: true, nome: true, funcao: true } },
      },
    });

    return NextResponse.json({ treinamentos });
  } catch (error: any) {
    console.error("Error fetching treinamentos:", error);
    return NextResponse.json({ error: "Erro ao buscar treinamentos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    // Check permissions
    if (!["SUPER_ADMIN", "ADMIN_FARMACIA", "RT", "OPERADOR"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!user.tenantId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
    }

    const data = await request.json();
    const { popId, colaboradorId, dataTreinamento, instrutor, duracao, observacoes, status: treinamentoStatus } = data;

    // Validate required fields
    if (!popId || !colaboradorId || !dataTreinamento || !instrutor) {
      return NextResponse.json({ error: "Todos os campos obrigatórios devem ser preenchidos" }, { status: 400 });
    }

    const tenantId = data.tenantId || user.tenantId;

    // Verify POP belongs to tenant
    const pop = await prisma.pop.findFirst({
      where: { id: popId, tenantId },
    });

    if (!pop) {
      return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });
    }

    // Verify Colaborador belongs to tenant
    const colaborador = await prisma.colaborador.findFirst({
      where: { id: colaboradorId, tenantId },
    });

    if (!colaborador) {
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
    }

    const treinamento = await prisma.treinamento.create({
      data: {
        popId,
        colaboradorId,
        dataTreinamento: new Date(dataTreinamento),
        instrutor,
        duracao: duracao ? parseFloat(duracao) : null,
        observacoes: observacoes || null,
        status: treinamentoStatus || "CONCLUIDO",
        tenantId,
      },
      include: {
        pop: { select: { codigo: true, titulo: true } },
        colaborador: { select: { nome: true } },
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.TREINAMENTO_CREATED,
      entity: "Treinamento",
      entityId: treinamento.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: {
        pop: treinamento.pop?.codigo,
        colaborador: treinamento.colaborador?.nome,
        instrutor,
      },
    });

    return NextResponse.json({ success: true, treinamento });
  } catch (error: any) {
    console.error("Error creating treinamento:", error);
    return NextResponse.json({ error: "Erro ao criar treinamento" }, { status: 500 });
  }
}
