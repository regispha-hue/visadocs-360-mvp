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
    const status = searchParams.get("status");
    const categoria = searchParams.get("categoria");
    const fornecedorId = searchParams.get("fornecedorId");
    const tenantIdParam = searchParams.get("tenantId");

    const tenantId = user.role === "SUPER_ADMIN" ? tenantIdParam : user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não especificado" }, { status: 400 });
    }

    const where: any = { tenantId };
    if (status) where.status = status;
    if (categoria) where.categoria = categoria;
    if (fornecedorId) where.fornecedorId = fornecedorId;
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: "insensitive" } },
        { nome: { contains: search, mode: "insensitive" } },
        { casNumber: { contains: search, mode: "insensitive" } },
        { dci: { contains: search, mode: "insensitive" } },
      ];
    }

    const materiasPrimas = await prisma.materiaPrima.findMany({
      where,
      include: {
        fornecedor: { select: { id: true, nome: true } },
        _count: { select: { lotes: true, pops: true } },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ materiasPrimas });
  } catch (error: any) {
    console.error("Error fetching matérias-primas:", error);
    return NextResponse.json({ error: "Erro ao buscar matérias-primas" }, { status: 500 });
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
    const {
      codigo,
      nome,
      descricao,
      casNumber,
      dci,
      categoria,
      unidadeMedida,
      estoqueMinimo,
      especificacoes,
      certificadoUrl,
      certificadoNome,
      certificadoPublic,
      fornecedorId,
      status: mpStatus,
    } = data;

    if (!codigo || !nome || !unidadeMedida) {
      return NextResponse.json(
        { error: "Código, nome e unidade de medida são obrigatórios" },
        { status: 400 }
      );
    }

    const tenantId = data.tenantId || user.tenantId;

    const existingMP = await prisma.materiaPrima.findFirst({
      where: { tenantId, codigo },
    });

    if (existingMP) {
      return NextResponse.json(
        { error: "Já existe uma matéria-prima com este código" },
        { status: 400 }
      );
    }

    const materiaPrima = await prisma.materiaPrima.create({
      data: {
        codigo,
        nome,
        descricao: descricao || null,
        casNumber: casNumber || null,
        dci: dci || null,
        categoria: categoria || null,
        unidadeMedida,
        estoqueMinimo: estoqueMinimo ? parseFloat(estoqueMinimo) : null,
        especificacoes: especificacoes || null,
        certificadoUrl: certificadoUrl || null,
        certificadoNome: certificadoNome || null,
        certificadoPublic: certificadoPublic || false,
        fornecedorId: fornecedorId || null,
        status: mpStatus || "ATIVO",
        tenantId,
      },
      include: {
        fornecedor: { select: { id: true, nome: true } },
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.MATERIA_PRIMA_CREATED,
      entity: "MateriaPrima",
      entityId: materiaPrima.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { codigo, nome, categoria },
    });

    return NextResponse.json({ success: true, materiaPrima });
  } catch (error: any) {
    console.error("Error creating matéria-prima:", error);
    return NextResponse.json({ error: "Erro ao criar matéria-prima" }, { status: 500 });
  }
}
