import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

// POST: submit quiz answers
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const user = session.user as any;

    const data = await request.json();
    const { treinamentoId, colaboradorId, respostas } = data;
    // respostas: [{ questaoId, alternativaId }]

    if (!treinamentoId || !colaboradorId || !respostas || respostas.length === 0) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Fetch quiz with correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questoes: {
          orderBy: { ordem: "asc" },
          include: {
            alternativas: true,
          },
        },
        pop: { select: { codigo: true, titulo: true } },
      },
    });

    if (!quiz || !quiz.ativo) {
      return NextResponse.json({ error: "Quiz não encontrado ou inativo" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && quiz.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Verify treinamento exists and belongs to user
    const treinamento = await prisma.treinamento.findUnique({
      where: { id: treinamentoId },
    });
    if (!treinamento || treinamento.colaboradorId !== colaboradorId) {
      return NextResponse.json({ error: "Treinamento não encontrado" }, { status: 404 });
    }

    // Calculate score
    const totalQuestoes = quiz.questoes.length;
    let acertos = 0;
    const respostasProcessadas: { questaoId: string; alternativaId: string; correta: boolean }[] = [];

    for (const resp of respostas) {
      const questao = quiz.questoes.find((q) => q.id === resp.questaoId);
      if (!questao) continue;

      const alternativa = questao.alternativas.find((a) => a.id === resp.alternativaId);
      if (!alternativa) continue;

      const isCorrect = alternativa.correta;
      if (isCorrect) acertos++;

      respostasProcessadas.push({
        questaoId: resp.questaoId,
        alternativaId: resp.alternativaId,
        correta: isCorrect,
      });
    }

    const nota = totalQuestoes > 0 ? (acertos / totalQuestoes) * 100 : 0;
    const aprovado = nota >= quiz.notaMinima;

    // Generate validation code if approved
    const codigoValidacao = aprovado
      ? `VISA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      : null;

    // Create attempt record
    const tentativa = await prisma.tentativaQuiz.create({
      data: {
        quizId: params.id,
        colaboradorId,
        treinamentoId,
        nota,
        aprovado,
        totalQuestoes,
        acertos,
        codigoValidacao,
        respostas: {
          create: respostasProcessadas.map((r) => ({
            questaoId: r.questaoId,
            alternativaId: r.alternativaId,
            correta: r.correta,
          })),
        },
      },
      include: {
        respostas: true,
      },
    });

    // If approved, update treinamento
    if (aprovado) {
      await prisma.treinamento.update({
        where: { id: treinamentoId },
        data: {
          status: "CONCLUIDO",
          notaQuiz: nota,
          aprovadoQuiz: true,
        },
      });
    } else {
      // Update nota but keep PENDENTE / EM_AVALIACAO
      await prisma.treinamento.update({
        where: { id: treinamentoId },
        data: {
          notaQuiz: nota,
          aprovadoQuiz: false,
          status: "EM_AVALIACAO",
        },
      });
    }

    await createAuditLog({
      action: AUDIT_ACTIONS.QUIZ_ATTEMPTED,
      entity: "TentativaQuiz",
      entityId: tentativa.id,
      userId: user.id,
      userName: user.name,
      tenantId: quiz.tenantId,
      details: {
        pop: quiz.pop?.codigo,
        nota: Math.round(nota * 10) / 10,
        aprovado,
        acertos,
        totalQuestoes,
      },
    });

    return NextResponse.json({
      success: true,
      resultado: {
        tentativaId: tentativa.id,
        nota: Math.round(nota * 10) / 10,
        aprovado,
        acertos,
        totalQuestoes,
        notaMinima: quiz.notaMinima,
        codigoValidacao: tentativa.codigoValidacao,
        respostas: respostasProcessadas,
      },
    });
  } catch (error: any) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json({ error: "Erro ao enviar respostas" }, { status: 500 });
  }
}
