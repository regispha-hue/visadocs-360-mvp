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

type CargoModeloTemplate = {
  kitIds?: string[];
  funcaoPadrao?: string;
  setorPadrao?: string;
};

function normalizeCargo(cargo: any) {
  const template = (cargo.template ?? {}) as CargoModeloTemplate;

  return {
    ...cargo,
    nome: cargo.name,
    descricao: cargo.description,
    kitIds: template.kitIds ?? [],
    funcaoPadrao: template.funcaoPadrao ?? null,
    setorPadrao: template.setorPadrao ?? null,
    ativo: cargo.isActive,
  };
}

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

    const existing = await prisma.cargoModelo.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cargo não encontrado" },
        { status: 404 }
      );
    }

    if (nome && nome !== existing.name) {
      const nameExists = await prisma.cargoModelo.findFirst({
        where: { tenantId, name: nome, isActive: true, id: { not: id } },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Já existe um cargo com este nome" },
          { status: 400 }
        );
      }
    }

    const currentTemplate = (existing.template ?? {}) as CargoModeloTemplate;

    const cargo = await prisma.cargoModelo.update({
      where: { id },
      data: {
        ...(nome !== undefined ? { name: nome } : {}),
        ...(descricao !== undefined ? { description: descricao } : {}),
        template: {
          ...currentTemplate,
          kitIds: kitIds ?? currentTemplate.kitIds ?? [],
          funcaoPadrao: funcaoPadrao ?? currentTemplate.funcaoPadrao,
          setorPadrao: setorPadrao ?? currentTemplate.setorPadrao,
        },
        ...(ativo !== undefined ? { isActive: ativo } : {}),
      },
    });

    await createAuditLog({
      action: (AUDIT_ACTIONS as any).CARGO_UPDATED ?? "CARGO_UPDATED",
      entity: "CargoModelo",
      entityId: cargo.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { nome: nome ?? existing.name, kitIds },
    });

    return NextResponse.json({ cargo: normalizeCargo(cargo) });
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

    const existing = await prisma.cargoModelo.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cargo não encontrado" },
        { status: 404 }
      );
    }

    await prisma.cargoModelo.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      action: (AUDIT_ACTIONS as any).CARGO_DELETED ?? "CARGO_DELETED",
      entity: "CargoModelo",
      entityId: id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { nome: existing.name },
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
