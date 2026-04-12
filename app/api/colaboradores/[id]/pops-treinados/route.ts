import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "N\u00e3o autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    const colaborador = await prisma.colaborador.findFirst({
      where: {
        id: params.id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      },
    });

    if (!colaborador) {
      return NextResponse.json({ error: "Colaborador n\u00e3o encontrado" }, { status: 404 });
    }

    const treinamentos = await prisma.treinamento.findMany({
      where: {
        colaboradorId: params.id,
        status: "CONCLUIDO",
      },
      include: {
        pop: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            setor: true,
            versao: true,
            dataRevisao: true,
            status: true,
          },
        },
      },
      orderBy: { dataTreinamento: "desc" },
    });

    return NextResponse.json(treinamentos);
  } catch (error) {
    console.error("Erro ao buscar POPs treinados:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
