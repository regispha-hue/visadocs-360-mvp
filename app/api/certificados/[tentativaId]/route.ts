import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateCertificadoHtml } from "@/lib/certificado-template";

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

    const htmlContent = generateCertificadoHtml({
      colaboradorNome: tentativa.colaborador.nome,
      colaboradorFuncao: tentativa.colaborador.funcao,
      popCodigo: tentativa.quiz.pop.codigo,
      popTitulo: tentativa.quiz.pop.titulo,
      popSetor: tentativa.quiz.pop.setor,
      nota: tentativa.nota,
      acertos: tentativa.acertos,
      totalQuestoes: tentativa.totalQuestoes,
      completadoEm: tentativa.completadoEm,
      codigoValidacao: tentativa.codigoValidacao || tentativa.id.substring(0, 12).toUpperCase(),
      tenantNome: tentativa.treinamento.tenant.nome,
      tenantCnpj: tentativa.treinamento.tenant.cnpj,
      responsavelTecnico: tentativa.treinamento.tenant.responsavel,
    });

    // Step 1: Create PDF generation request
    const createResponse = await fetch("https://apps.abacus.ai/api/createConvertHtmlToPdfRequest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: htmlContent,
        pdf_options: {
          format: "A4",
          landscape: true,
          print_background: true,
          margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
        },
        base_url: process.env.NEXTAUTH_URL || "",
      }),
    });

    if (!createResponse.ok) {
      console.error("PDF create request failed:", await createResponse.text());
      return NextResponse.json({ error: "Erro ao gerar certificado" }, { status: 500 });
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json({ error: "Erro ao iniciar gera\u00e7\u00e3o do PDF" }, { status: 500 });
    }

    // Step 2: Poll for status
    const maxAttempts = 120;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch("https://apps.abacus.ai/api/getConvertHtmlToPdfStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || "FAILED";
      const result = statusResult?.result || null;

      if (status === "SUCCESS") {
        if (result && result.result) {
          const pdfBuffer = Buffer.from(result.result, "base64");
          const filename = `Certificado_${tentativa.quiz.pop.codigo}_${tentativa.colaborador.nome.replace(/\s+/g, "_")}.pdf`;
          return new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${filename}"`,
            },
          });
        }
        return NextResponse.json({ error: "PDF gerado mas sem dados" }, { status: 500 });
      } else if (status === "FAILED") {
        console.error("PDF generation failed:", result?.error);
        return NextResponse.json({ error: "Falha na gera\u00e7\u00e3o do certificado" }, { status: 500 });
      }

      attempts++;
    }

    return NextResponse.json({ error: "Tempo esgotado na gera\u00e7\u00e3o do certificado" }, { status: 500 });
  } catch (error: any) {
    console.error("Error generating certificate:", error);
    return NextResponse.json({ error: "Erro ao gerar certificado" }, { status: 500 });
  }
}
