import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET: list quizzes for tenant, optionally filter by popId
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const user = session.user as any;
    if (!user.tenantId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const popId = searchParams.get("popId");
    const tenantId = user.role === "SUPER_ADMIN" ? (searchParams.get("tenantId") || user.tenantId) : user.tenantId;

    const where: any = { tenantId };
    if (popId) where.popId = popId;

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        pop: { select: { id: true, codigo: true, titulo: true } },
        questoes: {
          orderBy: { ordem: "asc" },
          include: {
            alternativas: { orderBy: { ordem: "asc" } },
          },
        },
        _count: { select: { tentativas: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quizzes });
  } catch (error: any) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({ error: "Erro ao buscar quizzes" }, { status: 500 });
  }
}

// POST: create a new quiz with questions and alternatives
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const user = session.user as any;
    if (!["SUPER_ADMIN", "ADMIN_FARMACIA", "RT"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const data = await request.json();
    const { popId, titulo, descricao, notaMinima, questoes } = data;

    if (!popId || !titulo || !questoes || questoes.length === 0) {
      return NextResponse.json({ error: "POP, título e pelo menos uma questão são obrigatórios" }, { status: 400 });
    }

    const tenantId = user.tenantId;

    // Check POP exists and belongs to tenant
    const pop = await prisma.pop.findFirst({ where: { id: popId, tenantId } });
    if (!pop) {
      return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });
    }

    // Check if quiz already exists for this POP
    const existing = await prisma.quiz.findUnique({ where: { popId } });
    if (existing) {
      return NextResponse.json({ error: "Este POP já possui um quiz. Edite o existente." }, { status: 409 });
    }

    // Validate questions
    for (const q of questoes) {
      if (!q.pergunta || !q.alternativas || q.alternativas.length < 2) {
        return NextResponse.json({ error: "Cada questão deve ter uma pergunta e pelo menos 2 alternativas" }, { status: 400 });
      }
      const hasCorrect = q.alternativas.some((a: any) => a.correta);
      if (!hasCorrect) {
        return NextResponse.json({ error: `A questão "${q.pergunta.substring(0, 50)}..." não tem alternativa correta marcada` }, { status: 400 });
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        popId,
        titulo,
        descricao: descricao || null,
        notaMinima: notaMinima || 70,
        tenantId,
        questoes: {
          create: questoes.map((q: any, idx: number) => ({
            pergunta: q.pergunta,
            ordem: idx + 1,
            alternativas: {
              create: q.alternativas.map((a: any, aIdx: number) => ({
                texto: a.texto,
                correta: a.correta || false,
                ordem: aIdx + 1,
              })),
            },
          })),
        },
      },
      include: {
        questoes: {
          orderBy: { ordem: "asc" },
          include: { alternativas: { orderBy: { ordem: "asc" } } },
        },
        pop: { select: { codigo: true, titulo: true } },
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.QUIZ_CREATED,
      entity: "Quiz",
      entityId: quiz.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { pop: pop.codigo, questoes: questoes.length },
    });

    return NextResponse.json({ success: true, quiz });
  } catch (error: any) {
    console.error("Error creating quiz:", error);
    return NextResponse.json({ error: "Erro ao criar quiz" }, { status: 500 });
  }
}
