import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTrainingAlertsForTenant } from "@/lib/alertas-treinamento";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== "production") return true;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenants = await prisma.tenant.findMany({
    where: { status: "ATIVO" },
    select: { id: true },
  });

  const result = {
    tenantsProcessados: 0,
    usuariosProcessados: 0,
    alertasGerados: 0,
    alertasResolvidos: 0,
  };

  for (const tenant of tenants) {
    const tenantResult = await generateTrainingAlertsForTenant(tenant.id);
    result.tenantsProcessados += 1;
    result.usuariosProcessados += tenantResult.usuariosProcessados;
    result.alertasGerados += tenantResult.alertasGerados;
    result.alertasResolvidos += tenantResult.alertasResolvidos;
  }

  return NextResponse.json({
    success: true,
    executedAt: new Date().toISOString(),
    ...result,
  });
}
