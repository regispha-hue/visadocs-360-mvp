import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

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
    const search = searchParams.get("search");
    const ativo = searchParams.get("ativo");
    const tenantIdParam = searchParams.get("tenantId");

    const tenantId = user.role === "SUPER_ADMIN" ? tenantIdParam : user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não especificado" }, { status: 400 });
    }

    const where: any = { tenantId };
    if (ativo !== null && ativo !== undefined) {
      where.ativo = ativo === "true";
    }
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { cnpj: { contains: search, mode: "insensitive" } },
        { contato: { contains: search, mode: "insensitive" } },
      ];
    }

    const fornecedores = await prisma.fornecedor.findMany({
      where,
      include: {
        _count: {
          select: { materiasPrimas: true, lotes: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ fornecedores });
  } catch (error: any) {
    console.error("Error fetching fornecedores:", error);
    return NextResponse.json({ error: "Erro ao buscar fornecedores" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    if (!["SUPER_ADMIN", "ADMIN_FARMACIA", "RT", "ANALISTA_CQ"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!user.tenantId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
    }

    const data = await request.json();
    const { nome, cnpj, email, telefone, endereco, contato, observacoes } = data;

    if (!nome) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const tenantId = data.tenantId || user.tenantId;

    if (cnpj) {
      const existingFornecedor = await prisma.fornecedor.findFirst({
        where: { tenantId, cnpj },
      });

      if (existingFornecedor) {
        return NextResponse.json({ error: "Já existe um fornecedor com este CNPJ" }, { status: 400 });
      }
    }

    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome,
        cnpj: cnpj || null,
        email: email || null,
        telefone: telefone || null,
        endereco: endereco || null,
        contato: contato || null,
        observacoes: observacoes || null,
        tenantId,
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.FORNECEDOR_CREATED,
      entity: "Fornecedor",
      entityId: fornecedor.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { nome, cnpj },
    });

    return NextResponse.json({ success: true, fornecedor });
  } catch (error: any) {
    console.error("Error creating fornecedor:", error);
    return NextResponse.json({ error: "Erro ao criar fornecedor" }, { status: 500 });
  }
}
