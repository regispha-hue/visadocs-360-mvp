import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Building2, FileText, GraduationCap, Clock } from "lucide-react";
import { AdminDashboardCharts } from "./_components/admin-charts";
import { PendingFarmacias } from "./_components/pending-farmacias";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  if (user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Fetch global statistics
  const [farmaciasByStatus, totalPops, totalColaboradores, totalTreinamentos, pendingFarmacias] =
    await Promise.all([
      prisma.tenant.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.pop.count(),
      prisma.colaborador.count(),
      prisma.treinamento.count(),
      prisma.tenant.findMany({
        where: { status: "PENDENTE" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const totalFarmacias = farmaciasByStatus?.reduce((acc, curr) => acc + (curr?._count ?? 0), 0) ?? 0;
  const farmaciasAtivas = farmaciasByStatus?.find((f) => f?.status === "ATIVO")?._count ?? 0;
  const farmaciasPendentes = farmaciasByStatus?.find((f) => f?.status === "PENDENTE")?._count ?? 0;

  return (
    <div>
      <PageHeader
        title="Dashboard Super Admin"
        description="Visão geral do sistema VISADOCS"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total de Farmácias"
          value={totalFarmacias}
          description={`${farmaciasAtivas} ativas`}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          title="Farmácias Pendentes"
          value={farmaciasPendentes}
          description="aguardando aprovação"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Total de POPs"
          value={totalPops}
          description="em todas as farmácias"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Total de Treinamentos"
          value={totalTreinamentos}
          description="realizados"
          icon={<GraduationCap className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminDashboardCharts farmaciasByStatus={farmaciasByStatus ?? []} />
        <PendingFarmacias farmacias={pendingFarmacias ?? []} />
      </div>
    </div>
  );
}
