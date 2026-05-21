import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const item = await prisma.documentaryLibraryItem.findFirst({
      where: { id: id, ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }) },
      select: { id: true, tenantId: true },
    });

    if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

    const [events, derivedDrafts] = await Promise.all([
      prisma.documentLifecycleEvent.findMany({
        where: {
          tenantId: item.tenantId,
          OR: [
            { entityType: "DocumentaryLibraryItem", entityId: item.id },
            { relatedEntityType: "DocumentaryLibraryItem", relatedEntityId: item.id },
          ],
        },
        orderBy: { occurredAt: "desc" },
      }),
      prisma.assistedPopDraftSource.findMany({
        where: { tenantId: item.tenantId, libraryItemId: item.id },
        include: { draft: { select: { id: true, title: true, status: true, version: true, createdAt: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ events, derivedDrafts });
  } catch (error) {
    console.error("Error fetching library history:", error);
    return NextResponse.json({ error: "Erro ao buscar histórico do item" }, { status: 500 });
  }
}
