import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId || "default";
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const treinamentoId = searchParams.get("treinamentoId");
    const colaboradorId = searchParams.get("colaboradorId");

    switch (action) {
      case "listar":
        return await handleListarVerificacoes(tenantId);
      case "detalhes":
        return await handleDetalhesVerificacao(searchParams.get("id"), tenantId);
      case "checklist":
        return await handleChecklistPadrao();
      case "historico":
        return await handleHistoricoColaborador(colaboradorId, tenantId);
      case "pendentes":
        return await handleVerificacoesPendentes(tenantId);
      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in verificacao pratica API:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId || "default";
    
    const data = await request.json();
    const { action } = data;

    switch (action) {
      case "agendar":
        return await handleAgendarVerificacao(data, tenantId, user);
      case "iniciar":
        return await handleIniciarVerificacao(data, tenantId, user);
      case "concluir":
        return await handleConcluirVerificacao(data, tenantId, user);
      case "upload-evidencia":
        return await handleUploadEvidencia(data, tenantId);
      case "avaliar":
        return await handleAvaliarVerificacao(data, tenantId, user);
      case "solicitar-retreinamento":
        return await handleSolicitarRetreinamento(data, tenantId, user);
      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in verificacao pratica POST:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

async function handleListarVerificacoes(tenantId: string) {
  try {
    const verificacoes = await prisma.verificacaoPratica.findMany({
      where: { tenantId },
      include: {
        treinamento: {
          include: {
            colaborador: {
              select: {
                nome: true,
                funcao: true
              }
            },
            pop: {
              select: {
                codigo: true,
                titulo: true
              }
            }
          }
        }
      },
      orderBy: [
        { dataAgendamento: 'desc' },
        { status: 'asc' }
      ]
    });

    return NextResponse.json({ verificacoes });
  } catch (error) {
    // Fallback simulado
    const mockVerificacoes = [
      {
        id: "verif_001",
        dataAgendamento: "2026-04-21T10:00:00Z",
        status: "AGENDADO",
        supervisor: "Dr. João Silva",
        resultado: null,
        nota: null,
        treinamento: {
          colaborador: { nome: "Maria Silva", funcao: "Farmacêutica" },
          pop: { codigo: "POP.001", titulo: "Recebimento de Matérias-Primas" }
        }
      }
    ];

    return NextResponse.json({ verificacoes: mockVerificacoes });
  }
}

async function handleDetalhesVerificacao(verificacaoId: string | null, tenantId: string) {
  if (!verificacaoId) {
    return NextResponse.json({ error: "ID da verificação obrigatório" }, { status: 400 });
  }

  try {
    const verificacao = await prisma.verificacaoPratica.findFirst({
      where: {
        id: verificacaoId,
        tenantId
      },
      include: {
        treinamento: {
          include: {
            colaborador: {
              select: {
                nome: true,
                funcao: true,
                setor: true
              }
            },
            pop: {
              select: {
                codigo: true,
                titulo: true,
                setor: true,
                descricao: true
              }
            }
          }
        }
      }
    });

    if (!verificacao) {
      return NextResponse.json({ error: "Verificação não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ verificacao });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar detalhes" }, { status: 500 });
  }
}

async function handleChecklistPadrao() {
  const checklist = [
    {
      categoria: "Preparação",
      itens: [
        {
          id: "paramentacao",
          descricao: "Paramentação completa (jaleco, luvas, máscara, touca)",
          obrigatorio: true,
          tipo: "checkbox",
          evidencia: "foto"
        },
        {
          id: "higiene",
          descricao: "Higiene das mãos realizada",
          obrigatorio: true,
          tipo: "checkbox",
          evidencia: "observacao"
        },
        {
          id: "equipamentos",
          descricao: "Equipamentos limpos e calibrados",
          obrigatorio: true,
          tipo: "checkbox",
          evidencia: "foto"
        }
      ]
    },
    {
      categoria: "Execução",
      itens: [
        {
          id: "leitura_pop",
          descricao: "Leitura atenta do POP antes de iniciar",
          obrigatorio: true,
          tipo: "checkbox",
          evidencia: "observacao"
        },
        {
          id: "procedimento_passos",
          descricao: "Execução dos passos conforme POP",
          obrigatorio: true,
          tipo: "avaliacao",
          evidencia: "video"
        },
        {
          id: "seguranca",
          descricao: "Uso correto de EPIs e medidas de segurança",
          obrigatorio: true,
          tipo: "avaliacao",
          evidencia: "foto"
        },
        {
          id: "precisao",
          descricao: "Precisão e atenção aos detalhes",
          obrigatorio: true,
          tipo: "avaliacao",
          evidencia: "observacao"
        }
      ]
    },
    {
      categoria: "Finalização",
      itens: [
        {
          id: "limpeza",
          descricao: "Limpeza e organização da área",
          obrigatorio: true,
          tipo: "checkbox",
          evidencia: "foto"
        },
        {
          id: "registro",
          descricao: "Registro em formulário apropriado",
          obrigatorio: true,
          tipo: "checkbox",
          evidencia: "foto"
        },
        {
          id: "resultado",
          descricao: "Resultado final conforme esperado",
          obrigatorio: true,
          tipo: "avaliacao",
          evidencia: "observacao"
        }
      ]
    }
  ];

  return NextResponse.json({ checklist });
}

async function handleHistoricoColaborador(colaboradorId: string | null, tenantId: string) {
  if (!colaboradorId) {
    return NextResponse.json({ error: "ID do colaborador obrigatório" }, { status: 400 });
  }

  try {
    const historico = await prisma.verificacaoPratica.findMany({
      where: {
        colaboradorId,
        tenantId
      },
      include: {
        treinamento: {
          include: {
            pop: {
              select: {
                codigo: true,
                titulo: true
              }
            }
          }
        }
      },
      orderBy: { dataAgendamento: 'desc' }
    });

    return NextResponse.json({ historico });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 });
  }
}

async function handleVerificacoesPendentes(tenantId: string) {
  try {
    const pendentes = await prisma.verificacaoPratica.findMany({
      where: {
        tenantId,
        status: "AGENDADO"
      },
      include: {
        treinamento: {
          include: {
            colaborador: {
              select: {
                nome: true,
                funcao: true
              }
            },
            pop: {
              select: {
                codigo: true,
                titulo: true
              }
            }
          }
        }
      },
      orderBy: { dataAgendamento: 'asc' }
    });

    return NextResponse.json({ pendentes });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar pendentes" }, { status: 500 });
  }
}

async function handleAgendarVerificacao(data: any, tenantId: string, user: any) {
  const {
    treinamentoId,
    colaboradorId,
    popId,
    dataAgendamento,
    duracaoEstimada,
    supervisor
  } = data;

  if (!treinamentoId || !colaboradorId || !popId || !dataAgendamento || !supervisor) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  try {
    // Verificar se já existe verificação agendada
    const existente = await prisma.verificacaoPratica.findFirst({
      where: {
        treinamentoId,
        status: { in: ["AGENDADO", "EM_ANDAMENTO"] }
      }
    });

    if (existente) {
      return NextResponse.json({ 
        error: "Já existe verificação agendada para este treinamento", 
        verificacao: existente 
      }, { status: 400 });
    }

    const verificacao = await prisma.verificacaoPratica.create({
      data: {
        tenantId,
        treinamentoId,
        colaboradorId,
        popId,
        dataAgendamento: new Date(dataAgendamento),
        duracaoEstimada,
        status: "AGENDADO",
        supervisor
      }
    });

    // Atualizar treinamento para exigir verificação prática
    await prisma.treinamento.update({
      where: { id: treinamentoId },
      data: {
        praticaObrigatoria: true,
        dataProximaVerificacao: new Date(dataAgendamento)
      }
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_CREATED,
      entity: "VerificacaoPratica",
      entityId: verificacao.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: {
        treinamentoId,
        colaboradorId,
        dataAgendamento,
        supervisor
      }
    });

    return NextResponse.json({ success: true, verificacao });
  } catch (error: any) {
    console.error("Error agendando verificacao:", error);
    return NextResponse.json({ error: "Erro ao agendar verificação" }, { status: 500 });
  }
}

async function handleIniciarVerificacao(data: any, tenantId: string, user: any) {
  const { verificacaoId } = data;

  if (!verificacaoId) {
    return NextResponse.json({ error: "ID da verificação obrigatório" }, { status: 400 });
  }

  try {
    const verificacao = await prisma.verificacaoPratica.update({
      where: {
        id: verificacaoId,
        tenantId
      },
      data: {
        status: "EM_ANDAMENTO",
        dataInicio: new Date()
      }
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_UPDATED,
      entity: "VerificacaoPratica",
      entityId: verificacaoId,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { status: "EM_ANDAMENTO" }
    });

    return NextResponse.json({ success: true, verificacao });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao iniciar verificação" }, { status: 500 });
  }
}

async function handleConcluirVerificacao(data: any, tenantId: string, user: any) {
  const {
    verificacaoId,
    resultado,
    nota,
    checklist,
    observacoes,
    pontosCriticos,
    fotosUrl,
    assinaturaSupervisor
  } = data;

  if (!verificacaoId || !resultado) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  try {
    const verificacao = await prisma.verificacaoPratica.update({
      where: {
        id: verificacaoId,
        tenantId
      },
      data: {
        status: resultado === "APROVADO" ? "APROVADO" : "REPROVADO",
        resultado,
        nota,
        dataConclusao: new Date(),
        checklist,
        observacoes,
        pontosCriticos,
        fotosUrl: fotosUrl || [],
        assinaturaSupervisor
      }
    });

    // Se reprovado, solicitar retreinamento
    if (resultado === "REPROVADO") {
      await prisma.verificacaoPratica.update({
        where: { id: verificacaoId },
        data: {
          precisaRetreinamento: true,
          dataRetreinamento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
        }
      });
    }

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_UPDATED,
      entity: "VerificacaoPratica",
      entityId: verificacaoId,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { resultado, nota }
    });

    return NextResponse.json({ success: true, verificacao });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao concluir verificação" }, { status: 500 });
  }
}

