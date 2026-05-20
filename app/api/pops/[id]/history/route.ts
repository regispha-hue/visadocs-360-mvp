import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const pop = await prisma.pop.findFirst({
      where: { id: id, ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }) },
      select: { id: true, tenantId: true },
    });

    if (!pop) return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });

    const [versions, approvals, events, trainings] = await Promise.all([
      prisma.approvedPopVersion.findMany({
        where: { tenantId: pop.tenantId, popId: pop.id },
        orderBy: { approvedAt: "desc" },
      }),
      prisma.rTApprovalEvent.findMany({
        where: { tenantId: pop.tenantId, popId: pop.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.documentLifecycleEvent.findMany({
        where: {
          tenantId: pop.tenantId,
          OR: [
            { entityType: "Pop", entityId: pop.id },
            { relatedEntityType: "Pop", relatedEntityId: pop.id },
          ],
        },
        orderBy: { occurredAt: "desc" },
      }),
      prisma.treinamento.findMany({
        where: { tenantId: pop.tenantId, popId: pop.id },
        select: {
          id: true,
          status: true,
          dataTreinamento: true,
          approvedPopVersionId: true,
          popVersaoSnapshot: true,
          colaborador: { select: { id: true, nome: true } },
        },
        orderBy: { dataTreinamento: "desc" },
      }),
    ]);

    return NextResponse.json({ versions, approvals, events, trainings });
  } catch (error) {
    console.error("Error fetching POP history:", error);
    return NextResponse.json({ error: "Erro ao buscar histórico do POP" }, { status: 500 });
  }
}
