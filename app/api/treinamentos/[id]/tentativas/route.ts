import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "N\u00e3o autorizado" }, { status: 401 });
    }
    const user = session.user as any;

    const treinamento = await prisma.treinamento.findUnique({
      where: { id: params.id },
      select: { tenantId: true },
    });

    if (!treinamento) {
      return NextResponse.json({ error: "Treinamento n\u00e3o encontrado" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && treinamento.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const tentativas = await prisma.tentativaQuiz.findMany({
      where: { treinamentoId: params.id },
      orderBy: { completadoEm: "desc" },
      select: {
        id: true,
        nota: true,
        aprovado: true,
        acertos: true,
        totalQuestoes: true,
        codigoValidacao: true,
        completadoEm: true,
      },
    });

    return NextResponse.json({ tentativas });
  } catch (error: any) {
    console.error("Error fetching tentativas:", error);
    return NextResponse.json({ error: "Erro ao buscar tentativas" }, { status: 500 });
  }
}
