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
        ativo: true,
      },
      include: {
        _count: {
          select: { colaboradores: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cargos });
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

    // Check if cargo already exists
    const existing = await prisma.cargoModelo.findFirst({
      where: { tenantId, nome, ativo: true },
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
        nome,
        descricao,
        kitIds: kitIds || [],
        funcaoPadrao,
        setorPadrao,
        ativo: true,
      },
    });

    // Audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.CARGO_CREATED,
      entity: "CargoModelo",
      entityId: cargo.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { nome, kitIds },
    });

    return NextResponse.json({ cargo }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
