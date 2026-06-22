import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/auth-guards";
import { generateLibraryEditableDocx, generateLibraryFinalPdf } from "@/lib/document-library-print";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const tipo = body.tipo === "editavel" ? "editavel" : "final";
  if (user.role === "OPERADOR" && tipo === "editavel") {
    return NextResponse.json({ error: "Operador só pode imprimir a versão final" }, { status: 403 });
  }

  const item = await prisma.documentaryLibraryItem.findFirst({
    where: {
      id,
      ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }),
    },
    include: { tenant: { select: { nome: true } } },
  });

  if (!item) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  if (!["ACTIVE", "VIGENTE"].includes(item.status)) {
    return NextResponse.json({ error: "Apenas documentos vigentes podem ser impressos" }, { status: 400 });
  }

  await prisma.documentoImpressaoLog.create({
    data: {
      documentoId: item.id,
      usuarioId: user.id,
      usuarioNome: user.name || user.email || null,
      tipo,
      tenantId: item.tenantId,
    },
  });

  const baseName = `${item.code ? `${item.code} - ` : ""}${item.title}`.replace(/[^a-zA-Z0-9\u00C0-\u024F .\-_()]/g, "_");
  const buffer = tipo === "editavel"
    ? await generateLibraryEditableDocx(item)
    : generateLibraryFinalPdf(item);
  const extension = tipo === "editavel" ? "docx" : "pdf";
  const contentType = tipo === "editavel"
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "application/pdf";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${baseName}.${extension}"`,
      "X-Visadocs-Download-Url": `/api/biblioteca/${item.id}/imprimir`,
    },
  });
}
