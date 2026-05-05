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
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        priceMonthly: true,
        priceYearly: true,
        features: true,
        limits: true,
      },
    });

    // Calcular desconto anual
    const plansWithDiscount = plans.map((plan) => {
      const monthlyTotal = plan.priceMonthly * 12;
      const yearlyTotal = plan.priceYearly;
      const savings = monthlyTotal - yearlyTotal;
      const discountPercent = monthlyTotal > 0 
        ? Math.round((savings / monthlyTotal) * 100) 
        : 0;

      return {
        ...plan,
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
