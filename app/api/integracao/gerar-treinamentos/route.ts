// app/api/integracao/gerar-treinamentos/route.ts
// API para gerar treinamentos automáticos para funcionários não cadastrados

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    const body = await request.json();
    const { inconsistencies } = body;

    if (!inconsistencies || !Array.isArray(inconsistencies)) {
      return NextResponse.json(
        { error: "Lista de inconsistências obrigatória" },
        { status: 400 }
      );
    }

    // Buscar POPs essenciais para novos colaboradores
    const popsEssenciais = await prisma.pop.findMany({
      where: {
        tenantId,
        status: "ATIVO",
        OR: [
    // @ts-ignore
          { categoria: { contains: "HIGIENE" } },
    // @ts-ignore
          { categoria: { contains: "BPF" } },
    // @ts-ignore
          { categoria: { contains: "BOAS_PRATICAS" } },
          { codigo: { contains: "POP.001" } },
          { codigo: { contains: "POP.002" } },
          { codigo: { contains: "POP.003" } },
        ],
      },
      take: 5,
    });

    if (popsEssenciais.length === 0) {
      // Se não encontrar por categoria, pegar os primeiros POPs ativos
      const popsGenericos = await prisma.pop.findMany({
        where: { tenantId, status: "ATIVO" },
        take: 3,
      });
      
      if (popsGenericos.length === 0) {
        return NextResponse.json(
          { error: "Nenhum POP ativo encontrado para criar treinamentos" },
          { status: 400 }
        );
      }
      
      popsEssenciais.push(...popsGenericos);
    }

    const treinamentosCriados: any[] = [];

    // Criar colaboradores e treinamentos
    for (const inc of inconsistencies) {
      try {
        // Verificar se já existe
        const existing = await prisma.colaborador.findFirst({
          where: {
            tenantId,
            nome: { contains: inc.nome },
          },
        });

        if (existing) continue;

        // Criar colaborador
        const colaborador = await prisma.colaborador.create({
          data: {
            tenantId,
            nome: inc.nome,
    // @ts-ignore
            cargo: inc.cargo || "Funcionário",
            status: "ATIVO",
            fonteIntegracao: "IMPORTACAO_ERP",
            observacoes: `Importado automaticamente via Integração Universal Bridge. Inconsistência detectada em ${new Date().toLocaleDateString("pt-BR")}.`,
          },
        });

        // Criar treinamentos para cada POP essencial
        for (const pop of popsEssenciais) {
          const treinamento = await prisma.treinamento.create({
            data: {
              tenantId,
              colaboradorId: colaborador.id,
              popId: pop.id,
    // @ts-ignore
              dataAgendada: new Date(),
              instrutor: "Treinamento Automático - IA",
              duracao: 60, // minutos
              observacoes: `Treinamento gerado automaticamente pela Integração Universal Bridge devido à importação do ERP.`,
              status: "PENDENTE",
            },
          });

          treinamentosCriados.push({
            colaborador: inc.nome,
            pop: pop.titulo,
            treinamentoId: treinamento.id,
          });
        }
      } catch (e) {
        console.error("Erro ao criar treinamento para:", inc.nome, e);
      }
    }

    // Criar alerta para admin
    // @ts-ignore
    await prisma.alerta.create({
      data: {
        tenantId,
        tipo: "TREINAMENTO",
        titulo: `Treinamentos automáticos gerados para ${inconsistencies.length} funcionários`,
        descricao: `A Integração Universal Bridge detectou ${inconsistencies.length} funcionários no ERP sem cadastro no Visadocs. Foram criados automaticamente ${treinamentosCriados.length} treinamentos.`,
        severidade: "MEDIA",
        status: "PENDENTE",
      },
    });

    return NextResponse.json({
      success: true,
      treinamentosCriados: treinamentosCriados.length,
      colaboradoresCriados: inconsistencies.length,
      detalhes: treinamentosCriados,
      message: `${treinamentosCriados.length} treinamentos gerados automaticamente!`,
    });

  } catch (error: any) {
    console.error("Erro ao gerar treinamentos:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
