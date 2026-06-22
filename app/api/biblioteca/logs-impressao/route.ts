import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
  if (response) return response;

  const logs = await prisma.documentoImpressaoLog.findMany({
    where: { tenantId: tenantId! },
    orderBy: { criadoEm: "desc" },
    take: 200,
    include: {
      documento: { select: { id: true, title: true, code: true, type: true, version: true } },
    },
  });

  return NextResponse.json({ logs });
}
