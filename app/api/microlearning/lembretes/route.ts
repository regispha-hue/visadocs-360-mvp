/**
 * API Micro-learning - Lembretes de Treinamento
 * GET /api/microlearning/lembretes - Buscar lembretes pendentes
 * POST /api/microlearning/lembretes - Criar lembrete
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export const dynamic = "force-dynamic";

// GET - Buscar lembretes do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { prisma } = require("@/lib/prisma");
    const user = session.user as any;
    const tenantId = user.tenantId;
    const userId = user.id;

    // Buscar treinamentos pendentes
    const treinamentosPendentes = await prisma.treinamento.findMany({
      where: {
        tenantId,
        colaborador: {
          tenantId,
        },
        status: "PENDENTE",
      },
      include: {
        colaborador: true,
        pop: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            setor: true,
          },
        },
      },
      orderBy: { dataTreinamento: "asc" },
      take: 10,
    });

    // Buscar certificados expirando
    const certificadosExpirando = await prisma.treinamento.findMany({
      where: {
        tenantId,
        status: "CONCLUIDO",
        dataTreinamento: {
          lte: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000), // +10 meses
        },
      },
      include: {
        colaborador: true,
        pop: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
          },
        },
      },
      take: 5,
    });

    // Formatar lembretes
    const lembretes = [
      ...treinamentosPendentes.map((t: any) => ({
        id: `treinamento-${t.id}`,
        tipo: "TREINAMENTO_PENDENTE",
        prioridade: "ALTA",
        titulo: `Treinamento pendente: ${t.pop?.titulo}`,
        mensagem: `${t.colaborador?.nome} precisa completar o treinamento ${t.pop?.codigo}`,
        dataLimite: t.dataTreinamento,
        acao: `/dashboard/treinamentos`,
        popId: t.pop?.id,
      })),
      ...certificadosExpirando.map((t: any) => ({
        id: `certificado-${t.id}`,
        tipo: "CERTIFICADO_EXPIRANDO",
        prioridade: "MEDIA",
        titulo: `Certificado expirando: ${t.pop?.titulo}`,
        mensagem: `O certificado de ${t.colaborador?.nome} expira em breve`,
        dataLimite: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 dias
        acao: `/dashboard/colaboradores/${t.colaborador?.id}`,
        popId: t.pop?.id,
      })),
    ];

    return NextResponse.json({ lembretes });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
