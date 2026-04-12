import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { maskCPF } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    if (!user.tenantId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const funcao = searchParams.get("funcao");
    const setor = searchParams.get("setor");
    const status = searchParams.get("status");
    const tenantIdParam = searchParams.get("tenantId");

    const tenantId = user.role === "SUPER_ADMIN" ? tenantIdParam : user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não especificado" }, { status: 400 });
    }

    const where: any = { tenantId };
    if (funcao) where.funcao = funcao;
    if (setor) where.setor = setor;
    if (status) where.status = status;

    const colaboradores = await prisma.colaborador.findMany({
      where,
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ colaboradores });
  } catch (error: any) {
    console.error("Error fetching colaboradores:", error);
    return NextResponse.json({ error: "Erro ao buscar colaboradores" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    // Check permissions
    if (!["SUPER_ADMIN", "ADMIN_FARMACIA", "RT"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!user.tenantId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
    }

    const data = await request.json();
    const { nome, cpf, funcao, setor, dataAdmissao, email } = data;

    // Validate required fields
    if (!nome || !cpf || !funcao || !setor || !dataAdmissao) {
      return NextResponse.json({ error: "Todos os campos obrigatórios devem ser preenchidos" }, { status: 400 });
    }

    const tenantId = data.tenantId || user.tenantId;

    // Hash CPF for storage and comparison
    const cleanCpf = cpf.replace(/[^\d]/g, "");
    const cpfHash = await bcrypt.hash(cleanCpf, 10);
    const cpfMasked = maskCPF(cleanCpf);

    // Check if CPF already exists for this tenant (by comparing hashes)
    const existingColaboradores = await prisma.colaborador.findMany({
      where: { tenantId },
    });

    for (const colab of existingColaboradores) {
      const match = await bcrypt.compare(cleanCpf, colab.cpfHash);
      if (match) {
        return NextResponse.json({ error: "Já existe um colaborador com este CPF" }, { status: 400 });
      }
    }

    const colaborador = await prisma.colaborador.create({
      data: {
        nome,
        cpfHash,
        cpfMasked,
        funcao,
        setor,
        dataAdmissao: new Date(dataAdmissao),
        email: email || null,
        tenantId,
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.COLABORADOR_CREATED,
      entity: "Colaborador",
      entityId: colaborador.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { nome, funcao, setor },
    });

    return NextResponse.json({ success: true, colaborador });
  } catch (error: any) {
    console.error("Error creating colaborador:", error);
    return NextResponse.json({ error: "Erro ao criar colaborador" }, { status: 500 });
  }
}
