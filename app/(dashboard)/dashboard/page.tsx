import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { FileText, Users, GraduationCap, CheckCircle, Clock } from "lucide-react";
import { DashboardCharts } from "./_components/dashboard-charts";
import { RecentActivity } from "./_components/recent-activity";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  if (user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (!user.tenantId) {
    redirect("/login");
  }

  const tenantId = user.tenantId;

  // Fetch statistics
  const [popsCount, colaboradoresCount, treinamentosCount, tenant] = await Promise.all([
    prisma.pop.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.colaborador.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.treinamento.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nome: true },
    }),
  ]);

  const totalPops = popsCount?.reduce((acc: number, curr: any) => acc + (curr?._count ?? 0), 0) ?? 0;
  const popsAtivos = popsCount?.find((p: any) => p?.status === "ATIVO")?._count ?? 0;
  const totalColaboradores = colaboradoresCount?.reduce((acc: number, curr: any) => acc + (curr?._count ?? 0), 0) ?? 0;
  const colaboradoresAtivos = colaboradoresCount?.find((c: any) => c?.status === "ATIVO")?._count ?? 0;
  const totalTreinamentos = treinamentosCount?.reduce((acc: number, curr: any) => acc + (curr?._count ?? 0), 0) ?? 0;
  const treinamentosConcluidos = treinamentosCount?.find((t: any) => t?.status === "CONCLUIDO")?._count ?? 0;
  const treinamentosPendentes = treinamentosCount?.find((t: any) => t?.status === "PENDENTE")?._count ?? 0;

  // Get POPs by sector
  const popsBySector = await prisma.pop.groupBy({
    by: ["setor"],
    where: { tenantId },
    _count: true,
  });

  // Get recent trainings
  const recentTreinamentos = await prisma.treinamento.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      pop: { select: { codigo: true, titulo: true } },
      colaborador: { select: { nome: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title={`Bem-vindo, ${user.name}`}
        description={tenant?.nome ?? "Farmácia"}
      />

      <div className="mb-8 rounded-xl border border-teal-100 bg-teal-50/70 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Visão geral da conformidade
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Use este painel para acompanhar a rotina documental da farmácia
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Aqui você vê, em um só lugar, quantos POPs estão cadastrados e ativos, a situação dos colaboradores,
              os treinamentos concluídos ou pendentes e a distribuição dos POPs por setor. Use estes indicadores para
              identificar prioridades antes de revisar documentos, convocar treinamentos ou preparar evidências para fiscalização.
            </p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 text-sm text-gray-600 shadow-sm md:max-w-xs">
            <strong className="block text-gray-900">Como interpretar</strong>
            Números no topo mostram o resumo operacional; os gráficos abaixo ajudam a localizar setores com maior volume
            documental e treinamentos recentes.
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total de POPs"
          value={totalPops}
          description={`${popsAtivos} ativos`}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Colaboradores"
          value={totalColaboradores}
          description={`${colaboradoresAtivos} ativos`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Treinamentos Concluídos"
          value={treinamentosConcluidos}
          description={`de ${totalTreinamentos} total`}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Treinamentos Pendentes"
          value={treinamentosPendentes}
          description="aguardando conclusão"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* @ts-ignore */}
        <DashboardCharts popsBySector={popsBySector ?? []} />
        {/* @ts-ignore */}
        <RecentActivity treinamentos={recentTreinamentos ?? []} />
      </div>
    </div>
  );
}
