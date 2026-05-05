/**
 * API Stripe Webhook
 * POST /api/stripe/webhook
 * Processa eventos do Stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.canceled": {
        const subscription = event.data.object;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  const { tenantId, subscriptionId, planId, billingCycle } = session.metadata;

  if (!tenantId || !subscriptionId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const stripeSubscriptionId = session.subscription;

  // Atualizar assinatura
    // @ts-ignore
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ATIVO",
      stripeSubscriptionId,
      billingCycle: billingCycle || "MENSAL",
      startDate: new Date(),
      trialEndsAt: null, // Remove trial após pagamento
    },
  });

  // Atualizar status do tenant
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionStatus: "ATIVO",
      status: "ATIVO",
    },
  });

  // Criar registro de pagamento
    // @ts-ignore
  await prisma.payment.create({
    data: {
      subscriptionId,
      tenantId,
      amount: session.amount_total / 100, // Stripe retorna em centavos
      currency: session.currency?.toUpperCase() || "BRL",
      provider: "STRIPE",
      providerPaymentId: session.payment_intent,
      status: "PAGO",
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
      paidAt: new Date(),
    },
  });

  // Audit log
  await createAuditLog({
    // @ts-ignore
    action: AUDIT_ACTIONS.SUBSCRIPTION_ACTIVATED,
    entity: "Subscription",
    entityId: subscriptionId,
    tenantId,
    details: {
      planId,
      stripeSubscriptionId,
      amount: session.amount_total / 100,
    },
  });
}

async function handlePaymentSucceeded(invoice: any) {
  const stripeSubscriptionId = invoice.subscription;
  
    // @ts-ignore
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    console.error("Subscription not found for invoice:", stripeSubscriptionId);
    return;
  }

  // Criar registro de pagamento
    // @ts-ignore
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      tenantId: subscription.tenantId,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency?.toUpperCase() || "BRL",
      provider: "STRIPE",
      providerPaymentId: invoice.payment_intent,
      status: "PAGO",
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      paidAt: new Date(),
      invoiceUrl: invoice.hosted_invoice_url,
      receiptUrl: invoice.invoice_pdf,
    },
  });

  // Garantir que tenant está ativo
  await prisma.tenant.update({
    where: { id: subscription.tenantId },
    data: {
      subscriptionStatus: "ATIVO",
      status: "ATIVO",
    },
  });
}

async function handlePaymentFailed(invoice: any) {
  const stripeSubscriptionId = invoice.subscription;
  
    // @ts-ignore
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!subscription) return;

  // Atualizar status do pagamento
    // @ts-ignore
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      tenantId: subscription.tenantId,
      amount: invoice.amount_due / 100,
      currency: invoice.currency?.toUpperCase() || "BRL",
      provider: "STRIPE",
      status: "FALHOU",
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      failedAt: new Date(),
      failReason: invoice.last_finalization_error?.message || "Pagamento recusado",
    },
  });

  // Se falhou múltiplas vezes, suspender
    // @ts-ignore
  const recentFailures = await prisma.payment.count({
    where: {
      subscriptionId: subscription.id,
      status: "FALHOU",
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  if (recentFailures >= 3) {
    // @ts-ignore
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "SUSPENSO" },
    });

    await prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: { subscriptionStatus: "SUSPENSO" },
    });

    await createAuditLog({
    // @ts-ignore
      action: AUDIT_ACTIONS.SUBSCRIPTION_SUSPENDED,
      entity: "Subscription",
      entityId: subscription.id,
      tenantId: subscription.tenantId,
      details: { reason: "Múltiplas falhas de pagamento" },
    });
  }
}

async function handleSubscriptionCanceled(stripeSubscription: any) {
  const stripeSubscriptionId = stripeSubscription.id;
  
    // @ts-ignore
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!subscription) return;

    // @ts-ignore
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "CANCELADO",
      canceledAt: new Date(),
      endDate: new Date(stripeSubscription.current_period_end * 1000),
    },
  });

  await prisma.tenant.update({
    where: { id: subscription.tenantId },
    data: {
      subscriptionStatus: "CANCELADO",
    },
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.SUBSCRIPTION_CANCELED,
    entity: "Subscription",
    entityId: subscription.id,
    tenantId: subscription.tenantId,
  });
}

async function handleSubscriptionUpdated(stripeSubscription: any) {
  const stripeSubscriptionId = stripeSubscription.id;
  
    // @ts-ignore
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!subscription) return;

  const status = stripeSubscription.status;
  let subscriptionStatus = subscription.status;

  // Mapear status do Stripe para nosso status
  if (status === "active") subscriptionStatus = "ATIVO";
  else if (status === "past_due") subscriptionStatus = "SUSPENSO";
  else if (status === "canceled") subscriptionStatus = "CANCELADO";
  else if (status === "unpaid") subscriptionStatus = "SUSPENSO";

  if (subscriptionStatus !== subscription.status) {
    // @ts-ignore
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: subscriptionStatus },
    });

    await prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: { subscriptionStatus },
    });
  }
}
