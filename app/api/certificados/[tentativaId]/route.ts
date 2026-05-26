import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCertificadoPdfBuffer } from "@/lib/certificado-pdf";
import { AUDIT_ACTIONS, createDocumentLifecycleEvent } from "@/lib/audit";
import { getCurrentUser, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tentativaId: string }> }
) {
  const { tentativaId } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    // Fetch tentativa with all related data
    const tentativa = await prisma.tentativaQuiz.findUnique({
      where: { id: tentativaId },
      include: {
        quiz: {
          include: {
            pop: { select: { codigo: true, titulo: true, setor: true } },
          },
        },
        colaborador: { select: { nome: true, funcao: true } },
        treinamento: {
          include: {
            tenant: { select: { nome: true, cnpj: true, responsavel: true } },
            approvedPopVersion: true,
          },
        },
      },
    });

    if (!tentativa) {
      return NextResponse.json({ error: "Tentativa n\u00e3o encontrada" }, { status: 404 });
    }

    if (!tentativa.aprovado) {
      return NextResponse.json({ error: "Registro interno dispon\u00edvel apenas para tentativas aprovadas" }, { status: 400 });
    }

    // Check tenant access
    if (user.role !== "SUPER_ADMIN" && tentativa.treinamento.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const pdfBuffer = generateCertificadoPdfBuffer({
      colaboradorNome: tentativa.colaborador.nome,
      // @ts-ignore
      colaboradorFuncao: tentativa.colaborador.funcao,
      popCodigo: tentativa.quiz.pop.codigo,
      popTitulo: tentativa.quiz.pop.titulo,
      popVersao: tentativa.treinamento.approvedPopVersion?.version || tentativa.treinamento.popVersaoSnapshot || undefined,
      // @ts-ignore
      popSetor: tentativa.quiz.pop.setor,
      // @ts-ignore
      nota: tentativa.nota,
      // @ts-ignore
      acertos: tentativa.acertos,
      // @ts-ignore
      totalQuestoes: tentativa.totalQuestoes,
      // @ts-ignore
      completadoEm: tentativa.completadoEm,
      // @ts-ignore
      codigoValidacao: tentativa.codigoValidacao || tentativa.id.substring(0, 12).toUpperCase(),
      tenantNome: tentativa.treinamento.tenant.nome,
      // @ts-ignore
      tenantCnpj: tentativa.treinamento.tenant.cnpj,
      // @ts-ignore
      responsavelTecnico: tentativa.treinamento.tenant.responsavel,
    });

    await createDocumentLifecycleEvent({
      tenantId: tentativa.treinamento.tenantId,
      entityType: "Treinamento",
      entityId: tentativa.treinamentoId,
      relatedEntityType: "TentativaQuiz",
      relatedEntityId: tentativa.id,
      action: AUDIT_ACTIONS.EVIDENCE_CREATED,
      statusTo: tentativa.treinamento.status,
      version: tentativa.treinamento.approvedPopVersion?.version || tentativa.treinamento.popVersaoSnapshot || undefined,
      userId: user.id,
      userName: user.name || undefined,
      metadata: {
        colaborador: tentativa.colaborador.nome,
        popCodigo: tentativa.quiz.pop.codigo,
        approvedPopVersionId: tentativa.treinamento.approvedPopVersionId,
      },
    });
    const filename = `Registro_interno_${tentativa.quiz.pop.codigo}_${tentativa.colaborador.nome.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating internal training evidence:", error);
    return NextResponse.json({ error: "Erro ao gerar registro interno" }, { status: 500 });
  }
}
