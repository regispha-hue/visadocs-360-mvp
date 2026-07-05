import { NextResponse } from "next/server";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type AuditItem = {
  id: string;
  title: string;
  code: string | null;
  category: string | null;
  content: string | null;
};

const REQUIRED_SECTIONS = [
  { label: "Código POP", test: (item: AuditItem, text: string) => Boolean(item.code || /\bpop\.?\s*\d+/i.test(text)) },
  { label: "Objetivos", test: (_item: AuditItem, text: string) => /\bobjetivos?\b/i.test(text) },
  {
    label: "Setor e equipe técnica envolvida",
    test: (_item: AuditItem, text: string) => /\bsetor\b/i.test(text) && /\bequipe tecnica envolvida\b/i.test(text),
  },
  { label: "Glossário", test: (_item: AuditItem, text: string) => /\bglossario\b/i.test(text) },
  { label: "Literatura consultada", test: (_item: AuditItem, text: string) => /\bliteratura consultada\b/i.test(text) },
];

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isPopLibraryItem(item: Pick<AuditItem, "category">) {
  const category = normalizeText(item.category);
  return (
    category.includes("biblioteca de pops") ||
    category.includes("pop drogarias") ||
    category.includes("pop lgpd") ||
    category.includes("pops para farmacias de manipulacao") ||
    category.includes("gerados sob demanda")
  );
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "RT", "OPERADOR"].includes(user.role)) return forbidden();

    const { searchParams } = new URL(request.url);
    const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
    if (response) return response;

    const items = await prisma.documentaryLibraryItem.findMany({
      where: {
        tenantId: tenantId!,
        status: "ACTIVE",
        type: "POP",
      },
      orderBy: [{ category: "asc" }, { code: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        code: true,
        category: true,
        content: true,
      },
    });

    const popItems = items.filter(isPopLibraryItem);
    const results = popItems.map((item) => {
      const text = normalizeText(item.content);
      const missing =
        text.length < 120
          ? ["Conteúdo textual para conferência"]
          : REQUIRED_SECTIONS.filter((section) => !section.test(item, text)).map((section) => section.label);

      return {
        id: item.id,
        title: item.title,
        code: item.code,
        category: item.category,
        missing,
        compliant: missing.length === 0,
        unchecked: missing.includes("Conteúdo textual para conferência"),
      };
    });

    const compliant = results.filter((result) => result.compliant).length;
    const unchecked = results.filter((result) => result.unchecked).length;
    const attention = results.length - compliant;

    return NextResponse.json({
      summary: {
        total: results.length,
        compliant,
        attention,
        unchecked,
        requiredSections: REQUIRED_SECTIONS.map((section) => section.label),
        samples: results
          .filter((result) => !result.compliant)
          .slice(0, 12)
          .map(({ id, title, code, category, missing }) => ({ id, title, code, category, missing })),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error auditing POP document format:", error);
    return NextResponse.json({ error: "Erro ao conferir padrão documental dos POPs" }, { status: 500 });
  }
}
