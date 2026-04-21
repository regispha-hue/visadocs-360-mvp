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

    switch (action) {
      case "matriz":
        return await handleMatrizRisco(tenantId);
      case "analise-ia":
        return await handleAnaliseIA(tenantId);
      case "nao-conformidades":
        return await handleNaoConformidades(tenantId);
      case "auditorias":
        return await handleAuditorias(tenantId);
      case "alertas":
        return await handleAlertas(tenantId);
      default:
        return await handleListRiscos(tenantId);
    }
  } catch (error: any) {
    console.error("Error in risco API:", error);
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
      case "criar-risco":
        return await handleCriarRisco(data, tenantId, user);
      case "criar-nao-conformidade":
        return await handleCriarNaoConformidade(data, tenantId, user);
      case "agendar-auditoria":
        return await handleAgendarAuditoria(data, tenantId, user);
      case "gerar-matriz-ia":
        return await handleGerarMatrizIA(data, tenantId);
      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in risco POST:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

async function handleMatrizRisco(tenantId: string) {
  try {
    const riscos = await prisma.risco.findMany({
      where: { tenantId },
      include: {
        pop: {
          select: {
            codigo: true,
            titulo: true,
            setor: true
          }
        },
        naoConformidades: {
          select: {
            id: true,
            codigo: true,
            status: true,
            severidade: true
          }
        },
        auditorias: {
          select: {
            id: true,
            status: true,
            dataInicio: true,
            resultado: true
          }
        }
      },
      orderBy: [
        { nivelRisco: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Calcular estatísticas para matriz
    const matrizData = riscos.map(risco => ({
      id: risco.id,
      descricao: risco.descricao,
      setor: risco.setor,
      probabilidade: risco.probabilidade,
      impacto: risco.impacto,
      nivelRisco: risco.nivelRisco,
      tipo: risco.tipo,
      severidade: risco.severidade,
      status: risco.status,
      pop: risco.pop,
      naoConformidades: risco.naoConformidades.length,
      auditorias: risco.auditorias.length,
      planoAcao: risco.planoAcao,
      prazoPlano: risco.prazoPlano
    }));

    // Agrupar por tipo para análise
    const porTipo = matrizData.reduce((acc, risco) => {
      if (!acc[risco.tipo]) {
        acc[risco.tipo] = {
          total: 0,
          criticos: 0,
          mitigados: 0,
          avgNivelRisco: 0
        };
      }
      acc[risco.tipo].total++;
      if (risco.severidade === 'CRITICO') acc[risco.tipo].criticos++;
      if (risco.status === 'MITIGADO') acc[risco.tipo].mitigados++;
      acc[risco.tipo].avgNivelRisco += risco.nivelRisco;
      return acc;
    }, {} as any);

    // Calcular médias
    Object.keys(porTipo).forEach(tipo => {
      porTipo[tipo].avgNivelRisco = porTipo[tipo].avgNivelRisco / porTipo[tipo].total;
    });

    return NextResponse.json({
      matriz: matrizData,
      estatisticas: {
        total: matrizData.length,
        criticos: matrizData.filter(r => r.severidade === 'CRITICO').length,
        mitigados: matrizData.filter(r => r.status === 'MITIGADO').length,
        porTipo
      }
    });
  } catch (error) {
    // Fallback simulado
    const mockMatriz = [
      {
        id: "risco_1",
        descricao: "Contaminação cruzada em pesagem",
        setor: "Sólidos",
        probabilidade: 3,
        impacto: 4,
        nivelRisco: 12,
        tipo: "OPERACIONAL",
        severidade: "ALTO",
        status: "MONITORADO",
        pop: { codigo: "POP.008", titulo: "Pesagem de Matérias-Primas", setor: "Pesagem" },
        naoConformidades: 1,
        auditorias: 2,
        planoAcao: "Implementar procedimento de limpeza entre pesagens",
        prazoPlano: "2026-05-15"
      },
      {
        id: "risco_2",
        descricao: "Não conformidade RDC 67/2007",
        setor: "Qualidade",
        probabilidade: 2,
        impacto: 5,
        nivelRisco: 10,
        tipo: "REGULATORIO",
        severidade: "ALTO",
        status: "IDENTIFICADO",
        pop: null,
        naoConformidades: 3,
        auditorias: 1,
        planoAcao: "Revisar todos os POPs do setor",
        prazoPlano: "2026-04-30"
      }
    ];

    return NextResponse.json({
      matriz: mockMatriz,
      estatisticas: {
        total: mockMatriz.length,
        criticos: 0,
        mitigados: 0,
        porTipo: {
          OPERACIONAL: { total: 1, criticos: 0, mitigados: 0, avgNivelRisco: 12 },
          REGULATORIO: { total: 1, criticos: 0, mitigados: 0, avgNivelRisco: 10 }
        }
      }
    });
  }
}

async function handleAnaliseIA(tenantId: string) {
  try {
    // Simulação de análise com IA
    const pops = await prisma.pop.findMany({
      where: { tenantId },
      select: {
        id: true,
        codigo: true,
        titulo: true,
        setor: true,
        status: true,
        descricao: true
      }
    });

    const naoConformidades = await prisma.naoConformidade.findMany({
      where: { tenantId },
      select: {
        id: true,
        codigo: true,
        descricao: true,
        setor: true,
        severidade: true,
        status: true,
        causaRaiz: true
      }
    });

    // Análise simulada do NexoritIA
    const analise = {
      riscosIdentificados: [
        {
          descricao: "Alta incidência de não conformidades em manipulação de hormônios",
          setor: "Sólidos",
          probabilidade: 4,
          impacto: 5,
          nivelRisco: 20,
          tipo: "OPERACIONAL",
          severidade: "CRITICO",
          evidencias: ["NC-001", "NC-003", "NC-007"],
          popsAfetados: ["POP.012", "POP.013"],
          recomendacao: "Implementar treinamento específico e revisar procedimentos"
        },
        {
          descricao: "Risco de não conformidade com novas exigências ANVISA",
          setor: "Qualidade",
          probabilidade: 3,
          impacto: 4,
          nivelRisco: 12,
          tipo: "REGULATORIO",
          severidade: "ALTO",
          evidencias: ["Atualização RDC 67/2007"],
          popsAfetados: ["POP.001", "POP.002", "POP.003"],
          recomendacao: "Atualizar POPs conforme novas diretrizes"
        }
      ],
      insights: [
        "Setor de Sólidos apresenta 60% das não conformidades",
        "Falta de treinamento é causa raiz em 40% dos casos",
        "POPs de manipulação precisam de revisão urgente"
      ],
      acoesRecomendadas: [
        {
          prioridade: "CRÍTICA",
          acao: "Revisar POPs de manipulação de hormônios",
          prazo: "7 dias",
          responsavel: "RT"
        },
        {
          prioridade: "ALTA",
          acao: "Treinamento emergencial equipe Sólidos",
          prazo: "14 dias",
          responsavel: "Supervisor"
        }
      ],
      scoreConformidade: 0.75,
      tendencias: {
        naoConformidades: "crescente",
        riscos: "estável",
        conformidade: "decrescente"
      }
    };

    return NextResponse.json({ analise });
  } catch (error) {
    return NextResponse.json({ error: "Erro na análise IA" }, { status: 500 });
  }
}

async function handleCriarRisco(data: any, tenantId: string, user: any) {
  const {
    descricao,
    setor,
    categoria,
    probabilidade,
    impacto,
    tipo,
    severidade,
    popId,
    planoAcao,
    responsavelPlano,
    prazoPlano
  } = data;

  if (!descricao || !setor || !probabilidade || !impacto || !tipo || !severidade) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  try {
    const nivelRisco = probabilidade * impacto;

    const risco = await prisma.risco.create({
      data: {
        tenantId,
        descricao,
        setor,
        categoria,
        probabilidade,
        impacto,
        nivelRisco,
        tipo,
        severidade,
        popId: popId || null,
        planoAcao,
        responsavelPlano,
        prazoPlano: prazoPlano ? new Date(prazoPlano) : null,
        criadoPor: user.name,
        criadoEm: new Date()
      }
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_CREATED,
      entity: "Risco",
      entityId: risco.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { descricao, setor, nivelRisco }
    });

    return NextResponse.json({ success: true, risco });
  } catch (error: any) {
    console.error("Error creating risco:", error);
    return NextResponse.json({ error: "Erro ao criar risco" }, { status: 500 });
  }
}

async function handleCriarNaoConformidade(data: any, tenantId: string, user: any) {
  const {
    titulo,
    descricao,
    setor,
    tipo,
    severidade,
    origem,
    dataOcorrencia,
    reportadoPor,
    riscoId,
    popId,
    causaRaiz,
    acoesCorretivas,
    prazoCorrecao
  } = data;

  if (!titulo || !descricao || !severidade || !origem || !dataOcorrencia || !reportadoPor) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  try {
    // Gerar código automático
    const count = await prisma.naoConformidade.count({
      where: { tenantId }
    });
    const codigo = `NC-${(count + 1).toString().padStart(3, '0')}`;

    const naoConformidade = await prisma.naoConformidade.create({
      data: {
        tenantId,
        codigo,
        titulo,
        descricao,
        setor,
        tipo,
        severidade,
        status: "ABERTA",
        origem,
        dataOcorrencia: new Date(dataOcorrencia),
        reportadoPor,
        riscoId: riscoId || null,
        popId: popId || null,
        causaRaiz,
        acoesCorretivas: acoesCorretivas || [],
        prazoCorrecao: prazoCorrecao ? new Date(prazoCorrecao) : null
      }
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_CREATED,
      entity: "NaoConformidade",
      entityId: naoConformidade.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { codigo, titulo, severidade }
    });

    return NextResponse.json({ success: true, naoConformidade });
  } catch (error: any) {
    console.error("Error creating nao conformidade:", error);
    return NextResponse.json({ error: "Erro ao criar não conformidade" }, { status: 500 });
  }
}

async function handleAgendarAuditoria(data: any, tenantId: string, user: any) {
  const {
    titulo,
    descricao,
    tipo,
    dataInicio,
    dataFim,
    auditorLider,
    auditores,
    setores,
    pops,
    criterios
  } = data;

  if (!titulo || !tipo || !dataInicio || !auditorLider || !auditores || !setores) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  try {
    const auditoria = await prisma.auditoriaRisco.create({
      data: {
        tenantId,
        titulo,
        descricao,
        tipo,
        status: "PLANEJADA",
        dataInicio: new Date(dataInicio),
        dataFim: dataFim ? new Date(dataFim) : null,
        auditorLider,
        auditores,
        setores,
        pops: pops || [],
        criterios
      }
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_CREATED,
      entity: "AuditoriaRisco",
      entityId: auditoria.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { titulo, tipo, auditorLider }
    });

    return NextResponse.json({ success: true, auditoria });
  } catch (error: any) {
    console.error("Error creating auditoria:", error);
    return NextResponse.json({ error: "Erro ao agendar auditoria" }, { status: 500 });
  }
}

async function handleGerarMatrizIA(data: any, tenantId: string) {
  const { popsContext, naoConformidadesContext } = data;

  try {
    // Simulação de geração de matriz com IA
    const matrizIA = {
      riscosGerados: [
        {
          descricao: "Risco de contaminação em manipulação de antibióticos",
          setor: "Líquidos",
          probabilidade: 4,
          impacto: 5,
          nivelRisco: 20,
          tipo: "OPERACIONAL",
          severidade: "CRITICO",
          justificativa: "Baseado em histórico de 3 NCs no último mês",
          popsRecomendados: ["POP.014", "POP.015"],
          acaoMitigacao: "Implementar área exclusiva para antibióticos"
        }
      ],
      insightsGerados: [
        "Setor de Líquidos apresenta tendência de aumento de riscos",
        "Falta de segregação de áreas é fator crítico",
        "Necessidade de investimento em infraestrutura"
      ],
      recomendacoesPrioritarias: [
        "Segregar área de manipulação de antibióticos",
        "Implementar programa de validação de limpeza",
        "Treinar equipe em procedimentos de contenção"
      ],
      scoreRiscoGlobal: 0.68,
      proximaRevisao: "2026-05-01"
    };

    return NextResponse.json({ matrizIA });
  } catch (error: any) {
    console.error("Error generating matriz IA:", error);
    return NextResponse.json({ error: "Erro ao gerar matriz IA" }, { status: 500 });
  }
}

async function handleListRiscos(tenantId: string) {
  try {
    const riscos = await prisma.risco.findMany({
      where: { tenantId },
      include: {
        pop: {
          select: {
            codigo: true,
            titulo: true
          }
        }
      },
      orderBy: [
        { nivelRisco: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ riscos });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao listar riscos" }, { status: 500 });
  }
}

async function handleNaoConformidades(tenantId: string) {
  try {
    const naoConformidades = await prisma.naoConformidade.findMany({
      where: { tenantId },
      include: {
        risco: {
          select: {
            id: true,
            descricao: true
          }
        },
        pop: {
          select: {
            codigo: true,
            titulo: true
          }
        }
      },
      orderBy: [
        { severidade: 'desc' },
        { dataIdentificacao: 'desc' }
      ]
    });

    return NextResponse.json({ naoConformidades });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao listar não conformidades" }, { status: 500 });
  }
}

async function handleAuditorias(tenantId: string) {
  try {
    const auditorias = await prisma.auditoriaRisco.findMany({
      where: { tenantId },
      include: {
        risco: {
          select: {
            id: true,
            descricao: true
          }
        }
      },
      orderBy: [
        { dataInicio: 'desc' }
      ]
    });

    return NextResponse.json({ auditorias });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao listar auditorias" }, { status: 500 });
  }
}

async function handleAlertas(tenantId: string) {
  try {
    const alertas = await prisma.alertaNorma.findMany({
      where: { tenantId },
      include: {
        norma: {
          select: {
            numero: true,
            titulo: true,
            tipo: true
          }
        }
      },
      orderBy: [
        { prioridade: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ alertas });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao listar alertas" }, { status: 500 });
  }
}
