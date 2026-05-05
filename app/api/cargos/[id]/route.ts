/**
 * API Cargo Detail
 * PATCH /api/cargos/[id] - Atualizar
 * DELETE /api/cargos/[id] - Remover (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

// PATCH - Atualizar cargo
export async function PATCH(
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
    const body = await request.json();
    const { nome, descricao, kitIds, funcaoPadrao, setorPadrao, ativo } = body;

    // Check if cargo exists and belongs to tenant
    const existing = await prisma.cargoModelo.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cargo não encontrado" },
        { status: 404 }
      );
    }

    // Check name uniqueness if changing name
    if (nome && nome !== existing.nome) {
      const nameExists = await prisma.cargoModelo.findFirst({
        where: { tenantId, nome, ativo: true, id: { not: id } },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Já existe um cargo com este nome" },
          { status: 400 }
        );
      }
    }

    const cargo = await prisma.cargoModelo.update({
      where: { id },
      data: {
        nome,
        descricao,
        kitIds,
        funcaoPadrao,
        setorPadrao,
        ativo,
      },
    });

    // Audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.CARGO_UPDATED,
      entity: "CargoModelo",
      entityId: cargo.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { nome, kitIds },
    });

    return NextResponse.json({ cargo });
  } catch (error) {
    console.error("Erro ao atualizar cargo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Remover cargo (soft delete)
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

    // Check if cargo exists and belongs to tenant
    const existing = await prisma.cargoModelo.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { colaboradores: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cargo não encontrado" },
        { status: 404 }
      );
    }

    // Check if cargo has associated colaboradores
    if (existing._count.colaboradores > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir cargo com colaboradores associados" },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.cargoModelo.update({
      where: { id },
      data: { ativo: false },
    });

    // Audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.CARGO_DELETED,
      entity: "CargoModelo",
      entityId: id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { nome: existing.nome },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir cargo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
