import { NextResponse } from "next/server";
import { z } from "zod";
import { AUDIT_ACTIONS, createAuditLog, createDocumentLifecycleEvent } from "@/lib/audit";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const canonicalDraftSchema = z.object({
  retrievalLogId: z.string().trim().min(1).optional(),
  chunkIds: z.array(z.string().trim().min(1)).min(1, "Selecione ao menos um trecho canônico"),
  title: z.string().trim().min(3, "Título deve ter pelo menos 3 caracteres"),
  code: z.string().trim().min(1, "Código é obrigatório"),
  objective: z.string().trim().optional().or(z.literal("")),
});

function previewText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 1200);
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function buildCanonicalDraftContent({
  title,
  code,
  objective,
  chunks,
}: {
  title: string;
  code: string;
  objective?: string;
  chunks: Array<{
    chunkIndex: number;
    heading: string | null;
    text: string;
    semanticRole: string;
    tokenEstimate: number;
    canonicalDocument: { title: string; code: string | null; version: string | null };
  }>;
}) {
  const sourceSummary = chunks
    .map((chunk, index) => {
      const documentLabel = `${chunk.canonicalDocument.code ? `${chunk.canonicalDocument.code} - ` : ""}${chunk.canonicalDocument.title}`;
      const versionLabel = chunk.canonicalDocument.version ? ` v${chunk.canonicalDocument.version}` : "";
      return `${index + 1}. ${documentLabel}${versionLabel} · chunk ${chunk.chunkIndex + 1} · ${chunk.semanticRole}`;
    })
    .join("\n");

  const selectedExcerpts = chunks
    .map((chunk, index) => {
      const heading = chunk.heading ? ` - ${chunk.heading}` : "";
      return [
        `### Fonte ${index + 1}: ${chunk.canonicalDocument.title}${heading}`,
        `Documento: ${chunk.canonicalDocument.code || chunk.canonicalDocument.title}`,
        `Chunk: ${chunk.chunkIndex + 1}`,
        `Tokens estimados: ${chunk.tokenEstimate}`,
        "",
        previewText(chunk.text),
      ].join("\n");
    })
    .join("\n\n");

  return [
    `# ${title}`,
    "",
    `Código proposto: ${code}`,
    "",
    "Status: minuta auxiliar para revisão do RT.",
    "",
    "## Objetivo",
    objective || "Descrever o objetivo operacional do procedimento a partir das fontes canônicas selecionadas.",
    "",
    "## Fontes canônicas selecionadas",
    sourceSummary,
    "",
    "## Trechos selecionados",
    selectedExcerpts,
    "",
    "## Aviso regulatório",
    "Esta é uma minuta auxiliar para revisão do Responsável Técnico. Não representa POP vigente, validação oficial, conformidade sanitária automática ou aprovação institucional.",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) return forbidden();

    const body = await request.json().catch(() => null);
    const parsed = canonicalDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
    }

    const { tenantId, response } = requireTenantId(user);
    if (response) return response;

    const uniqueChunkIds = Array.from(new Set(parsed.data.chunkIds));

    const existingPop = await prisma.pop.findFirst({
      where: { codigo: parsed.data.code },
      select: { id: true },
    });

    if (existingPop) {
      return NextResponse.json({ error: "Já existe POP com este código neste tenant" }, { status: 409 });
    }

    const retrievalLog = parsed.data.retrievalLogId
      ? await prisma.ragRetrievalLog.findFirst({
          where: { id: parsed.data.retrievalLogId, tenantId: tenantId! },
          select: { id: true, queryPreview: true, resultCount: true },
        })
      : null;

    if (parsed.data.retrievalLogId && !retrievalLog) {
      return NextResponse.json({ error: "Registro de consulta canônica não encontrado" }, { status: 404 });
    }

    const chunks = await prisma.canonicalChunk.findMany({
      where: { id: { in: uniqueChunkIds }, tenantId: tenantId! },
      orderBy: [{ canonicalDocumentId: "asc" }, { chunkIndex: "asc" }],
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
            version: true,
          },
        },
      },
    });

    if (chunks.length !== uniqueChunkIds.length) {
      return NextResponse.json({ error: "Trechos canônicos não encontrados para este tenant" }, { status: 404 });
    }

    const content = buildCanonicalDraftContent({
      title: parsed.data.title,
      code: parsed.data.code,
      objective: parsed.data.objective,
      chunks,
    });

    const result = await prisma.$transaction(async (tx) => {
      const pop = await tx.pop.create({
        data: {
          codigo: parsed.data.code,
          titulo: parsed.data.title,
          status: "RASCUNHO",
          versao: "0.1",
          setor: "Documentação Operacional",
          dataRevisao: new Date(),
          responsavel: user.name || user.email || "Responsável Técnico a definir",
          objetivo: parsed.data.objective || "Minuta assistida gerada a partir de fontes canônicas selecionadas.",
          descricao: "Minuta assistida gerada a partir de fontes canônicas selecionadas para revisão do Responsável Técnico.",
          conteudo: content,
          tenantId: tenantId!,
        },
      });

      const draft = await tx.assistedPopDraft.create({
        data: {
          tenantId: tenantId!,
          popId: pop.id,
          title: parsed.data.title,
          code: parsed.data.code,
          status: "RASCUNHO",
          version: "0.1",
          objective: parsed.data.objective || null,
          content,
          notes: retrievalLog
            ? `Minuta criada a partir da consulta canônica ${retrievalLog.id}.`
            : "Minuta criada a partir de fontes canônicas selecionadas.",
          createdByUserId: user.id,
          createdByUserName: user.name || user.email || null,
          canonicalSources: {
            create: chunks.map((chunk) => ({
              tenantId: tenantId!,
              canonicalDocumentId: chunk.canonicalDocumentId,
              canonicalChunkId: chunk.id,
              ragRetrievalLogId: retrievalLog?.id || null,
              chunkIndex: chunk.chunkIndex,
              sourceTextPreview: previewText(chunk.text),
              sourceHash: chunk.sourceHash,
            })),
          },
        },
        include: { canonicalSources: true },
      });

      return { pop, draft };
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_DRAFT_GENERATED,
      entity: "AssistedPopDraft",
      entityId: result.draft.id,
      userId: user.id,
      userName: user.name || undefined,
      tenantId: tenantId!,
      details: {
        popId: result.pop.id,
        sourceType: "CANONICAL_CHUNK",
        canonicalChunkCount: chunks.length,
        canonicalDocumentIds: Array.from(new Set(chunks.map((chunk) => chunk.canonicalDocumentId))),
        retrievalLogId: retrievalLog?.id || null,
        status: result.draft.status,
      },
    });

    await createDocumentLifecycleEvent({
      tenantId: tenantId!,
      entityType: "AssistedPopDraft",
      entityId: result.draft.id,
      relatedEntityType: "Pop",
      relatedEntityId: result.pop.id,
      action: "GENERATED_FROM_CANONICAL_SOURCES",
      statusTo: "RASCUNHO",
      version: result.draft.version,
      userId: user.id,
      userName: user.name || undefined,
      metadata: {
        canonicalChunkIds: chunks.map((chunk) => chunk.id),
        canonicalDocumentIds: Array.from(new Set(chunks.map((chunk) => chunk.canonicalDocumentId))),
        retrievalLogId: retrievalLog?.id || null,
        sourceCount: chunks.length,
        reviewRequired: true,
      },
    });

    return NextResponse.json({ success: true, draft: result.draft, pop: result.pop }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Já existe POP com este código. Escolha outro código para a minuta." }, { status: 409 });
    }

    console.error("Error creating assisted POP draft from canonical sources:", error);
    return NextResponse.json({ error: "Erro ao gerar minuta a partir de fontes canônicas" }, { status: 500 });
  }
}
