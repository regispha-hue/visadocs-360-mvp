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

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const STOPWORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "a",
  "o",
  "as",
  "os",
  "em",
  "para",
  "por",
  "com",
  "um",
  "uma",
  "no",
  "na",
  "nos",
  "nas",
]);

function tokenizeQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = normalizedQuery
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !STOPWORDS.has(token));

  if (tokens.length > 0) {
    return Array.from(new Set(tokens));
  }

  const fallback = normalizedQuery.replace(/[^a-z0-9]+/gi, "").trim();
  return fallback.length >= 2 ? [fallback] : [];
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
    const normalizedQuery = normalizeSearchText(query);
    const queryTokens = tokenizeQuery(query);
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

    const candidateLimit = Math.max(500, limit * 50);
    const candidateChunks = await prisma.canonicalChunk.findMany({
      where: {
        tenantId: tenantId!,
        ...documentFilter,
      },
      orderBy: [{ canonicalDocumentId: "asc" }, { chunkIndex: "asc" }],
      take: candidateLimit,
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

    const chunks = candidateChunks
      .map((chunk) => {
        const searchableText = normalizeSearchText(`${chunk.heading ?? ""} ${chunk.text}`);
        const matchedTokens = queryTokens.filter((token) => searchableText.includes(token));
        const phraseMatch = normalizedQuery.length >= 2 && searchableText.includes(normalizedQuery);
        const score = (phraseMatch ? 3 : 0) + matchedTokens.length;

        return { chunk, score, matchedTokenCount: matchedTokens.length };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.matchedTokenCount !== a.matchedTokenCount) return b.matchedTokenCount - a.matchedTokenCount;
        if (a.chunk.canonicalDocumentId !== b.chunk.canonicalDocumentId) {
          return a.chunk.canonicalDocumentId.localeCompare(b.chunk.canonicalDocumentId);
        }
        return a.chunk.chunkIndex - b.chunk.chunkIndex;
      })
      .slice(0, limit)
      .map((result) => result.chunk);

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
          mode: "TEXT_TOKENIZED_NORMALIZED",
          queryTokens,
          candidateLimit,
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
