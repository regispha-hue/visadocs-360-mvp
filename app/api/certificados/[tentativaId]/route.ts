import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateCertificadoPdfBuffer } from "@/lib/certificado-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { tentativaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "N\u00e3o autorizado" }, { status: 401 });
    }
    const user = session.user as any;

    // Fetch tentativa with all related data
    const tentativa = await prisma.tentativaQuiz.findUnique({
      where: { id: params.tentativaId },
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
          },
        },
      },
    });

    if (!tentativa) {
      return NextResponse.json({ error: "Tentativa n\u00e3o encontrada" }, { status: 404 });
    }

    if (!tentativa.aprovado) {
      return NextResponse.json({ error: "Certificado dispon\u00edvel apenas para tentativas aprovadas" }, { status: 400 });
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
    const filename = `Certificado_${tentativa.quiz.pop.codigo}_${tentativa.colaborador.nome.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating certificate:", error);
    return NextResponse.json({ error: "Erro ao gerar certificado" }, { status: 500 });
  }
}
