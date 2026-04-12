import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET quiz by POP ID
export async function GET(
  request: Request,
  { params }: { params: { popId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const user = session.user as any;

    const quiz = await prisma.quiz.findUnique({
      where: { popId: params.popId },
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
      return NextResponse.json({ quiz: null });
    }

    if (user.role !== "SUPER_ADMIN" && quiz.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ quiz });
  } catch (error: any) {
    console.error("Error fetching quiz by pop:", error);
    return NextResponse.json({ error: "Erro ao buscar quiz" }, { status: 500 });
  }
}
