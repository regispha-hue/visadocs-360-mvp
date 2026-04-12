import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const tenantId = params.id;
    const { status, subscriptionStatus } = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Farmácia não encontrada" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    // Determine audit action
    let auditAction = AUDIT_ACTIONS.TENANT_UPDATED;
    if (status === "SUSPENSO") auditAction = AUDIT_ACTIONS.TENANT_SUSPENDED;
    else if (status === "ATIVO" && tenant.status === "SUSPENSO") auditAction = AUDIT_ACTIONS.TENANT_REACTIVATED;
    else if (status === "CANCELADO") auditAction = AUDIT_ACTIONS.TENANT_CANCELLED;

    await createAuditLog({
      action: auditAction,
      entity: "Tenant",
      entityId: tenantId,
      userId: user.id,
      userName: user.name,
      details: { oldStatus: tenant.status, newStatus: status, nome: tenant.nome },
    });

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error: any) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status" },
      { status: 500 }
    );
  }
}
