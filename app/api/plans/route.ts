/**
 * API Plans - Listar planos disponíveis
 * GET /api/plans
 * Público - não requer autenticação
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currency: true,
        interval: true,
        features: true,
        maxUsers: true,
        isActive: true,
        stripePriceId: true,
      },
    });

    // Calcular desconto anual (assumindo 2 meses grátis no anual)
    const plansWithDiscount = plans.map((plan) => {
      const monthlyTotal = plan.price * 12;
      const yearlyTotal = plan.price * 10; // 2 meses grátis
      const savings = monthlyTotal - yearlyTotal;
      const discountPercent = monthlyTotal > 0 
        ? Math.round((savings / monthlyTotal) * 100) 
        : 0;

      return {
        ...plan,
        priceMonthly: plan.price,
        priceYearly: yearlyTotal,
        description: `Plano ${plan.name} com até ${plan.maxUsers} usuários`,
        limits: { maxUsers: plan.maxUsers },
        yearlyDiscount: {
          amount: savings,
          percent: discountPercent,
        },
      };
    });

    return NextResponse.json({ plans: plansWithDiscount });
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
