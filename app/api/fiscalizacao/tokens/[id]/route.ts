/**
 * API Token Detail - Revogar token
 * DELETE /api/fiscalizacao/tokens/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 403 });
    }

    const { id } = params;

    // Check if token exists and belongs to tenant
    const token = await prisma.tokenFiscalizacao.findFirst({
      where: { id, tenantId },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 404 }
      );
    }

    // Revogar (soft delete)
    await prisma.tokenFiscalizacao.update({
      where: { id },
      data: { ativo: false },
    });

    // Audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.TOKEN_FISCALIZACAO_REVOKED,
      entity: "TokenFiscalizacao",
      entityId: id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { descricao: token.descricao },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao revogar token:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
