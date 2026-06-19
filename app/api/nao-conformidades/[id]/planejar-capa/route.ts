import { getCurrentUser, unauthorized } from "@/lib/auth-guards";
import { planCapa } from "../_actions";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return planCapa({ request, params: await params, user });
}
