import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET: get quiz by id with all questions & alternatives
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const user = session.user as any;

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        pop: { select: { id: true, codigo: true, titulo: true, setor: true } },
        questoes: {
          orderBy: { ordem: "asc" },
          include: {
            alternativas: { orderBy: { ordem: "asc" } },
          },
        },
        _count: { select: { tentativas: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && quiz.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ quiz });
  } catch (error: any) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json({ error: "Erro ao buscar quiz" }, { status: 500 });
  }
}

// PATCH: update quiz (replace all questions)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const user = session.user as any;
    if (!["SUPER_ADMIN", "ADMIN_FARMACIA", "RT"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const quiz = await prisma.quiz.findUnique({ where: { id: params.id } });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 });
    }
    if (user.role !== "SUPER_ADMIN" && quiz.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const data = await request.json();
    const { titulo, descricao, notaMinima, ativo, questoes } = data;

    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (notaMinima !== undefined) updateData.notaMinima = notaMinima;
    if (ativo !== undefined) updateData.ativo = ativo;

    // If questoes provided, delete old and create new
    if (questoes && questoes.length > 0) {
      // Validate
      for (const q of questoes) {
        if (!q.pergunta || !q.alternativas || q.alternativas.length < 2) {
          return NextResponse.json({ error: "Cada questão deve ter pelo menos 2 alternativas" }, { status: 400 });
        }
        const hasCorrect = q.alternativas.some((a: any) => a.correta);
        if (!hasCorrect) {
          return NextResponse.json({ error: `Questão sem alternativa correta` }, { status: 400 });
        }
      }

      // Delete existing questions (cascade deletes alternativas)
      await prisma.questao.deleteMany({ where: { quizId: params.id } });

      // Create new questions
      for (let i = 0; i < questoes.length; i++) {
        const q = questoes[i];
        await prisma.questao.create({
          data: {
            quizId: params.id,
            pergunta: q.pergunta,
            ordem: i + 1,
            alternativas: {
              create: q.alternativas.map((a: any, aIdx: number) => ({
                texto: a.texto,
                correta: a.correta || false,
                ordem: aIdx + 1,
              })),
            },
          },
        });
      }
    }

    const updated = await prisma.quiz.update({
      where: { id: params.id },
      data: updateData,
      include: {
        questoes: {
          orderBy: { ordem: "asc" },
          include: { alternativas: { orderBy: { ordem: "asc" } } },
        },
        pop: { select: { codigo: true, titulo: true } },
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.QUIZ_UPDATED,
      entity: "Quiz",
      entityId: quiz.id,
      userId: user.id,
      userName: user.name,
      tenantId: quiz.tenantId,
      details: { changes: Object.keys(data) },
    });

    return NextResponse.json({ success: true, quiz: updated });
  } catch (error: any) {
    console.error("Error updating quiz:", error);
    return NextResponse.json({ error: "Erro ao atualizar quiz" }, { status: 500 });
  }
}

// DELETE: remove quiz
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const user = session.user as any;
    if (!["SUPER_ADMIN", "ADMIN_FARMACIA", "RT"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: { pop: { select: { codigo: true } } },
    });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 });
    }
    if (user.role !== "SUPER_ADMIN" && quiz.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.quiz.delete({ where: { id: params.id } });

    await createAuditLog({
      action: AUDIT_ACTIONS.QUIZ_DELETED,
      entity: "Quiz",
      entityId: params.id,
      userId: user.id,
      userName: user.name,
      tenantId: quiz.tenantId,
      details: { pop: quiz.pop?.codigo },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json({ error: "Erro ao excluir quiz" }, { status: 500 });
  }
}
