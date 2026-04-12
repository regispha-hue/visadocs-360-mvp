import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { LogsTable } from "./_components/logs-table";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  if (user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      tenant: { select: { nome: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Logs de Auditoria"
        description="Histórico de ações críticas no sistema"
      />
      <LogsTable logs={logs ?? []} />
    </div>
  );
}
