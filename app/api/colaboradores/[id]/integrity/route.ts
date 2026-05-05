/**
 * API Verificação de Integridade SHA-256 Chain
 * GET /api/colaboradores/[id]/integrity
 * Verifica a integridade de todos os treinamentos do colaborador
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { verifyChainIntegrity, formatHashShort } from "@/lib/hash-chain";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Super Admin pode verificar qualquer colaborador
    // Usuários normais só do mesmo tenant
    if (!user.role === "SUPER_ADMIN" && !tenantId) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Buscar colaborador para verificar acesso
    const colaborador = await prisma.colaborador.findFirst({
      where: {
        id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId } : {}),
      },
      select: {
        id: true,
        nome: true,
        tenantId: true,
      },
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: "Colaborador não encontrado" },
        { status: 404 }
      );
    }

    // Buscar todos os treinamentos do colaborador
    const treinamentos = await prisma.treinamento.findMany({
      where: { colaboradorId: id },
      include: { pop: true },
      orderBy: { dataTreinamento: "asc" },
    });

    // Formatar para verificação
    const formattedTreinamentos = treinamentos.map((t) => ({
      id: t.id,
      popId: t.popId,
      colaboradorId: t.colaboradorId,
      dataTreinamento: new Date(t.dataTreinamento),
      status: t.status,
      notaQuiz: t.notaQuiz,
      aprovadoQuiz: t.aprovadoQuiz,
      tenantId: t.tenantId,
      hashAtual: t.hashAtual,
      hashAnterior: t.hashAnterior,
      pop: t.pop,
    }));

    // Verificar integridade da chain
    const integrityResult = verifyChainIntegrity(formattedTreinamentos);

    // Preparar resposta detalhada
    const response = {
      colaborador: {
        id: colaborador.id,
        nome: colaborador.nome,
      },
      integrity: {
        valid: integrityResult.valid,
        totalVerified: integrityResult.totalVerified,
        totalTreinamentos: treinamentos.length,
        genesisHash: integrityResult.genesisHash,
        brokenAtIndex: integrityResult.brokenAtIndex,
        brokenId: integrityResult.brokenId,
      },
      chain: treinamentos.map((t, index) => ({
        index,
        id: t.id,
        popCodigo: t.pop?.codigo,
        popTitulo: t.pop?.titulo,
        data: t.dataTreinamento,
        status: t.status,
        hashAtual: t.hashAtual ? formatHashShort(t.hashAtual) : null,
        hashAnterior: t.hashAnterior ? formatHashShort(t.hashAnterior) : null,
        hasHash: !!t.hashAtual,
      })),
      message: integrityResult.valid
        ? `Todos os ${integrityResult.totalVerified} treinamentos verificados. Integridade confirmada.`
        : `ALERTA: Quebra de integridade detectada no treinamento #${integrityResult.brokenAtIndex} (ID: ${integrityResult.brokenId})`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro na verificação de integridade:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
