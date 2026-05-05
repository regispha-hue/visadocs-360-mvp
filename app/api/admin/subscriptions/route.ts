/**
 * API Admin Subscriptions
 * GET /api/admin/subscriptions - Listar todas assinaturas
 * Apenas SUPER_ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const planId = searchParams.get("planId");
    const tenantId = searchParams.get("tenantId");

    // Usar require para evitar erro de TypeScript até migrar
    const { prisma } = require("@/lib/prisma");

    const where: any = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;
    if (tenantId) where.tenantId = tenantId;

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            email: true,
            status: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            priceMonthly: true,
            priceYearly: true,
          },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular métricas
    const now = new Date();
    const metrics = {
      total: subscriptions.length,
      active: subscriptions.filter((s: any) => s.status === "ATIVO").length,
      trial: subscriptions.filter((s: any) => s.status === "TRIAL").length,
      suspended: subscriptions.filter((s: any) => s.status === "SUSPENSO").length,
      canceled: subscriptions.filter((s: any) => s.status === "CANCELADO").length,
      mrr: subscriptions
        .filter((s: any) => s.status === "ATIVO" && s.billingCycle === "MENSAL")
        .reduce((sum: number, s: any) => sum + (s.plan?.priceMonthly || 0), 0),
      arr: subscriptions
        .filter((s: any) => s.status === "ATIVO" && s.billingCycle === "ANUAL")
        .reduce((sum: number, s: any) => sum + (s.plan?.priceYearly || 0), 0),
      trialExpiringSoon: subscriptions.filter((s: any) => {
        if (s.status !== "TRIAL" || !s.trialEndsAt) return false;
        const daysUntilExpiry = Math.ceil(
          (new Date(s.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      }).length,
    };

    return NextResponse.json({
      subscriptions,
      metrics,
    });
  } catch (error: any) {
    console.error("Erro ao buscar assinaturas:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
