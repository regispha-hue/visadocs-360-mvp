import { NextResponse } from "next/server";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";
import { buildComplianceScorecard } from "@/lib/compliance-scorecard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["SUPER_ADMIN", "ADMIN", "RT", "ANALISTA_CQ"].includes(user.role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
  if (response) return response;

  const scorecard = await buildComplianceScorecard(tenantId!);
  return NextResponse.json(scorecard);
}
