import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

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
    const tipo = searchParams.get("tipo") || "geral";
    const tenantIdParam = searchParams.get("tenantId");

    const tenantId = user.role === "SUPER_ADMIN" ? tenantIdParam : user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não especificado" }, { status: 400 });
    }

    let relatorio: any = {};

    if (tipo === "geral" || tipo === "resumo") {
      // Totais gerais
      const totalMPs = await prisma.materiaPrima.count({ where: { tenantId } });
      const totalLotes = await prisma.lote.count({ where: { tenantId } });
      const totalFornecedores = await prisma.fornecedor.count({ where: { tenantId } });

      // Por status de MP
      const mpsPorStatus = await prisma.materiaPrima.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { id: true },
      });

      // Por status de lote
      const lotesPorStatus = await prisma.lote.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { id: true },
      });

      // Lotes próximos do vencimento (30 dias)
      const dataLimite30 = new Date();
      dataLimite30.setDate(dataLimite30.getDate() + 30);
      const lotesVencendo30 = await prisma.lote.count({
        where: {
          tenantId,
          dataValidade: { lte: dataLimite30 },
          status: { notIn: ["VENCIDO", "ESGOTADO", "REPROVADO"] },
        },
      });

      // Lotes vencidos
      const lotesVencidos = await prisma.lote.count({
        where: {
          tenantId,
          dataValidade: { lt: new Date() },
          status: { not: "VENCIDO" },
        },
      });

      relatorio = {
        tipo: "resumo",
        totais: {
          materiasPrimas: totalMPs,
          lotes: totalLotes,
          fornecedores: totalFornecedores,
        },
        materiasPrimasPorStatus: mpsPorStatus.map((s) => ({
          status: s.status,
          quantidade: s._count.id,
        })),
        lotesPorStatus: lotesPorStatus.map((s) => ({
          status: s.status,
          quantidade: s._count.id,
        })),
        alertas: {
          lotesVencendo30Dias: lotesVencendo30,
          lotesVencidos,
        },
      };
    }

    if (tipo === "fornecedor") {
      const fornecedorId = searchParams.get("fornecedorId");

      if (fornecedorId) {
        // Relatório de fornecedor específico
        const fornecedor = await prisma.fornecedor.findUnique({
          where: { id: fornecedorId },
          include: {
            materiasPrimas: {
              select: { id: true, codigo: true, nome: true, status: true },
            },
            lotes: {
              select: {
                id: true,
                numeroLote: true,
                status: true,
                dataValidade: true,
                quantidade: true,
                quantidadeAtual: true,
                materiaPrima: { select: { nome: true } },
              },
              orderBy: { dataValidade: "asc" },
            },
          },
        });

        if (!fornecedor || fornecedor.tenantId !== tenantId) {
          return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });
        }

        relatorio = {
          tipo: "fornecedor",
          fornecedor,
        };
      } else {
        // Relatório de todos os fornecedores
        const fornecedores = await prisma.fornecedor.findMany({
          where: { tenantId },
          include: {
            _count: { select: { materiasPrimas: true, lotes: true } },
          },
          orderBy: { nome: "asc" },
        });

        relatorio = {
          tipo: "fornecedores",
          fornecedores: fornecedores.map((f) => ({
            id: f.id,
            nome: f.nome,
            cnpj: f.cnpj,
            ativo: f.ativo,
            totalMateriasPrimas: f._count.materiasPrimas,
            totalLotes: f._count.lotes,
          })),
        };
      }
    }

    if (tipo === "vencimento") {
      const dias = parseInt(searchParams.get("dias") || "30");
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + dias);

      const lotes = await prisma.lote.findMany({
        where: {
          tenantId,
          dataValidade: { lte: dataLimite },
          status: { notIn: ["VENCIDO", "ESGOTADO", "REPROVADO"] },
        },
        include: {
          materiaPrima: { select: { codigo: true, nome: true, unidadeMedida: true } },
          fornecedor: { select: { nome: true } },
        },
        orderBy: { dataValidade: "asc" },
      });

      relatorio = {
        tipo: "vencimento",
        periodo: `${dias} dias`,
        lotes: lotes.map((l) => ({
          id: l.id,
          numeroLote: l.numeroLote,
          materiaPrima: l.materiaPrima.nome,
          codigoMP: l.materiaPrima.codigo,
          fornecedor: l.fornecedor?.nome || "N/A",
          dataValidade: l.dataValidade,
          quantidadeAtual: l.quantidadeAtual,
          unidade: l.materiaPrima.unidadeMedida,
          status: l.status,
          diasParaVencer: Math.ceil((l.dataValidade.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        })),
      };
    }

    if (tipo === "estoque") {
      const materiasPrimas = await prisma.materiaPrima.findMany({
        where: { tenantId, status: "ATIVO" },
        include: {
          lotes: {
            where: { status: { in: ["APROVADO", "EM_USO"] } },
            select: { quantidadeAtual: true },
          },
          fornecedor: { select: { nome: true } },
        },
        orderBy: { nome: "asc" },
      });

      relatorio = {
        tipo: "estoque",
        materiasPrimas: materiasPrimas.map((mp) => {
          const estoqueAtual = mp.lotes.reduce((acc, l) => acc + l.quantidadeAtual, 0);
          return {
            id: mp.id,
            codigo: mp.codigo,
            nome: mp.nome,
            unidadeMedida: mp.unidadeMedida,
            fornecedor: mp.fornecedor?.nome || "N/A",
            estoqueAtual,
            estoqueMinimo: mp.estoqueMinimo || 0,
            abaixoMinimo: mp.estoqueMinimo ? estoqueAtual < mp.estoqueMinimo : false,
          };
        }),
      };
    }

    return NextResponse.json({ relatorio });
  } catch (error: any) {
    console.error("Error generating relatorio:", error);
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 });
  }
}
