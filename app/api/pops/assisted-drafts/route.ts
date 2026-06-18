import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, createAuditLog, createDocumentLifecycleEvent } from "@/lib/audit";
import { assistedPopDraftSchema } from "@/lib/validations";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

const MIN_USEFUL_SOURCE_CHARS = 300;
const INSUFFICIENT_SOURCE_CONTENT_ERROR =
  "Selecione ao menos uma fonte documental com conteúdo técnico suficiente para gerar a minuta.";

const PLACEHOLDER_PATTERNS = [
  /\bcomplete a minuta\b/gi,
  /\bsem conte[uú]do\b/gi,
  /\bplaceholder\b/gi,
  /\blorem ipsum\b/gi,
  /\bteste\b/gi,
];

function normalizeUsefulSourceText(content: string | null | undefined, title: string) {
  const normalized = (content || "")
    .replace(/\s+/g, " ")
    .trim();
  const normalizedTitle = title.replace(/\s+/g, " ").trim();
  const withoutTitleOnly = normalized.toLowerCase() === normalizedTitle.toLowerCase() ? "" : normalized;

  return PLACEHOLDER_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, " "),
    withoutTitleOnly,
  )
    .replace(/\s+/g, " ")
    .trim();
}

function hasUsefulSourceContent(source: { title: string; content: string | null }) {
  const usefulText = normalizeUsefulSourceText(source.content, source.title);
  return usefulText.length >= MIN_USEFUL_SOURCE_CHARS;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function buildAuxiliaryDraft(title: string, objective: string | undefined, sources: Array<{ title: string; content: string | null; version: string | null }>) {
  const sourceSummary = sources
    .map((source, index) => `${index + 1}. ${source.title}${source.version ? ` v${source.version}` : ""}`)
    .join("\n");

  const sourceContent = sources
    .map((source) => source.content)
    .map((content) => content?.trim())
    .filter((content): content is string => Boolean(content))
    .join("\n\n")
    .slice(0, 12000);

  return [
    `# ${title}`,
    "",
    "Status: minuta assistida para revisão do Responsável Técnico.",
    "",
    "## Objetivo",
    objective || "Descrever o objetivo operacional do procedimento a partir do acervo selecionado.",
    "",
    "## Fontes utilizadas",
    sourceSummary,
    "",
    "## Minuta auxiliar",
    sourceContent,
    "",
    "## Aviso regulatório",
    "Este artefato é uma minuta auxiliar e não representa conformidade sanitária automática, validação oficial ou aprovação institucional.",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) return forbidden();

    const body = await request.json();
    const parsed = assistedPopDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
    }

    const { tenantId, response } = requireTenantId(user, body.tenantId);
    if (response) return response;

    const existingPop = await prisma.pop.findFirst({
      where: { codigo: parsed.data.code },
      select: { id: true },
    });

    if (existingPop) {
      return NextResponse.json({ error: "Já existe POP com este código. Escolha outro código para a minuta." }, { status: 409 });
    }

    const sources = await prisma.documentaryLibraryItem.findMany({
      where: {
        id: { in: parsed.data.sourceIds },
        tenantId: tenantId!,
        status: "ACTIVE",
      },
      select: { id: true, title: true, version: true, content: true },
    });

    if (sources.length !== parsed.data.sourceIds.length) {
      return NextResponse.json({ error: "Fontes insuficientes ou inválidas para geração assistida" }, { status: 422 });
    }

    const usefulSources = sources.filter(hasUsefulSourceContent);

    if (usefulSources.length === 0) {
      return NextResponse.json({ error: INSUFFICIENT_SOURCE_CONTENT_ERROR }, { status: 422 });
    }

    const content = buildAuxiliaryDraft(parsed.data.title, parsed.data.objective, usefulSources);

    const result = await prisma.$transaction(async (tx) => {
      const pop = await tx.pop.create({
        data: {
          codigo: parsed.data.code,
          titulo: parsed.data.title,
          status: "RASCUNHO",
          versao: "0.1",
          objetivo: parsed.data.objective || null,
          descricao: "Minuta assistida gerada a partir da biblioteca documental para revisão do Responsável Técnico.",
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
          notes: parsed.data.notes || null,
          createdByUserId: user.id,
          createdByUserName: user.name || user.email || null,
          sources: {
            create: usefulSources.map((source) => ({
              tenantId: tenantId!,
              libraryItemId: source.id,
              sourceTitle: source.title,
              sourceVersion: source.version,
            })),
          },
        },
        include: { sources: true },
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
      details: { popId: result.pop.id, sourceCount: usefulSources.length, selectedSourceCount: sources.length, status: result.draft.status },
    });

    await createDocumentLifecycleEvent({
      tenantId: tenantId!,
      entityType: "AssistedPopDraft",
      entityId: result.draft.id,
      relatedEntityType: "Pop",
      relatedEntityId: result.pop.id,
      action: "GENERATED",
      statusTo: "RASCUNHO",
      version: result.draft.version,
      userId: user.id,
      userName: user.name || undefined,
      metadata: {
        sourceIds: usefulSources.map((source) => source.id),
        libraryItemTitles: usefulSources.map((source) => source.title),
        selectedSourceCount: sources.length,
        usefulSourceCount: usefulSources.length,
        minUsefulSourceChars: MIN_USEFUL_SOURCE_CHARS,
      },
    });

    return NextResponse.json({ success: true, draft: result.draft, pop: result.pop });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Já existe POP com este código. Escolha outro código para a minuta." }, { status: 409 });
    }

    console.error("Error creating assisted POP draft:", error);
    return NextResponse.json({ error: "Erro ao gerar minuta assistida" }, { status: 500 });
  }
}
