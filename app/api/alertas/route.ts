import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";
import { generateTrainingAlertsForUser } from "@/lib/alertas-treinamento";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(request.url);
  const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
  if (response) return response;

  const targetUserId = searchParams.get("usuarioId") || user.id;
  if (targetUserId !== user.id && !["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const colaborador = await prisma.colaborador.findFirst({
    where: { tenantId: tenantId!, email: user.email || "__none__" },
  });

  const generation = await generateTrainingAlertsForUser({
    tenantId: tenantId!,
    usuarioId: targetUserId,
    colaboradorId: colaborador && targetUserId === user.id ? colaborador.id : null,
  });

  const alertas = await prisma.alertaTreinamento.findMany({
    where: { tenantId: tenantId!, usuarioId: targetUserId },
    orderBy: [{ lido: "asc" }, { criadoEm: "desc" }],
    take: 100,
  });

  return NextResponse.json({
    alertas,
    gerados: generation.generated.length,
    resolvidos: generation.staleResolved,
  });
}
