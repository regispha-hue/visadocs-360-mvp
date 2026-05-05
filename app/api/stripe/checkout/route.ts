/**
 * API Stripe Checkout
 * POST /api/stripe/checkout
 * Cria sessão de checkout Stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { planId, billingCycle = "MENSAL" } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Plano não especificado" },
        { status: 400 }
      );
    }

    // Buscar plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId, active: true },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se tem stripePriceId configurado
    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: "Plano não configurado para pagamento Stripe" },
        { status: 400 }
      );
    }

    // Buscar ou criar assinatura
    let subscription = await prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      // Criar nova assinatura
      const trialDays = 14;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

      subscription = await prisma.subscription.create({
        data: {
          tenantId,
          planId,
          status: "TRIAL",
          billingCycle,
          startDate: new Date(),
          trialEndsAt,
        },
      });
    }

    // Criar sessão de checkout Stripe
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // Criar ou buscar cliente Stripe
    let stripeCustomerId = subscription.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.tenantName || user.name,
        metadata: {
          tenantId,
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Atualizar assinatura com stripeCustomerId
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { stripeCustomerId },
      });
    }

    // Criar sessão de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: billingCycle === "ANUAL" && plan.stripePriceId 
            ? plan.stripePriceId + "_yearly" // Assumindo que temos preço anual
            : plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?canceled=true`,
      metadata: {
        tenantId,
        subscriptionId: subscription.id,
        planId,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          tenantId,
          subscriptionId: subscription.id,
        },
        trial_end: subscription.trialEndsAt 
          ? Math.floor(subscription.trialEndsAt.getTime() / 1000)
          : undefined,
      },
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error("Erro ao criar checkout Stripe:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
