/**
 * API Cargos - CRUD de Modelos de Cargo
 * GET /api/cargos - Listar
 * POST /api/cargos - Criar
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

// GET - Listar cargos
export async function GET(request: NextRequest) {
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

    const cargos = await prisma.cargoModelo.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cargos: cargos.map(normalizeCargo) });
  } catch (error) {
    console.error("Erro ao buscar cargos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar cargo
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { nome, descricao, kitIds, funcaoPadrao, setorPadrao } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const existing = await prisma.cargoModelo.findFirst({
      where: { tenantId, name: nome, isActive: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um cargo com este nome" },
        { status: 400 }
      );
    }

    const cargo = await prisma.cargoModelo.create({
      data: {
        tenantId,
        name: nome,
        description: descricao,
        template: {
          kitIds: kitIds || [],
          funcaoPadrao,
          setorPadrao,
        },
        isActive: true,
      },
    });

    await createAuditLog({
      action: (AUDIT_ACTIONS as any).CARGO_CREATED ?? "CARGO_CREATED",
      entity: "CargoModelo",
      entityId: cargo.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { nome, kitIds },
    });

    return NextResponse.json({ cargo: normalizeCargo(cargo) }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

