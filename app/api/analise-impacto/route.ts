/**
 * API Análise de Impacto POP
 * POST /api/analise-impacto - Analisar impacto de norma nos POPs
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { normaId, normaNumero, normaTitulo, normaCategorias } = await request.json();
    const { prisma } = require("@/lib/prisma");
    const user = session.user as any;
    const tenantId = user.tenantId;

    // Buscar todos os POPs do tenant
    const pops = await prisma.pop.findMany({
      where: { tenantId },
      select: {
        id: true,
        codigo: true,
        titulo: true,
        setor: true,
        objetivo: true,
        descricao: true,
      },
    });

    // Análise de impacto simplificada (IA simulada)
    const analises = pops.map((pop: any) => {
      // Calcular score de impacto baseado em palavras-chave
      const textoPop = `${pop.titulo} ${pop.objetivo} ${pop.descricao}`.toLowerCase();
      const categoriasNorma = normaCategorias.map((c: string) => c.toLowerCase());
      
      let score = 0;
      let motivos: string[] = [];

      // Verificar match de categorias
      categoriasNorma.forEach((cat: string) => {
        if (textoPop.includes(cat)) {
          score += 25;
          motivos.push(`Menciona "${cat}"`);
        }
      });

      // Palavras-chave de alto impacto
      const palavrasChave = [
        "manipulação", "controle", "qualidade", "validação",
        "estéril", "limpo", "risco", "segurança"
      ];
      
      palavrasChave.forEach((palavra) => {
        if (textoPop.includes(palavra)) {
          score += 15;
        }
      });

      // Cap score em 100
      score = Math.min(score, 100);

      // Classificar nível
      let nivel: "CRITICO" | "ALTO" | "MEDIO" | "BAIXO" | "NENHUM";
      if (score >= 75) nivel = "CRITICO";
      else if (score >= 50) nivel = "ALTO";
      else if (score >= 25) nivel = "MEDIO";
      else if (score > 0) nivel = "BAIXO";
      else nivel = "NENHUM";

      // Ações recomendadas
      const acoes: string[] = [];
      if (nivel === "CRITICO") {
        acoes.push("Revisão completa do POP urgente");
        acoes.push("Treinamento emergencial da equipe");
        acoes.push("Atualização de documentação");
      } else if (nivel === "ALTO") {
        acoes.push("Revisão do POP recomendada");
        acoes.push("Verificar procedimentos afetados");
      } else if (nivel === "MEDIO") {
        acoes.push("Monitorar implementação da norma");
      }

      return {
        popId: pop.id,
        popCodigo: pop.codigo,
        popTitulo: pop.titulo,
        popSetor: pop.setor,
        score,
        nivel,
        motivos: motivos.length > 0 ? motivos : ["Sem correspondência direta"],
        acoes,
      };
    });

    // Ordenar por score decrescente
    analises.sort((a: any, b: any) => b.score - a.score);

    // Calcular estatísticas
    const estatisticas = {
      totalPops: pops.length,
      critico: analises.filter((a: any) => a.nivel === "CRITICO").length,
      alto: analises.filter((a: any) => a.nivel === "ALTO").length,
      medio: analises.filter((a: any) => a.nivel === "MEDIO").length,
      baixo: analises.filter((a: any) => a.nivel === "BAIXO").length,
      nenhum: analises.filter((a: any) => a.nivel === "NENHUM").length,
    };

    return NextResponse.json({
      norma: {
        id: normaId,
        numero: normaNumero,
        titulo: normaTitulo,
      },
      analises,
      estatisticas,
      resumo: `${estatisticas.critico} POPs críticos, ${estatisticas.alto} alto impacto, ${estatisticas.medio} médio impacto`,
    });
  } catch (error: any) {
    console.error("Erro na análise:", error);
    return NextResponse.json(
      { error: error.message || "Erro na análise" },
      { status: 500 }
    );
  }
}
