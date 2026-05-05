/**
 * API Admin Subscription Actions
 * GET /api/admin/subscriptions/[id] - Detalhes
 * PATCH /api/admin/subscriptions/[id] - Atualizar
 * DELETE /api/admin/subscriptions/[id] - Cancelar
 * Apenas SUPER_ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET - Detalhes da assinatura
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { prisma } = require("@/lib/prisma");
    const { id } = params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            email: true,
            telefone: true,
            status: true,
            subscriptionStatus: true,
            logoUrl: true,
            createdAt: true,
          },
        },
        plan: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Atualizar assinatura (alterar plano, status, etc)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { prisma } = require("@/lib/prisma");
    const { id } = params;
    const body = await request.json();
    const { planId, status, trialEndsAt, billingCycle } = body;

    const updateData: any = {};
    if (planId) updateData.planId = planId;
    if (status) updateData.status = status;
    if (trialEndsAt) updateData.trialEndsAt = new Date(trialEndsAt);
    if (billingCycle) updateData.billingCycle = billingCycle;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        tenant: { select: { id: true, nome: true } },
        plan: { select: { name: true } },
      },
    });

    // Sincronizar status do tenant
    if (status) {
      await prisma.tenant.update({
        where: { id: subscription.tenantId },
        data: { subscriptionStatus: status },
      });
    }

    // Audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.SUBSCRIPTION_UPDATED,
      entity: "Subscription",
      entityId: id,
      userId: (session.user as any).id,
      userName: (session.user as any).name,
      tenantId: subscription.tenantId,
      details: {
        changes: body,
        plan: subscription.plan?.name,
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    console.error("Erro ao atualizar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Cancelar assinatura
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { prisma } = require("@/lib/prisma");
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { reason, cancelImmediately = false } = body;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { tenant: { select: { id: true, nome: true } } },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    // Cancelar no Stripe se houver subscription ID
    if (subscription.stripeSubscriptionId) {
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        
        if (cancelImmediately) {
          // Cancelar imediatamente
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        } else {
          // Cancelar ao final do período
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });
        }
      } catch (stripeError: any) {
        console.error("Erro Stripe:", stripeError);
        // Continuar mesmo se falhar no Stripe
      }
    }

    // Atualizar no banco
    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: cancelImmediately ? "CANCELADO" : subscription.status,
        canceledAt: new Date(),
        cancelReason: reason || "Cancelado pelo administrador",
        endDate: cancelImmediately 
          ? new Date() 
          : subscription.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Atualizar tenant
    if (cancelImmediately) {
      await prisma.tenant.update({
        where: { id: subscription.tenantId },
        data: { subscriptionStatus: "CANCELADO" },
      });
    }

    // Audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.SUBSCRIPTION_CANCELED,
      entity: "Subscription",
      entityId: id,
      userId: (session.user as any).id,
      userName: (session.user as any).name,
      tenantId: subscription.tenantId,
      details: {
        reason,
        cancelImmediately,
        tenantName: subscription.tenant?.nome,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: updated,
      message: cancelImmediately
        ? "Assinatura cancelada imediatamente"
        : "Assinatura será cancelada ao final do período",
    });
  } catch (error: any) {
    console.error("Erro ao cancelar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
