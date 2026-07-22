import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth-options";

export type GuardRole = "SUPER_ADMIN" | "ADMIN" | "RT" | "OPERADOR" | "COLABORADOR";

export interface GuardUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: GuardRole;
  tenantId?: string | null;
}

export async function getCurrentUser(): Promise<GuardUser | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as GuardUser | undefined) || null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export function forbidden(message = "Sem permissão") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function resolveTenantId(user: GuardUser, requestedTenantId?: string | null) {
  if (user.role === "SUPER_ADMIN") {
    return requestedTenantId || null;
  }

  return user.tenantId || null;
}

export function requireTenantId(user: GuardUser, requestedTenantId?: string | null) {
  const tenantId = resolveTenantId(user, requestedTenantId);

  if (!tenantId) {
    return { tenantId: null, response: badRequest("Tenant não especificado") };
  }

  return { tenantId, response: null };
}

export function hasRole(user: GuardUser, roles: GuardRole[]) {
  return roles.includes(user.role);
}

export function isRtRole(user: GuardUser) {
  return user.role === "RT";
}

export function canApproveAsRT(user: GuardUser) {
  return isRtRole(user);
}
