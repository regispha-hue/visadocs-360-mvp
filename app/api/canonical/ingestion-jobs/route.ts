import { NextResponse } from "next/server";
import { z } from "zod";
import { AUDIT_ACTIONS, createAuditLog, createDocumentLifecycleEvent } from "@/lib/audit";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const canonicalIngestionJobSchema = z.object({
  tenantId: z.string().min(1, "tenantId é obrigatório").optional(),
  libraryItemId: z.string().min(1, "libraryItemId é obrigatório").optional(),
  documentaryLibraryItemId: z.string().min(1, "documentaryLibraryItemId é obrigatório").optional(),
  sourceType: z.literal("DOCUMENTARY_LIBRARY_ITEM"),
}).refine((data) => data.libraryItemId || data.documentaryLibraryItemId, {
  message: "libraryItemId ou documentaryLibraryItemId é obrigatório",
  path: ["libraryItemId"],
});

const ACTIVE_JOB_STATUSES = ["PENDING", "QUEUED", "PROCESSING"];
const ACTIVE_DOCUMENT_STATUSES = ["DRAFT", "PENDING_REVIEW", "ACTIVE"];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { tenantId, response } = requireTenantId(user);
    if (response) return response;

    const [documents, jobs] = await Promise.all([
      prisma.canonicalDocument.findMany({
        where: { tenantId: tenantId! },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          code: true,
          kind: true,
          status: true,
          sourceType: true,
          sourceId: true,
          libraryItemId: true,
          category: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.canonicalIngestionJob.findMany({
        where: { tenantId: tenantId! },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          sourceType: true,
          sourceId: true,
          status: true,
          canonicalDocumentId: true,
          requestedByUserName: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({ documents, jobs });
  } catch (error) {
    console.error("Error listing canonical ingestion jobs:", error);
    return NextResponse.json({ error: "Erro ao listar documentos canônicos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) return forbidden();

    const body = await request.json();
    const parsed = canonicalIngestionJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
    }

    const { tenantId, response } = requireTenantId(user, parsed.data.tenantId);
    if (response) return response;
    const libraryItemId = parsed.data.libraryItemId || parsed.data.documentaryLibraryItemId;

    const libraryItem = await prisma.documentaryLibraryItem.findFirst({
      where: { id: libraryItemId, tenantId: tenantId! },
      select: {
        id: true,
        title: true,
        code: true,
        category: true,
        type: true,
        status: true,
        version: true,
      },
    });

    if (!libraryItem) {
      return NextResponse.json({ error: "Item da biblioteca documental não encontrado" }, { status: 404 });
    }

    const existingActiveJob = await prisma.canonicalIngestionJob.findFirst({
      where: {
        tenantId: tenantId!,
        sourceType: parsed.data.sourceType,
        sourceId: libraryItem.id,
        status: { in: ACTIVE_JOB_STATUSES },
      },
      select: { id: true, status: true },
    });

    if (existingActiveJob) {
      return NextResponse.json(
        { error: "Já existe job de ingestão canônica ativo para este item documental" },
        { status: 409 }
      );
    }

    const existingActiveDocument = await prisma.canonicalDocument.findFirst({
      where: {
        tenantId: tenantId!,
        libraryItemId: libraryItem.id,
        status: { in: ACTIVE_DOCUMENT_STATUSES },
      },
      select: { id: true, status: true },
    });

    if (existingActiveDocument) {
      return NextResponse.json(
        { error: "Já existe documento canônico ativo para este item documental" },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const canonicalDocument = await tx.canonicalDocument.create({
        data: {
          tenantId: tenantId!,
          kind: "LIBRARY_ITEM",
          status: "PENDING_REVIEW",
          title: libraryItem.title,
          code: libraryItem.code,
          category: libraryItem.category,
          version: libraryItem.version,
          sourceType: parsed.data.sourceType,
          sourceId: libraryItem.id,
          libraryItemId: libraryItem.id,
          createdByUserId: user.id,
          createdByUserName: user.name || user.email || null,
          metadata: {
            libraryItemType: libraryItem.type,
            libraryItemStatus: libraryItem.status,
            phase: "canonical_knowledge_layer_phase_2_minimal_ingestion_api",
            contentProcessed: false,
          },
        },
      });

      const ingestionJob = await tx.canonicalIngestionJob.create({
        data: {
          tenantId: tenantId!,
          sourceType: parsed.data.sourceType,
          sourceId: libraryItem.id,
          status: "PENDING",
          requestedByUserId: user.id,
          requestedByUserName: user.name || user.email || null,
          canonicalDocumentId: canonicalDocument.id,
          metadata: {
            libraryItemTitle: libraryItem.title,
            libraryItemCode: libraryItem.code,
            libraryItemVersion: libraryItem.version,
            contentProcessingDeferred: true,
          },
        },
      });

      return { ingestionJob, canonicalDocument };
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.CANONICAL_INGESTION_JOB_CREATED,
      entity: "CanonicalIngestionJob",
      entityId: result.ingestionJob.id,
      userId: user.id,
      userName: user.name || undefined,
      tenantId: tenantId!,
      details: {
        sourceType: parsed.data.sourceType,
        sourceId: libraryItem.id,
        canonicalDocumentId: result.canonicalDocument.id,
        status: result.ingestionJob.status,
      },
    });

    await createDocumentLifecycleEvent({
      tenantId: tenantId!,
      entityType: "CanonicalDocument",
      entityId: result.canonicalDocument.id,
      relatedEntityType: "DocumentaryLibraryItem",
      relatedEntityId: libraryItem.id,
      action: "CANONICAL_DOCUMENT_REGISTERED",
      statusTo: result.canonicalDocument.status,
      version: result.canonicalDocument.version || undefined,
      userId: user.id,
      userName: user.name || undefined,
      metadata: {
        ingestionJobId: result.ingestionJob.id,
        sourceType: parsed.data.sourceType,
        contentProcessed: false,
      },
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("Error creating canonical ingestion job:", error);
    return NextResponse.json({ error: "Erro ao criar job de ingestão canônica" }, { status: 500 });
  }
}
