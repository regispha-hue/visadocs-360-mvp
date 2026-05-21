import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const draft = await prisma.assistedPopDraft.findFirst({
      where: { id: id, ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }) },
      include: { sources: { include: { libraryItem: true } }, approvalEvents: true, approvedVersions: true },
    });

    if (!draft) return NextResponse.json({ error: "Minuta não encontrada" }, { status: 404 });

    const events = await prisma.documentLifecycleEvent.findMany({
      where: { tenantId: draft.tenantId, entityType: "AssistedPopDraft", entityId: draft.id },
      orderBy: { occurredAt: "desc" },
    });

    return NextResponse.json({ draft, events });
  } catch (error) {
    console.error("Error fetching draft history:", error);
    return NextResponse.json({ error: "Erro ao buscar histórico da minuta" }, { status: 500 });
  }
}
