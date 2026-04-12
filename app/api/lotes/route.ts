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
    const materiaPrimaId = searchParams.get("materiaPrimaId");
    const fornecedorId = searchParams.get("fornecedorId");
    const vencendo = searchParams.get("vencendo"); // dias
    const tenantIdParam = searchParams.get("tenantId");

    const tenantId = user.role === "SUPER_ADMIN" ? tenantIdParam : user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não especificado" }, { status: 400 });
    }

    const where: any = { tenantId };
    if (status) where.status = status;
    if (materiaPrimaId) where.materiaPrimaId = materiaPrimaId;
    if (fornecedorId) where.fornecedorId = fornecedorId;
    if (search) {
      where.OR = [
        { numeroLote: { contains: search, mode: "insensitive" } },
        { loteInterno: { contains: search, mode: "insensitive" } },
        { notaFiscal: { contains: search, mode: "insensitive" } },
      ];
    }
    if (vencendo) {
      const dias = parseInt(vencendo);
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + dias);
      where.dataValidade = { lte: dataLimite };
      where.status = { notIn: ["VENCIDO", "ESGOTADO", "REPROVADO"] };
    }

    const lotes = await prisma.lote.findMany({
      where,
      include: {
        materiaPrima: { select: { id: true, codigo: true, nome: true, unidadeMedida: true } },
        fornecedor: { select: { id: true, nome: true } },
      },
      orderBy: { dataValidade: "asc" },
    });

    return NextResponse.json({ lotes });
  } catch (error: any) {
    console.error("Error fetching lotes:", error);
    return NextResponse.json({ error: "Erro ao buscar lotes" }, { status: 500 });
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
      numeroLote,
      loteInterno,
      dataFabricacao,
      dataValidade,
      dataRecebimento,
      quantidade,
      precoUnitario,
      notaFiscal,
      certificadoUrl,
      certificadoNome,
      certificadoPublic,
      laudoUrl,
      laudoNome,
      laudoPublic,
      analises,
      observacoes,
      status: loteStatus,
      materiaPrimaId,
      fornecedorId,
    } = data;

    if (!numeroLote || !dataValidade || !dataRecebimento || !quantidade || !materiaPrimaId) {
      return NextResponse.json(
        { error: "Número do lote, validade, recebimento, quantidade e matéria-prima são obrigatórios" },
        { status: 400 }
      );
    }

    const tenantId = data.tenantId || user.tenantId;

    // Verify materia-prima belongs to tenant
    const materiaPrima = await prisma.materiaPrima.findUnique({ where: { id: materiaPrimaId } });
    if (!materiaPrima || materiaPrima.tenantId !== tenantId) {
      return NextResponse.json({ error: "Matéria-prima não encontrada" }, { status: 404 });
    }

    // Check for duplicate lote
    const existingLote = await prisma.lote.findFirst({
      where: { tenantId, numeroLote, materiaPrimaId },
    });

    if (existingLote) {
      return NextResponse.json(
        { error: "Já existe um lote com este número para esta matéria-prima" },
        { status: 400 }
      );
    }

    const qtd = parseFloat(quantidade);

    const lote = await prisma.lote.create({
      data: {
        numeroLote,
        loteInterno: loteInterno || null,
        dataFabricacao: dataFabricacao ? new Date(dataFabricacao) : null,
        dataValidade: new Date(dataValidade),
        dataRecebimento: new Date(dataRecebimento),
        quantidade: qtd,
        quantidadeAtual: qtd,
        precoUnitario: precoUnitario ? parseFloat(precoUnitario) : null,
        notaFiscal: notaFiscal || null,
        certificadoUrl: certificadoUrl || null,
        certificadoNome: certificadoNome || null,
        certificadoPublic: certificadoPublic || false,
        laudoUrl: laudoUrl || null,
        laudoNome: laudoNome || null,
        laudoPublic: laudoPublic || false,
        analises: analises || null,
        observacoes: observacoes || null,
        status: loteStatus || "QUARENTENA",
        materiaPrimaId,
        fornecedorId: fornecedorId || null,
        tenantId,
      },
      include: {
        materiaPrima: { select: { id: true, codigo: true, nome: true } },
        fornecedor: { select: { id: true, nome: true } },
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.LOTE_CREATED,
      entity: "Lote",
      entityId: lote.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { numeroLote, materiaPrima: materiaPrima.nome, quantidade: qtd },
    });

    return NextResponse.json({ success: true, lote });
  } catch (error: any) {
    console.error("Error creating lote:", error);
    return NextResponse.json({ error: "Erro ao criar lote" }, { status: 500 });
  }
}
