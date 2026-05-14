import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { nome, cnpj, responsavel, email, telefone, endereco } = data;

    const normalizedNome = typeof nome === "string" ? nome.trim() : "";
    const normalizedCnpj = typeof cnpj === "string" ? cnpj.trim() : "";
    const normalizedResponsavel = typeof responsavel === "string" ? responsavel.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedTelefone = typeof telefone === "string" ? telefone.trim() : "";
    const normalizedEndereco = typeof endereco === "string" ? endereco.trim() : "";
    const enderecoForDb = JSON.stringify(normalizedEndereco);

    // Validate required fields
    if (!normalizedNome || !normalizedCnpj || !normalizedResponsavel || !normalizedEmail || !normalizedTelefone || !normalizedEndereco) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Check if CNPJ already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: { cnpj: normalizedCnpj },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "Já existe uma farmácia cadastrada com este CNPJ" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.tenant.findFirst({
      where: { email: normalizedEmail },
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
        nome: normalizedNome,
        cnpj: normalizedCnpj,
        responsavel: normalizedResponsavel,
        email: normalizedEmail,
        telefone: normalizedTelefone,
        endereco: enderecoForDb,
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
      details: { nome: normalizedNome, cnpj: normalizedCnpj, email: normalizedEmail },
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
