import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { AUDIT_ACTIONS, createAuditLog, createDocumentLifecycleEvent } from "@/lib/audit";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MIN_CHUNK_SIZE = 1200;
const MAX_CHUNK_SIZE = 1800;
const OVERLAP_SIZE = 200;

function normalizeText(text?: string | null) {
  return (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hashText(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

function extractHeading(text: string) {
  const firstLine = text.split("\n").map((line) => line.trim()).find(Boolean);
  if (!firstLine) return null;
  return firstLine.length <= 120 ? firstLine : null;
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function splitIntoChunks(text: string) {
  const chunks: Array<{ heading: string | null; text: string; tokenEstimate: number; sourceHash: string }> = [];
  let cursor = 0;

  while (cursor < text.length) {
    let end = Math.min(cursor + MAX_CHUNK_SIZE, text.length);

    if (end < text.length) {
      const lastParagraphBreak = text.lastIndexOf("\n\n", end);
      const lastSentenceEnd = Math.max(text.lastIndexOf(". ", end), text.lastIndexOf("; ", end), text.lastIndexOf(": ", end));
      const preferredEnd = Math.max(lastParagraphBreak, lastSentenceEnd);

      if (preferredEnd > cursor + MIN_CHUNK_SIZE) {
        end = preferredEnd + 1;
      }
    }

    const chunkText = text.slice(cursor, end).trim();
    if (chunkText) {
      chunks.push({
        heading: extractHeading(chunkText),
        text: chunkText,
        tokenEstimate: estimateTokens(chunkText),
        sourceHash: hashText(chunkText),
      });
    }

    if (end >= text.length) break;
    cursor = Math.max(end - OVERLAP_SIZE, cursor + 1);
  }

  return chunks;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const { tenantId, response } = requireTenantId(user);
    if (response) return response;

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const limitParam = Number(url.searchParams.get("limit") || "20");
    const cursorParam = url.searchParams.get("cursor");
    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 20, 1), 50);
    const cursor = cursorParam ? Number(cursorParam) : null;

    const canonicalDocument = await prisma.canonicalDocument.findFirst({
      where: { id, tenantId: tenantId! },
      select: {
        id: true,
        title: true,
        code: true,
        status: true,
        kind: true,
        updatedAt: true,
      },
    });

    if (!canonicalDocument) {
      return NextResponse.json({ error: "Documento canônico não encontrado" }, { status: 404 });
    }

    const chunks = await prisma.canonicalChunk.findMany({
      where: {
        tenantId: tenantId!,
        canonicalDocumentId: canonicalDocument.id,
        ...(cursor !== null && Number.isFinite(cursor) ? { chunkIndex: { gt: cursor } } : {}),
        ...(q
          ? {
              OR: [
                { text: { contains: q, mode: "insensitive" } },
                { heading: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { chunkIndex: "asc" },
      take: limit + 1,
      select: {
        id: true,
        chunkIndex: true,
        heading: true,
        text: true,
        tokenEstimate: true,
        semanticRole: true,
        sourceHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasMore = chunks.length > limit;
    const visibleChunks = hasMore ? chunks.slice(0, limit) : chunks;
    const nextCursor = hasMore ? visibleChunks[visibleChunks.length - 1]?.chunkIndex ?? null : null;

    return NextResponse.json({
      canonicalDocument,
      chunks: visibleChunks,
      pagination: {
        limit,
        nextCursor,
        hasMore,
      },
      query: q || null,
    });
  } catch (error) {
    console.error("Error listing canonical chunks:", error);
    return NextResponse.json({ error: "Erro ao listar chunks do documento canônico" }, { status: 500 });
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) return forbidden();

    const { id } = await params;
    const { tenantId, response } = requireTenantId(user);
    if (response) return response;

    const canonicalDocument = await prisma.canonicalDocument.findFirst({
      where: { id, tenantId: tenantId! },
      include: {
        libraryItem: { select: { id: true, title: true, content: true } },
        approvedPopVersion: { select: { id: true, title: true, contentSnapshot: true } },
      },
    });

    if (!canonicalDocument) {
      return NextResponse.json({ error: "Documento canônico não encontrado" }, { status: 404 });
    }

    const existingChunk = await prisma.canonicalChunk.findFirst({
      where: { tenantId: tenantId!, canonicalDocumentId: canonicalDocument.id },
      select: { id: true },
    });

    if (existingChunk) {
      return NextResponse.json({ error: "Este documento canônico já possui chunks gerados" }, { status: 409 });
    }

    const sourceText = normalizeText(
      canonicalDocument.normalizedTextPreview ||
        canonicalDocument.libraryItem?.content ||
        canonicalDocument.approvedPopVersion?.contentSnapshot
    );

    if (!sourceText) {
      return NextResponse.json(
        { error: "Documento canônico sem texto disponível para chunking" },
        { status: 422 }
      );
    }

    const chunks = splitIntoChunks(sourceText);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Não foi possível gerar chunks a partir do texto disponível" },
        { status: 422 }
      );
    }

    const sourceHash = hashText(sourceText);
    const previousStatus = canonicalDocument.status;

    const result = await prisma.$transaction(async (tx) => {
      const createdChunks = await Promise.all(
        chunks.map((chunk, index) =>
          tx.canonicalChunk.create({
            data: {
              tenantId: tenantId!,
              canonicalDocumentId: canonicalDocument.id,
              chunkIndex: index,
              heading: chunk.heading,
              text: chunk.text,
              tokenEstimate: chunk.tokenEstimate,
              semanticRole: "UNKNOWN",
              sourceHash: chunk.sourceHash,
            },
          })
        )
      );

      const updatedDocument = await tx.canonicalDocument.update({
        where: { id: canonicalDocument.id },
        data: {
          status: "CHUNKED",
          sourceHash,
          normalizedTextHash: sourceHash,
          normalizedTextPreview: sourceText.slice(0, 2000),
          metadata: {
            ...(canonicalDocument.metadata && typeof canonicalDocument.metadata === "object" && !Array.isArray(canonicalDocument.metadata)
              ? canonicalDocument.metadata
              : {}),
            chunking: {
              strategy: "canonical_chunking_v1",
              compatibility: "FRAG-ALL compatible storage layer",
              chunkSize: `${MIN_CHUNK_SIZE}-${MAX_CHUNK_SIZE}`,
              overlap: OVERLAP_SIZE,
              chunksCreated: createdChunks.length,
            },
          },
        },
      });

      return { createdChunks, updatedDocument };
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.CANONICAL_DOCUMENT_CHUNKED,
      entity: "CanonicalDocument",
      entityId: canonicalDocument.id,
      userId: user.id,
      userName: user.name || undefined,
      tenantId: tenantId!,
      details: {
        chunksCreated: result.createdChunks.length,
        sourceHash,
        statusFrom: previousStatus,
        statusTo: result.updatedDocument.status,
      },
    });

    await createDocumentLifecycleEvent({
      tenantId: tenantId!,
      entityType: "CanonicalDocument",
      entityId: canonicalDocument.id,
      relatedEntityType: "CanonicalChunk",
      relatedEntityId: result.createdChunks[0]?.id,
      action: "CANONICAL_DOCUMENT_CHUNKED",
      statusFrom: previousStatus,
      statusTo: result.updatedDocument.status,
      version: canonicalDocument.version || undefined,
      userId: user.id,
      userName: user.name || undefined,
      metadata: {
        chunksCreated: result.createdChunks.length,
        sourceHash,
        strategy: "canonical_chunking_v1",
        compatibility: "FRAG-ALL compatible storage layer",
      },
    });

    return NextResponse.json(
      {
        success: true,
        canonicalDocument: result.updatedDocument,
        chunksCreated: result.createdChunks.length,
        chunks: result.createdChunks.map((chunk) => ({
          id: chunk.id,
          chunkIndex: chunk.chunkIndex,
          tokenEstimate: chunk.tokenEstimate,
          semanticRole: chunk.semanticRole,
          sourceHash: chunk.sourceHash,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error chunking canonical document:", error);
    return NextResponse.json({ error: "Erro ao gerar chunks do documento canônico" }, { status: 500 });
  }
}
