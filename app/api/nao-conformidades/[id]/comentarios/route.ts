import { getCurrentUser, unauthorized } from "@/lib/auth-guards";
import { addNcComment } from "../_actions";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return addNcComment({ request, params, user });
}
