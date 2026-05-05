/**
 * API Tenant Logo - Atualizar logo da farmácia
 * PATCH /api/tenant/logo
 * Atualiza o campo logoUrl do tenant
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

// PATCH - Atualizar logo
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Verificar permissões
    const allowedRoles = ["SUPER_ADMIN", "ADMIN_FARMACIA"];
    
    if (!tenantId) {
      return NextResponse.json(
        { error: "Super Admin não tem tenant associado para logo" },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Apenas administradores podem alterar a logo" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { logoUrl } = body;

    // Atualizar tenant
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
    // @ts-ignore
      data: { logoUrl },
      select: {
        id: true,
        nome: true,
    // @ts-ignore
        logoUrl: true,
      },
    });

    // Audit log
    await createAuditLog({
    // @ts-ignore
      action: logoUrl ? AUDIT_ACTIONS.LOGO_UPDATED : AUDIT_ACTIONS.LOGO_REMOVED,
      entity: "Tenant",
      entityId: tenantId,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { logoUrl },
    });

    return NextResponse.json({
      success: true,
      tenant,
      message: logoUrl ? "Logo atualizada com sucesso" : "Logo removida",
    });
  } catch (error) {
    console.error("Erro ao atualizar logo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Remover logo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 403 }
      );
    }

    const allowedRoles = ["SUPER_ADMIN", "ADMIN_FARMACIA"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Permissão negada" },
        { status: 403 }
      );
    }

    // Buscar logo atual para possível deleção do S3
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    // @ts-ignore
      select: { logoUrl: true },
    });

    // Remover logoUrl do tenant
    await prisma.tenant.update({
      where: { id: tenantId },
    // @ts-ignore
      data: { logoUrl: null },
    });

    // Audit log
    await createAuditLog({
    // @ts-ignore
      action: AUDIT_ACTIONS.LOGO_REMOVED,
      entity: "Tenant",
      entityId: tenantId,
      userId: user.id,
      userName: user.name,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      message: "Logo removida com sucesso",
    // @ts-ignore
      previousUrl: tenant?.logoUrl,
    });
  } catch (error) {
    console.error("Erro ao remover logo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
