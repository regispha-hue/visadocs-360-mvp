/**
 * API Portal Público de Fiscalização - Acesso via token (sem auth)
 * GET /api/fiscalizacao/public/[token]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Buscar token
    const tokenRecord = await prisma.tokenFiscalizacao.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    if (!tokenRecord.ativo) {
      return NextResponse.json(
        { error: "Token revogado" },
        { status: 401 }
      );
    }

    if (tokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Token expirado" },
        { status: 401 }
      );
    }

    const tenantId = tokenRecord.tenantId;

    // Log de acesso
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await prisma.acessoFiscalizacao.create({
      data: {
        tokenId: tokenRecord.id,
        ip,
        userAgent,
        pagina: "portal",
      },
    });

    // Buscar dados da farmácia
    const farmacia = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        nome: true,
        cnpj: true,
        responsavel: true,
        email: true,
        telefone: true,
        status: true,
      },
    });

    // Buscar POPs ativos por setor
    const pops = await prisma.pop.findMany({
      where: {
        tenantId,
        status: "ATIVO",
      },
      select: {
        id: true,
        codigo: true,
        titulo: true,
        setor: true,
        versao: true,
        dataRevisao: true,
        responsavel: true,
        validadoEm: true,
        implantadoEm: true,
      },
      orderBy: { setor: "asc" },
    });

    // Agrupar POPs por setor
    const popsPorSetor: Record<string, typeof pops> = {};
    pops.forEach((pop) => {
      if (!popsPorSetor[pop.setor]) {
        popsPorSetor[pop.setor] = [];
      }
      popsPorSetor[pop.setor].push(pop);
    });

    // Buscar colaboradores e treinamentos
    const colaboradores = await prisma.colaborador.findMany({
      where: {
        tenantId,
        status: "ATIVO",
      },
      select: {
        id: true,
        nome: true,
        funcao: true,
        setor: true,
        dataAdmissao: true,
      },
      orderBy: { nome: "asc" },
    });

    // Buscar treinamentos concluídos
    const treinamentos = await prisma.treinamento.findMany({
      where: {
        tenantId,
        status: "CONCLUIDO",
      },
      select: {
        id: true,
        colaboradorId: true,
        popId: true,
        dataTreinamento: true,
        notaQuiz: true,
        aprovadoQuiz: true,
      },
    });

    // Certificados válidos
    const certificados = treinamentos
      .filter((t) => t.aprovadoQuiz)
      .map((t) => ({
        colaboradorId: t.colaboradorId,
        popId: t.popId,
        data: t.dataTreinamento,
        nota: t.notaQuiz,
      }));

    return NextResponse.json({
      farmacia,
      popsPorSetor,
      colaboradores,
      certificados,
      totalPOPs: pops.length,
      totalColaboradores: colaboradores.length,
      totalCertificados: certificados.length,
      acessadoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro no portal de fiscalização:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
