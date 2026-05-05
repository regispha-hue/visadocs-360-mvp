/**
 * API Admin Plans - CRUD completo
 * GET /api/admin/plans - Listar todos
 * POST /api/admin/plans - Criar novo
 * Apenas SUPER_ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET - Listar todos os planos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const { prisma } = require("@/lib/prisma");

    const where: any = {};
    if (active !== null) where.active = active === "true";

    const plans = await prisma.plan.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: {
                status: { in: ["ATIVO", "TRIAL", "PENDENTE"] },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Criar novo plano
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { prisma } = require("@/lib/prisma");
    const body = await request.json();

    const {
      name,
      description,
      priceMonthly,
      priceYearly,
      features,
      limits,
      stripePriceId,
      mpPriceId,
      sortOrder,
    } = body;

    // Validações
    if (!name || !priceMonthly || !priceYearly) {
      return NextResponse.json(
        { error: "Nome e preços são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar no Stripe se não tiver priceId
    let finalStripePriceId = stripePriceId;
    if (!finalStripePriceId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        
        // Criar produto
        const product = await stripe.products.create({
          name,
          description: description || undefined,
        });

        // Criar preço mensal
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(priceMonthly * 100), // Centavos
          currency: "brl",
          recurring: { interval: "month" },
        });

        finalStripePriceId = price.id;
      } catch (stripeError: any) {
        console.error("Erro Stripe:", stripeError);
        // Continuar sem Stripe ID
      }
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        priceMonthly: parseFloat(priceMonthly),
        priceYearly: parseFloat(priceYearly),
        features: features || [],
        limits: limits || {},
        stripePriceId: finalStripePriceId,
        mpPriceId,
        sortOrder: sortOrder || 0,
        active: true,
      },
    });

    await createAuditLog({
      action: "PLAN_CREATED",
      entity: "Plan",
      entityId: plan.id,
      userId: (session.user as any).id,
      userName: (session.user as any).name,
      details: { name, priceMonthly, priceYearly },
    });

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
