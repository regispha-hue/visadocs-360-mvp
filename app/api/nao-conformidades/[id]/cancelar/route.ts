import { getCurrentUser, unauthorized } from "@/lib/auth-guards";
import { cancelNc } from "../_actions";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return cancelNc({ request, params, user });
}