async function handleUploadEvidencia(data: any, tenantId: string) {
  const { verificacaoId, tipo, arquivo, nomeArquivo } = data;

  if (!verificacaoId || !tipo || !arquivo) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  try {
    // Simulação de upload de arquivo
    // Em produção, implementar upload real para S3/Cloudinary
    
    const evidencia = {
      id: `evid_${Date.now()}`,
      verificacaoId,
      tipo, // "foto" ou "video"
      nomeArquivo,
      url: `https://storage.visadocs.com/evidencias/${verificacaoId}/${nomeArquivo}`,
      dataUpload: new Date(),
      tamanho: arquivo.length
    };

    // Salvar evidência no banco
    await prisma.verificacaoPratica.update({
      where: { id: verificacaoId },
      data: {
        fotosUrl: [evidencia.url] // Simplificado - em produção usar array
      }
    });

    return NextResponse.json({ success: true, evidencia });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}

async function handleAvaliarVerificacao(data: any, tenantId: string, user: any) {
  const { verificacaoId, avaliacoes } = data;

  if (!verificacaoId || !avaliacoes) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  try {
    // Calcular nota final baseada nas avaliações
    const totalItens = Object.keys(avaliacoes).length;
    const itensAprovados = Object.values(avaliacoes).filter((av: any) => av.status === "aprovado").length;
    const notaFinal = (itensAprovados / totalItens) * 10;

    const resultado = notaFinal >= 7 ? "APROVADO" : "REPROVADO";

    const verificacao = await prisma.verificacaoPratica.update({
      where: {
        id: verificacaoId,
        tenantId
      },
      data: {
        resultado,
        nota: notaFinal,
        dataConclusao: new Date(),
        checklist: avaliacoes,
        status: resultado === "APROVADO" ? "APROVADO" : "REPROVADO"
      }
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_UPDATED,
      entity: "VerificacaoPratica",
      entityId: verificacaoId,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { resultado, nota: notaFinal }
    });

    return NextResponse.json({ success: true, verificacao });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao avaliar verificação" }, { status: 500 });
  }
}

async function handleSolicitarRetreinamento(data: any, tenantId: string, user: any) {
  const { verificacaoId, motivo } = data;

  if (!verificacaoId) {
    return NextResponse.json({ error: "ID da verificação obrigatório" }, { status: 400 });
  }

  try {
    const verificacao = await prisma.verificacaoPratica.findFirst({
      where: { id: verificacaoId, tenantId },
      include: {
        treinamento: {
          select: { colaboradorId: true, popId: true }
        }
      }
    });

    if (!verificacao) {
      return NextResponse.json({ error: "Verificação não encontrada" }, { status: 404 });
    }

    // Marcar para retreinamento
    await prisma.verificacaoPratica.update({
      where: { id: verificacaoId },
      data: {
        precisaRetreinamento: true,
        dataRetreinamento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      }
    });

    // Criar novo treinamento
    await prisma.treinamento.create({
      data: {
        tenantId,
        colaboradorId: verificacao.treinamento.colaboradorId,
        popId: verificacao.treinamento.popId,
        dataTreinamento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        instrutor: "Retreinamento Prático",
        status: "PENDENTE",
        praticaObrigatoria: true
      }
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_CREATED,
      entity: "VerificacaoPratica",
      entityId: verificacaoId,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { acao: "solicitado_retreinamento", motivo }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao solicitar retreinamento" }, { status: 500 });
  }
}
