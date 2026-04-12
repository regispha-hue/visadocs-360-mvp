import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
    }

    const tenantId = user.tenantId;

    // Get all active collaborators, pops, and trainings in parallel
    const [colaboradores, pops, treinamentos, tentativas] = await Promise.all([
      prisma.colaborador.findMany({
        where: { tenantId, status: "ATIVO" },
        select: { id: true, nome: true, funcao: true },
      }),
      prisma.pop.findMany({
        where: { tenantId, status: "ATIVO" },
        select: { id: true, codigo: true, titulo: true, setor: true },
      }),
      prisma.treinamento.findMany({
        where: { tenantId },
        select: {
          id: true,
          colaboradorId: true,
          popId: true,
          status: true,
          notaQuiz: true,
          aprovadoQuiz: true,
        },
      }),
      prisma.tentativaQuiz.findMany({
        where: { colaborador: { tenantId } },
        select: {
          colaboradorId: true,
          nota: true,
          aprovado: true,
        },
      }),
    ]);

    const totalPops = pops.length;
    const totalColaboradores = colaboradores.length;

    // Build per-collaborator progress
    const colaboradorProgress = colaboradores.map((colab) => {
      const colabTreinamentos = treinamentos.filter((t) => t.colaboradorId === colab.id);
      const uniquePopsTreinados = new Set(colabTreinamentos.map((t) => t.popId));
      const concluidos = colabTreinamentos.filter((t) => t.status === "CONCLUIDO");
      const uniquePopsConcluidosSet = new Set(concluidos.map((t) => t.popId));

      const colabTentativas = tentativas.filter((t) => t.colaboradorId === colab.id);
      const notasAprovadas = colabTentativas.filter((t) => t.aprovado).map((t) => t.nota);
      const mediaQuiz = notasAprovadas.length > 0
        ? Math.round(notasAprovadas.reduce((a, b) => a + (b ?? 0), 0) / notasAprovadas.length)
        : null;

      return {
        id: colab.id,
        nome: colab.nome,
        funcao: colab.funcao,
        totalPops,
        popsTreinados: uniquePopsTreinados.size,
        popsConcluidos: uniquePopsConcluidosSet.size,
        percentual: totalPops > 0 ? Math.round((uniquePopsConcluidosSet.size / totalPops) * 100) : 0,
        mediaQuiz,
      };
    });

    // Build per-sector progress
    const setores = [...new Set(pops.map((p) => p.setor))];
    const setorProgress = setores.map((setor) => {
      const setorPops = pops.filter((p) => p.setor === setor);
      const setorPopIds = new Set(setorPops.map((p) => p.id));
      const setorTreinamentos = treinamentos.filter((t) => setorPopIds.has(t.popId));
      const concluidos = setorTreinamentos.filter((t) => t.status === "CONCLUIDO");

      // Unique collaborators who completed training in this sector
      const colabsConcluidos = new Set(concluidos.map((t) => t.colaboradorId));

      return {
        setor,
        totalPops: setorPops.length,
        treinamentosRealizados: setorTreinamentos.length,
        treinamentosConcluidos: concluidos.length,
        colaboradoresTreinados: colabsConcluidos.size,
        percentual: totalColaboradores > 0 && setorPops.length > 0
          ? Math.round(
              (concluidos.length / (setorPops.length * totalColaboradores)) * 100
            )
          : 0,
      };
    });

    // Overall stats
    const totalTreinamentos = treinamentos.length;
    const totalConcluidos = treinamentos.filter((t) => t.status === "CONCLUIDO").length;
    const taxaConclusao = totalTreinamentos > 0
      ? Math.round((totalConcluidos / totalTreinamentos) * 100)
      : 0;

    const notasAprovadas = tentativas.filter((t) => t.aprovado).map((t) => t.nota ?? 0);
    const mediaGeralQuiz = notasAprovadas.length > 0
      ? Math.round(notasAprovadas.reduce((a, b) => a + b, 0) / notasAprovadas.length)
      : 0;

    // Collaborators fully trained (100% POPs concluídos)
    const colabsCompletos = colaboradorProgress.filter((c) => c.percentual === 100).length;

    return NextResponse.json({
      resumo: {
        totalPops,
        totalColaboradores,
        totalTreinamentos,
        totalConcluidos,
        taxaConclusao,
        mediaGeralQuiz,
        colabsCompletos,
      },
      colaboradores: colaboradorProgress.sort((a, b) => b.percentual - a.percentual),
      setores: setorProgress.sort((a, b) => b.percentual - a.percentual),
    });
  } catch (error: any) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ error: "Erro ao buscar progresso" }, { status: 500 });
  }
}
