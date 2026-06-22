import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCertificadoPdfBuffer } from "@/lib/certificado-pdf";
import { getCurrentUser, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const certificado = await prisma.certificado.findFirst({
    where: {
      id,
      ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }),
    },
    include: {
      tentativa: true,
    },
  });

  if (!certificado) return NextResponse.json({ error: "Certificado não encontrado" }, { status: 404 });

  const treinamento = await prisma.treinamento.findFirst({
    where: { id: certificado.treinamentoId, tenantId: certificado.tenantId },
    include: {
      tenant: { select: { nome: true, cnpj: true, responsavel: true } },
      pop: { select: { codigo: true, titulo: true, setor: true, versao: true } },
      colaborador: { select: { nome: true, funcao: true } },
      approvedPopVersion: true,
    },
  });

  if (!treinamento) return NextResponse.json({ error: "Treinamento não encontrado" }, { status: 404 });

  const pdfBuffer = generateCertificadoPdfBuffer({
    colaboradorNome: treinamento.colaborador.nome,
    colaboradorFuncao: treinamento.colaborador.funcao || "",
    popCodigo: treinamento.pop.codigo,
    popTitulo: treinamento.pop.titulo,
    popSetor: treinamento.pop.setor || "",
    popVersao: treinamento.approvedPopVersion?.version || treinamento.popVersaoSnapshot || treinamento.pop.versao,
    nota: certificado.tentativa?.nota ?? treinamento.notaQuiz ?? 100,
    acertos: certificado.tentativa?.acertos ?? undefined,
    totalQuestoes: certificado.tentativa?.totalQuestoes ?? 0,
    completadoEm: certificado.dataEmissao,
    codigoValidacao: certificado.codigoValidacao || certificado.id.slice(0, 12).toUpperCase(),
    tenantNome: treinamento.tenant.nome,
    tenantCnpj: treinamento.tenant.cnpj || "",
    responsavelTecnico: treinamento.tenant.responsavel || "Responsável Técnico",
  } as any);

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Certificado_${treinamento.pop.codigo}_${treinamento.colaborador.nome.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
