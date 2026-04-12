import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { nome, cnpj, responsavel, email, telefone, endereco } = data;

    // Validate required fields
    if (!nome || !cnpj || !responsavel || !email || !telefone || !endereco) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Check if CNPJ already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { cnpj },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "Já existe uma farmácia cadastrada com este CNPJ" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.tenant.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Já existe uma farmácia cadastrada com este email" },
        { status: 400 }
      );
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create tenant with PENDENTE status
    const tenant = await prisma.tenant.create({
      data: {
        nome,
        cnpj,
        responsavel,
        email,
        telefone,
        endereco,
        status: "PENDENTE",
        subscriptionStatus: "TRIAL",
        trialEndsAt,
      },
    });

    // Create audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.TENANT_CREATED,
      entity: "Tenant",
      entityId: tenant.id,
      details: { nome, cnpj, email },
    });

    return NextResponse.json({
      success: true,
      message: "Cadastro realizado com sucesso. Aguardando aprovação.",
      tenant: {
        id: tenant.id,
        nome: tenant.nome,
        status: tenant.status,
      },
    });
  } catch (error: any) {
    console.error("Cadastro error:", error);
    return NextResponse.json(
      { error: "Erro ao realizar cadastro" },
      { status: 500 }
    );
  }
}
