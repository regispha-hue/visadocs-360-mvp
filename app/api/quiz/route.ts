// app/api/quiz/route.ts
// API para geraÃ§Ã£o e avaliaÃ§Ã£o de quizzes para POPs

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callAI } from "@/lib/ai-router";

export const dynamic = "force-dynamic";

// GET - Buscar quiz existente ou gerar novo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const popId = searchParams.get("popId");
    const quizId = searchParams.get("quizId");

    if (!popId && !quizId) {
      return NextResponse.json(
        { error: "popId ou quizId Ã© obrigatÃ³rio" },
        { status: 400 }
      );
    }

    // Se tem quizId, buscar quiz existente
    if (quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questoes: {
            include: {
              alternativas: true,
            },
          },
        },
      });

      if (!quiz) {
        return NextResponse.json(
          { error: "Quiz nÃ£o encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({ quiz });
    }

    // Verificar se jÃ¡ existe quiz para este POP
    let quiz = await prisma.quiz.findFirst({
      where: { popId: popId! },
      include: {
        questoes: {
          include: {
            alternativas: true,
          },
        },
      },
    });

    // Se nÃ£o existe, gerar novo via IA
    if (!quiz) {
      const pop = await prisma.pop.findUnique({
        where: { id: popId! },
      });

      if (!pop) {
        return NextResponse.json(
          { error: "POP nÃ£o encontrado" },
          { status: 404 }
        );
      }

      // Gerar quiz via IA
      const quizData = await generateQuizWithAI(pop);
      
      // Salvar no banco
    // @ts-ignore
      quiz = await prisma.quiz.create({
        data: {
          popId: popId!,
          titulo: `Quiz - ${pop.titulo}`,
          descricao: `AvaliaÃ§Ã£o de conhecimento sobre ${pop.titulo}`,
          notaMinima: 70,
    // @ts-ignore
          tempoLimite: 30, // minutos
          ativo: true,
          questoes: {
            create: quizData.questoes.map((q: any, idx: number) => ({
              enunciado: q.pergunta,
              ordem: idx,
              alternativas: {
                create: q.alternativas.map((a: any) => ({
                  texto: a.texto,
                  correta: a.correta,
                })),
              },
            })),
          },
        },
        include: {
          questoes: {
            include: {
              alternativas: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ quiz });

  } catch (error: any) {
    console.error("Erro ao buscar quiz:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// POST - Submeter respostas e avaliar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      quizId, 
      respostas, 
      tempoGasto,
      tenantId 
    } = body;

    if (!quizId || !respostas || !tenantId) {
      return NextResponse.json(
        { error: "quizId, respostas e tenantId sÃ£o obrigatÃ³rios" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Buscar quiz com questÃµes e alternativas corretas
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        pop: true,
        questoes: {
          include: {
            alternativas: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz nÃ£o encontrado" },
        { status: 404 }
      );
    }

    // Calcular resultado
    let acertos = 0;
    const detalhesRespostas: any[] = [];

    quiz.questoes.forEach((questao) => {
      const respostaId = respostas[questao.id];
      const alternativa = questao.alternativas.find((a) => a.id === respostaId);
      const correta = alternativa?.correta || false;
      
      if (correta) acertos++;

      detalhesRespostas.push({
        questaoId: questao.id,
    // @ts-ignore
        enunciado: questao.enunciado,
        respostaId,
        respostaTexto: alternativa?.texto,
        correta,
        alternativaCorreta: questao.alternativas.find((a) => a.correta)?.texto,
      });
    });

    const nota = Math.round((acertos / quiz.questoes.length) * 100);
    const aprovado = nota >= quiz.notaMinima;

    // Salvar tentativa
    const tentativa = await prisma.tentativaQuiz.create({
      data: {
        quizId,
        usuarioId: userId,
        tenantId,
        nota,
        aprovado,
        tempoGasto,
    // @ts-ignore
        respostas: JSON.stringify(respostas),
        detalhes: JSON.stringify(detalhesRespostas),
      },
    });

    // Se aprovado, criar/gerar certificado
    let certificado = null;
    if (aprovado) {
      // Buscar colaborador vinculado ao usuÃ¡rio
      const colaborador = await prisma.colaborador.findFirst({
        where: { 
    // @ts-ignore
          userId,
          tenantId 
        },
      });

      if (colaborador) {
        // Registrar treinamento como concluÃ­do
        const treinamento = await prisma.treinamento.findFirst({
          where: {
            colaboradorId: colaborador.id,
            popId: quiz.popId,
          },
        });

        if (treinamento) {
          await prisma.treinamento.update({
            where: { id: treinamento.id },
            data: {
              status: "CONCLUIDO",
    // @ts-ignore
              dataConclusao: new Date(),
              notaAvaliacao: nota,
            },
          });

          // Criar certificado
    // @ts-ignore
          certificado = await (prisma.certificado as any).create({
            data: {
              treinamentoId: treinamento.id,
              colaboradorId: colaborador.id,
              popId: quiz.popId,
              tenantId,
              codigo: `CERT-${Date.now()}`,
              dataEmissao: new Date(),
              dataValidade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
              status: "ATIVO",
              hashValidacao: generateHash(),
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      resultado: {
        quizId,
        nota,
        aprovado,
        acertos,
        totalQuestoes: quiz.questoes.length,
        tempoGasto,
        detalhes: detalhesRespostas,
      },
      tentativaId: tentativa.id,
      certificadoId: certificado?.id,
      message: aprovado 
        ? "ParabÃ©ns! VocÃª foi aprovado e seu certificado foi gerado."
        : `VocÃª nÃ£o atingiu a nota mÃ­nima (${quiz.notaMinima}%). Estude mais e tente novamente.`,
    });

  } catch (error: any) {
    console.error("Erro ao submeter quiz:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// FunÃ§Ã£o para gerar quiz via IA
async function generateQuizWithAI(pop: any) {
  const prompt = `Gere um quiz de 5 questÃµes de mÃºltipla escolha sobre o seguinte POP:

TÃ­tulo: ${pop.titulo}
Objetivo: ${pop.objetivo}
DescriÃ§Ã£o: ${pop.descricao}

REGRAS:
1. QuestÃµes devem focar em pontos CRÃTICOS de seguranÃ§a
2. NÃ­vel de dificuldade: INTERMEDIÃRIO
3. Cada questÃ£o deve ter 4 alternativas (A, B, C, D)
4. Apenas 1 alternativa correta por questÃ£o
5. Incluir justificativa breve para cada resposta correta

FORMATO DE SAÃDA (JSON):
{
  "questoes": [
    {
      "pergunta": "...",
      "alternativas": [
        {"texto": "...", "correta": false},
        {"texto": "...", "correta": true},
        {"texto": "...", "correta": false},
        {"texto": "...", "correta": false}
      ],
      "justificativa": "..."
    }
  ]
}`;

  try {
    const response = await callAI(prompt, { 
      temperature: 0.7,
      maxTokens: 2000 
    });
    
    // Extrair JSON da resposta
    const cleanContent = response.content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const quizData = JSON.parse(cleanContent);
    return quizData;
  } catch (error) {
    console.error("Erro ao gerar quiz via IA:", error);
    // Retornar quiz padrÃ£o em caso de erro
    return {
      questoes: [
        {
          pergunta: `Qual o objetivo principal do ${pop.titulo}?`,
          alternativas: [
            { texto: "Padronizar o procedimento", correta: true },
            { texto: "Aumentar vendas", correta: false },
            { texto: "Reduzir custos", correta: false },
            { texto: "Eliminar funcionÃ¡rios", correta: false },
          ],
          justificativa: "POPs servem para padronizar procedimentos garantindo qualidade e seguranÃ§a.",
        },
      ],
    };
  }
}

function generateHash(): string {
  return "CERT-" + Date.now() + "-" + Math.random().toString(36).substring(2, 15);
}


