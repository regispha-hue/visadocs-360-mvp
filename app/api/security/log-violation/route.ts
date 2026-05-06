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
    const violation = await prisma.securityLog.create({
      data: {
        action: "CONTENT_VIOLATION",
        severity: "MEDIUM",
        userId,
        tenantId,
        details: {
          contentId,
          violationType: type,
          violationDetails: details,
          ip,
          userAgent,
          url,
          timestamp,
        },
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
      await prisma.alerta.create({
        data: {
          tenantId,
          type: "SEGURANCA",
          title: `Múltiplas tentativas de violação - Usuário ${userId}`,
          message: `Usuário tentou violar proteção de conteúdo ${violationsCount} vezes nas últimas 24h`,
          severity: "ALTA",
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
