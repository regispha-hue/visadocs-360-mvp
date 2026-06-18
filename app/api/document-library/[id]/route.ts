import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, createAuditLog, createDocumentLifecycleEvent } from "@/lib/audit";
import { documentLibraryItemSchema } from "@/lib/validations";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "RT", "OPERADOR"].includes(user.role)) return forbidden();

    const item = await prisma.documentaryLibraryItem.findFirst({
      where: {
        id,
        ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }),
      },
      select: {
        id: true,
        type: true,
        title: true,
        code: true,
        category: true,
        status: true,
        version: true,
        content: true,
        source: true,
        sourcePopId: true,
        createdByUserName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error fetching document library item:", error);
    return NextResponse.json({ error: "Erro ao buscar item da biblioteca" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) return forbidden();

    const existing = await prisma.documentaryLibraryItem.findFirst({
      where: {
        id,
        ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }),
      },
    });

    if (!existing) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

    const body = await request.json();
    const parsed = documentLibraryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const item = await prisma.documentaryLibraryItem.update({
      where: { id },
      data: {
        type: data.type,
        title: data.title,
        code: data.code || null,
        category: data.category || null,
        status: data.status || existing.status,
        version: data.version || null,
        content: data.content || null,
        source: data.source || existing.source,
        sourcePopId: data.sourcePopId || null,
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.LIBRARY_ITEM_UPDATED,
      entity: "DocumentaryLibraryItem",
      entityId: item.id,
      userId: user.id,
      userName: user.name || undefined,
      tenantId: item.tenantId,
      details: {
        type: item.type,
        statusFrom: existing.status,
        statusTo: item.status,
        versionFrom: existing.version,
        versionTo: item.version,
      },
    });

    await createDocumentLifecycleEvent({
      tenantId: item.tenantId,
      entityType: "DocumentaryLibraryItem",
      entityId: item.id,
      action: "LIBRARY_ITEM_UPDATED",
      statusFrom: existing.status,
      statusTo: item.status,
      version: item.version || undefined,
      userId: user.id,
      userName: user.name || undefined,
      metadata: {
        type: item.type,
        title: item.title,
        code: item.code,
        category: item.category,
        source: item.source,
        sourcePopId: item.sourcePopId,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Error updating document library item:", error);
    return NextResponse.json({ error: "Erro ao atualizar item da biblioteca" }, { status: 500 });
  }
}
