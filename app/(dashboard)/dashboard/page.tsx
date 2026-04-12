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
      select: { nome: true, subscriptionStatus: true },
    }),
  ]);

  const totalPops = popsCount?.reduce((acc, curr) => acc + (curr?._count ?? 0), 0) ?? 0;
  const popsAtivos = popsCount?.find((p) => p?.status === "ATIVO")?._count ?? 0;
  const totalColaboradores = colaboradoresCount?.reduce((acc, curr) => acc + (curr?._count ?? 0), 0) ?? 0;
  const colaboradoresAtivos = colaboradoresCount?.find((c) => c?.status === "ATIVO")?._count ?? 0;
  const totalTreinamentos = treinamentosCount?.reduce((acc, curr) => acc + (curr?._count ?? 0), 0) ?? 0;
  const treinamentosConcluidos = treinamentosCount?.find((t) => t?.status === "CONCLUIDO")?._count ?? 0;
  const treinamentosPendentes = treinamentosCount?.find((t) => t?.status === "PENDENTE")?._count ?? 0;

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
        <DashboardCharts popsBySector={popsBySector ?? []} />
        <RecentActivity treinamentos={recentTreinamentos ?? []} />
      </div>
    </div>
  );
}
