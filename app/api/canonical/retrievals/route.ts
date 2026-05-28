import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const retrievalSchema = z.object({
  q: z.string().trim().min(2, "q deve ter pelo menos 2 caracteres"),
  documentId: z.string().trim().min(1).optional(),
  purpose: z.string().trim().min(1).max(80).default("CANONICAL_SEARCH"),
  limit: z.number().int().min(1).max(20).optional(),
});

function hashQuery(query: string) {
  return createHash("sha256").update(query.trim().toLowerCase()).digest("hex");
}

function previewQuery(query: string) {
  return query.replace(/\s+/g, " ").trim().slice(0, 160);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["ADMIN", "RT"].includes(user.role)) return forbidden();

    const { tenantId, response } = requireTenantId(user);
    if (response) return forbidden("Tenant não especificado");

    const body = await request.json().catch(() => null);
    const parsed = retrievalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
    }

    const query = parsed.data.q.trim();
    const limit = parsed.data.limit ?? 10;
    let documentFilter = {};

    if (parsed.data.documentId) {
      const canonicalDocument = await prisma.canonicalDocument.findFirst({
        where: { id: parsed.data.documentId, tenantId: tenantId! },
        select: { id: true },
      });

      if (!canonicalDocument) {
        return NextResponse.json({ error: "Documento canônico não encontrado" }, { status: 404 });
      }

      documentFilter = { canonicalDocumentId: canonicalDocument.id };
    }

    const chunks = await prisma.canonicalChunk.findMany({
      where: {
        tenantId: tenantId!,
        ...documentFilter,
        OR: [
          { text: { contains: query, mode: "insensitive" } },
          { heading: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [{ canonicalDocumentId: "asc" }, { chunkIndex: "asc" }],
      take: limit,
      select: {
        id: true,
        canonicalDocumentId: true,
        chunkIndex: true,
        heading: true,
        text: true,
        tokenEstimate: true,
        semanticRole: true,
        sourceHash: true,
        canonicalDocument: {
          select: {
            id: true,
            title: true,
            code: true,
            status: true,
            kind: true,
          },
        },
      },
    });

    const retrievalLog = await prisma.ragRetrievalLog.create({
      data: {
        tenantId: tenantId!,
        userId: user.id,
        purpose: parsed.data.purpose,
        queryPreview: previewQuery(query),
        queryHash: hashQuery(query),
        documentId: parsed.data.documentId || null,
        retrievedChunkIds: chunks.map((chunk) => chunk.id),
        resultCount: chunks.length,
        filtersJson: {
          documentId: parsed.data.documentId || null,
          limit,
          mode: "TEXT_CONTAINS",
        },
      },
      select: { id: true },
    });

    return NextResponse.json({
      retrievalLogId: retrievalLog.id,
      resultCount: chunks.length,
      chunks,
    });
  } catch (error) {
    console.error("Error running canonical retrieval:", error);
    return NextResponse.json({ error: "Erro ao executar busca canônica" }, { status: 500 });
  }
}
