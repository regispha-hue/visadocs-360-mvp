import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCertificadoPdfBuffer } from "@/lib/certificado-pdf";
import { AUDIT_ACTIONS, createDocumentLifecycleEvent } from "@/lib/audit";
import { getCurrentUser, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const tentativa = await prisma.tentativaQuiz.findUnique({
      where: { id },
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
      return NextResponse.json({ error: "Tentativa nao encontrada" }, { status: 404 });
    }

    if (!tentativa.aprovado) {
      return NextResponse.json(
        { error: "Registro interno disponivel apenas para tentativas aprovadas" },
        { status: 400 }
      );
    }

    if (user.role !== "SUPER_ADMIN" && tentativa.treinamento.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const pdfBuffer = generateCertificadoPdfBuffer({
      colaboradorNome: tentativa.colaborador.nome,
      colaboradorFuncao: tentativa.colaborador.funcao,
      popCodigo: tentativa.quiz.pop.codigo,
      popTitulo: tentativa.quiz.pop.titulo,
      popVersao:
        tentativa.treinamento.approvedPopVersion?.version ||
        tentativa.treinamento.popVersaoSnapshot ||
        undefined,
      popSetor: tentativa.quiz.pop.setor,
      nota: tentativa.nota,
      acertos: tentativa.acertos,
      totalQuestoes: tentativa.totalQuestoes,
      completadoEm: tentativa.completadoEm,
      codigoValidacao: tentativa.codigoValidacao || tentativa.id.substring(0, 12).toUpperCase(),
      tenantNome: tentativa.treinamento.tenant.nome,
      tenantCnpj: tentativa.treinamento.tenant.cnpj,
      responsavelTecnico: tentativa.treinamento.tenant.responsavel,
    } as any);

    await createDocumentLifecycleEvent({
      tenantId: tentativa.treinamento.tenantId,
      entityType: "Treinamento",
      entityId: tentativa.treinamentoId,
      relatedEntityType: "TentativaQuiz",
      relatedEntityId: tentativa.id,
      action: AUDIT_ACTIONS.EVIDENCE_CREATED,
      statusTo: tentativa.treinamento.status,
      version:
        tentativa.treinamento.approvedPopVersion?.version ||
        tentativa.treinamento.popVersaoSnapshot ||
        undefined,
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