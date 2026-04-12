import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import dynamic from "next/dynamic";
import { TrialBanner } from "@/components/trial-banner";

const Sidebar = dynamic(() => import("@/components/sidebar").then(m => ({ default: m.Sidebar })), { ssr: false });

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  // Calculate trial days left if applicable
  let trialDaysLeft = -1;
  if (user.tenantId && user.role !== "SUPER_ADMIN") {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { subscriptionStatus: true, trialEndsAt: true },
    });

    if (tenant?.subscriptionStatus === "TRIAL" && tenant.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(tenant.trialEndsAt);
      trialDaysLeft = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {trialDaysLeft >= 0 && <TrialBanner daysLeft={trialDaysLeft} />}
        <div className="p-4 lg:p-8 lg:ml-0">
          {children}
        </div>
      </main>
    </div>
  );
}
