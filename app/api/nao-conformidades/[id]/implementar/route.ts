import { getCurrentUser, unauthorized } from "@/lib/auth-guards";
import { implementCapa } from "../_actions";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return implementCapa({ request, params: await params, user });
}
