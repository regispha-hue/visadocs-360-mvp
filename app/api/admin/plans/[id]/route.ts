/**
 * API Admin Plan - CRUD individual
 * GET /api/admin/plans/[id] - Detalhes
 * PATCH /api/admin/plans/[id] - Atualizar
 * DELETE /api/admin/plans/[id] - Desativar
 * Apenas SUPER_ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET - Detalhes do plano
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

    const plan = await prisma.plan.findUnique({
      where: { id },
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
        subscriptions: {
          where: {
            status: { in: ["ATIVO", "TRIAL"] },
          },
          select: {
            id: true,
            status: true,
            tenant: {
              select: { nome: true, email: true },
            },
          },
          take: 10,
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Atualizar plano
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

    const {
      name,
      description,
      priceMonthly,
      priceYearly,
      features,
      limits,
      stripePriceId,
      mpPriceId,
      active,
      sortOrder,
    } = body;

    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (priceMonthly !== undefined) updateData.priceMonthly = parseFloat(priceMonthly);
    if (priceYearly !== undefined) updateData.priceYearly = parseFloat(priceYearly);
    if (features !== undefined) updateData.features = features;
    if (limits !== undefined) updateData.limits = limits;
    if (stripePriceId !== undefined) updateData.stripePriceId = stripePriceId;
    if (mpPriceId !== undefined) updateData.mpPriceId = mpPriceId;
    if (active !== undefined) updateData.active = active;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    // Se preço mudou e tem stripePriceId, atualizar no Stripe
    if ((priceMonthly !== undefined || priceYearly !== undefined) && plan.stripePriceId) {
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        // Stripe não permite alterar preço, apenas arquivar e criar novo
        // Isso é uma simplificação - em produção seria mais complexo
        console.log("Preço alterado - considere criar novo price no Stripe");
      } catch (stripeError) {
        console.error("Erro Stripe:", stripeError);
      }
    }

    await createAuditLog({
      action: "PLAN_UPDATED",
      entity: "Plan",
      entityId: id,
      userId: (session.user as any).id,
      userName: (session.user as any).name,
      details: { changes: Object.keys(updateData) },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Desativar plano (soft delete)
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

    const plan = await prisma.plan.findUnique({
      where: { id },
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

    if (!plan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    // Verificar se há assinaturas ativas
    const activeSubscriptions = (plan as any)._count?.subscriptions || 0;
    
    if (activeSubscriptions > 0) {
      // Apenas desativar, não deletar
      const updated = await prisma.plan.update({
        where: { id },
        data: { active: false },
      });

      await createAuditLog({
        action: "PLAN_DEACTIVATED",
        entity: "Plan",
        entityId: id,
        userId: (session.user as any).id,
        userName: (session.user as any).name,
        details: {
          reason: "Plano tem assinaturas ativas",
          activeSubscriptions,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Plano desativado (possui assinaturas ativas)",
        plan: updated,
      });
    }

    // Se não tem assinaturas, pode deletar
    await prisma.plan.delete({ where: { id } });

    await createAuditLog({
      action: "PLAN_DELETED",
      entity: "Plan",
      entityId: id,
      userId: (session.user as any).id,
      userName: (session.user as any).name,
      details: { name: plan.name },
    });

    return NextResponse.json({
      success: true,
      message: "Plano excluído permanentemente",
    });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
