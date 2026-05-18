import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, createAuditLog, createDocumentLifecycleEvent } from "@/lib/audit";
import { documentLibraryItemSchema } from "@/lib/validations";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "RT", "OPERADOR"].includes(user.role)) return forbidden();

    const { searchParams } = new URL(request.url);
    const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
    if (response) return response;

    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    const items = await prisma.documentaryLibraryItem.findMany({
      where: {
        tenantId: tenantId!,
        ...(type && { type }),
        ...(status && { status }),
        ...(category && { category }),
        ...(q && {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      select: {
        id: true,
        type: true,
        title: true,
        code: true,
        category: true,
        status: true,
        version: true,
        source: true,
        sourcePopId: true,
        createdByUserName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching document library:", error);
    return NextResponse.json({ error: "Erro ao buscar biblioteca documental" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) return forbidden();

    const body = await request.json();
    const parsed = documentLibraryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
    }

    const { tenantId, response } = requireTenantId(user, body.tenantId);
    if (response) return response;

    const data = parsed.data;
    const item = await prisma.documentaryLibraryItem.create({
      data: {
        tenantId: tenantId!,
        type: data.type,
        title: data.title,
        code: data.code || null,
        category: data.category || null,
        status: data.status || "ACTIVE",
        version: data.version || null,
        content: data.content || null,
        source: data.source || "manual",
        sourcePopId: data.sourcePopId || null,
        createdByUserId: user.id,
        createdByUserName: user.name || user.email || null,
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.LIBRARY_ITEM_CREATED,
      entity: "DocumentaryLibraryItem",
      entityId: item.id,
      userId: user.id,
      userName: user.name || undefined,
      tenantId: tenantId!,
      details: { type: item.type, status: item.status, version: item.version },
    });

    await createDocumentLifecycleEvent({
      tenantId: tenantId!,
      entityType: "DocumentaryLibraryItem",
      entityId: item.id,
      action: "LIBRARY_ITEM_CREATED",
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
    console.error("Error creating document library item:", error);
    return NextResponse.json({ error: "Erro ao criar item da biblioteca" }, { status: 500 });
  }
}
