/**
 * API Tokens Fiscalização - CRUD de tokens de acesso
 * GET /api/fiscalizacao/tokens - Listar
 * POST /api/fiscalizacao/tokens - Criar
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// Gerar token único
function generateToken(): string {
  return randomBytes(12).toString("base64url");
}

// GET - Listar tokens
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

    // @ts-ignore
    const tokens = await prisma.tokenFiscalizacao.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { acessos: true },
        },
      },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("Erro ao buscar tokens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar token
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
    const { descricao, diasValidade = 30 } = body;

    // Gerar token único
    const token = generateToken();

    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + diasValidade);

    // @ts-ignore
    const tokenRecord = await prisma.tokenFiscalizacao.create({
      data: {
        tenantId,
        token,
        descricao,
        criadoPor: user.id,
        criadoPorNome: user.name,
        expiresAt,
        ativo: true,
      },
    });

    // Audit log
    await createAuditLog({
    // @ts-ignore
      action: AUDIT_ACTIONS.TOKEN_FISCALIZACAO_CREATED,
      entity: "TokenFiscalizacao",
      entityId: tokenRecord.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { descricao, expiresAt },
    });

    return NextResponse.json({ token: tokenRecord }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar token:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
