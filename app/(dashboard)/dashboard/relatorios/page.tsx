import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, GraduationCap, Award, TrendingUp } from "lucide-react";
import { ReportsCharts } from "./_components/reports-charts";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  if (!user.tenantId) {
    redirect("/dashboard");
  }

  const tenantId = user.tenantId;

  // Fetch stats
  const [
    popsBySetor,
    popsByStatus,
    colaboradoresByFuncao,
    treinamentosByStatus,
    topPops,
    topColaboradores,
  ] = await Promise.all([
    prisma.pop.groupBy({
      by: ["setor"],
      where: { tenantId },
      _count: true,
    }),
    prisma.pop.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.colaborador.groupBy({
      by: ["funcao"],
      where: { tenantId },
      _count: true,
    }),
    prisma.treinamento.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.pop.findMany({
      where: { tenantId },
      include: { _count: { select: { treinamentos: true } } },
      orderBy: { treinamentos: { _count: "desc" } },
      take: 5,
    }),
    prisma.colaborador.findMany({
      where: { tenantId },
      include: { _count: { select: { treinamentos: true } } },
      orderBy: { treinamentos: { _count: "desc" } },
      take: 5,
    }),
  ]);

  const totalPops = popsBySetor?.reduce((acc, curr) => acc + (curr?._count ?? 0), 0) ?? 0;
  const totalColaboradores = colaboradoresByFuncao?.reduce((acc, curr) => acc + (curr?._count ?? 0), 0) ?? 0;
  const totalTreinamentos = treinamentosByStatus?.reduce((acc, curr) => acc + (curr?._count ?? 0), 0) ?? 0;
  const treinamentosConcluidos = treinamentosByStatus?.find((t) => t?.status === "CONCLUIDO")?._count ?? 0;

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Visão geral das métricas da farmácia"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-teal-50">
                <FileText className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPops}</p>
                <p className="text-sm text-muted-foreground">POPs cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalColaboradores}</p>
                <p className="text-sm text-muted-foreground">Colaboradores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-50">
                <GraduationCap className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTreinamentos}</p>
                <p className="text-sm text-muted-foreground">Treinamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-50">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalTreinamentos > 0
                    ? Math.round((treinamentosConcluidos / totalTreinamentos) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Taxa de conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <ReportsCharts
        popsBySetor={popsBySetor ?? []}
        popsByStatus={popsByStatus ?? []}
        colaboradoresByFuncao={colaboradoresByFuncao ?? []}
        treinamentosByStatus={treinamentosByStatus ?? []}
      />

      {/* Top Lists */}
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-teal-600" />
              POPs Mais Treinados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(topPops?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {topPops?.map((pop, index) => (
                  <div key={pop?.id} className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">
                        <span className="font-mono text-teal-600">{pop?.codigo}</span> -{" "}
                        {pop?.titulo}
                      </p>
                    </div>
                    <span className="font-semibold">
                      {pop?._count?.treinamentos ?? 0} treinamentos
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Colaboradores Mais Treinados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(topColaboradores?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {topColaboradores?.map((colab, index) => (
                  <div key={colab?.id} className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{colab?.nome}</p>
                      <p className="text-sm text-muted-foreground">{colab?.funcao}</p>
                    </div>
                    <span className="font-semibold">
                      {colab?._count?.treinamentos ?? 0} treinamentos
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
