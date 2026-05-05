// app/api/security/log-violation/route.ts
// API para registrar tentativas de violação de segurança

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      contentId,
      userId,
      tenantId,
      type,
      details,
      timestamp,
      userAgent,
      url,
    } = body;

    // Capturar IP do request
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               "unknown";

    // Salvar log de violação
    // @ts-ignore
    const violation = await prisma.securityLog.create({
      data: {
        type: "CONTENT_VIOLATION",
        severity: "MEDIUM",
        userId,
        tenantId,
        contentId,
        details: JSON.stringify({
          violationType: type,
          violationDetails: details,
          ip,
          userAgent,
          url,
          timestamp,
        }),
        ip,
        userAgent: userAgent || "unknown",
      },
    });

    // Se muitas violações, notificar admin
    // @ts-ignore
    const violationsCount = await prisma.securityLog.count({
      where: {
        userId,
        tenantId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
        },
      },
    });

    if (violationsCount >= 5) {
      // Criar alerta para admin
    // @ts-ignore
      await prisma.alerta.create({
        data: {
          tenantId,
          tipo: "SEGURANCA",
          titulo: `Múltiplas tentativas de violação - Usuário ${userId}`,
          descricao: `Usuário tentou violar proteção de conteúdo ${violationsCount} vezes nas últimas 24h`,
          severidade: "ALTA",
          status: "PENDENTE",
        },
      });
    }

    return NextResponse.json({
      success: true,
      violationId: violation.id,
      totalViolations: violationsCount,
    });

  } catch (error: any) {
    console.error("Erro ao logar violação:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
