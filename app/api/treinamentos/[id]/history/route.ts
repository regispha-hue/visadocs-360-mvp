import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const treinamento = await prisma.treinamento.findFirst({
      where: { id: id, ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }) },
      include: {
        pop: { select: { id: true, codigo: true, titulo: true } },
        colaborador: { select: { id: true, nome: true, funcao: true } },
        approvedPopVersion: true,
      },
    });

    if (!treinamento) return NextResponse.json({ error: "Treinamento não encontrado" }, { status: 404 });

    const events = await prisma.documentLifecycleEvent.findMany({
      where: { tenantId: treinamento.tenantId, entityType: "Treinamento", entityId: treinamento.id },
      orderBy: { occurredAt: "desc" },
    });

    return NextResponse.json({ treinamento, events });
  } catch (error) {
    console.error("Error fetching training history:", error);
    return NextResponse.json({ error: "Erro ao buscar histórico do treinamento" }, { status: 500 });
  }
}
