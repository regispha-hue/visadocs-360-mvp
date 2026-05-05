// app/api/knowledge-base/route.ts
// API para Knowledge Base dinâmica de ANVISA e regulamentação
// Alimenta as skills com informações atualizadas

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Knowledge base em memória (simulação)
// Em produção, seria banco de dados com atualização automática
const KNOWLEDGE_BASE = {
  anvisa: {
    lastUpdated: "2024-01-15T10:00:00Z",
    source: "ANVISA/DOU/In.gov.br",
    categories: [
      {
        id: "rdc",
        name: "Resoluções RDC",
        description: "Resoluções da Diretoria Colegiada",
        items: [
          {
            id: "rdc-67-2007",
            code: "RDC 67/2007",
            title: "Boas Práticas de Manipulação",
            type: "RDC",
            status: "VIGENTE",
            impact: "CRÍTICO",
            summary: "Estabelece BPF para manipulação de medicamentos",
            url: "https://www.in.gov.br/web/dou/-/resolucao-rdc-n-67-de-8-de-outubro-de-2007-82076057",
            keyPoints: [
              "Requisitos de instalações",
              "Controle de qualidade",
              "Responsabilidades",
              "Documentação obrigatória"
            ],
            affectedAreas: ["Manipulação", "Qualidade", "Documentação"],
            implementationDeadline: null,
          },
          {
            id: "rdc-222-2018",
            code: "RDC 222/2018",
            title: "Requisitos Técnicos para Funcionamento",
            type: "RDC",
            status: "VIGENTE",
            impact: "ALTO",
            summary: "Requisitos para farmácias e drogarias",
            url: "https://www.in.gov.br/web/dou/-/resolucao-rdc-n-222-de-28-de-dezembro-de-2018-200556",
            keyPoints: [
              "Infraestrutura mínima",
              "Equipamentos obrigatórios",
              "Refrigeração",
              "Segurança"
            ],
            affectedAreas: ["Infraestrutura", "Equipamentos"],
            implementationDeadline: null,
          },
          {
            id: "rdc-876-2024",
            code: "RDC 876/2024",
            title: "BPF de Distribuição e Armazenamento",
            type: "RDC",
            status: "NOVA",
            impact: "ALTO",
            summary: "Atualiza requisitos para distribuidores",
            url: "https://www.in.gov.br",
            keyPoints: [
              "Cadeia de frio",
              "Rastreabilidade",
              "Transporte",
              "Armazenamento"
            ],
            affectedAreas: ["Distribuição", "Logística", "Armazenamento"],
            implementationDeadline: "2024-06-30",
          },
        ],
      },
      {
        id: "portarias",
        name: "Portarias",
        description: "Portarias ministeriais",
        items: [
          {
            id: "port-344-1998",
            code: "Portaria 344/1998",
            title: "Listas de Substâncias",
            type: "Portaria",
            status: "VIGENTE",
            impact: "CRÍTICO",
            summary: "Substâncias sujeitas a controle especial",
            url: "https://www.anvisa.gov.br",
            keyPoints: [
              "Lista de entorpecentes",
              "Lista de psicotrópicos",
              "Lista de precursores",
              "Prescrição especial"
            ],
            affectedAreas: ["Dispensação", "Prescrição", "Controle"],
            implementationDeadline: null,
          },
        ],
      },
      {
        id: "consultas",
        name: "Consultas Públicas",
        description: "Consultas em andamento",
        items: [
          {
            id: "cp-001-2024",
            code: "CP 001/2024",
            title: "Proposta de atualização BPF",
            type: "Consulta Pública",
            status: "ABERTA",
            impact: "ALTO",
            summary: "Proposta de modernização das BPF",
            url: "https://consultas.anvisa.gov.br",
            keyPoints: [
              "Digitalização de registros",
              "Novos requisitos de rastreabilidade",
              "Controle por sistema informatizado"
            ],
            affectedAreas: ["Tecnologia", "Rastreabilidade", "Documentação"],
            implementationDeadline: "2024-03-15",
          },
        ],
      },
    ],
  },
  visadocs: {
    lastUpdated: "2024-01-15T10:00:00Z",
    version: "2.0.0",
    features: [
      {
        id: "pops",
        name: "POPs",
        description: "Procedimentos Operacionais Padrão",
        howTo: [
          "Acesse Dashboard > POPs no menu lateral",
          "Clique em 'Novo POP' para criar",
          "Preencha código, título, objetivo e descrição",
          "Anexe documentos relacionados",
          "Defina responsáveis e versão",
          "Clique em 'Salvar'"
        ],
        tips: [
          "Use o editor WYSIWYG para formatar descrição",
          "Gere materiais de treinamento automaticamente",
          "Versione o POP ao fazer alterações"
        ],
      },
      {
        id: "treinamentos",
        name: "Treinamentos",
        description: "Gestão de treinamentos e certificados",
        howTo: [
          "Acesse Dashboard > Treinamentos",
          "Clique em 'Agendar Treinamento'",
          "Selecione POP e colaboradores",
          "Defina data e instrutor",
          "Após treinamento, registre presença",
          "Certificados são emitidos automaticamente"
        ],
        tips: [
          "Monitore vencimentos no dashboard",
          "Use quizzes para avaliar conhecimento",
          "Gere relatórios de compliance"
        ],
      },
      {
        id: "monitor-anvisa",
        name: "Monitor ANVISA",
        description: "Acompanhe atualizações regulatórias",
        howTo: [
          "Acesse Dashboard > Monitor ANVISA",
          "Visualize publicações recentes",
          "Filtre por tipo (RDC, Portaria, Consulta)",
          "Analise impacto nos seus POPs",
          "Crie alertas para equipe"
        ],
        tips: [
          "Configure notificações por email",
          "Analise impacto automaticamente",
          "Mantenha POPs atualizados"
        ],
      },
      {
        id: "assistente-ia",
        name: "Assistente IA",
        description: "Tire dúvidas e gere conteúdo",
        howTo: [
          "Clique no ícone de chat no menu superior",
          "Escolha o especialista desejado",
          "Faça perguntas sobre normas ou uso do sistema",
          "Solicite geração de quizzes ou análises"
        ],
        tips: [
          "Use 'Guia VISADOCS' para tutoriais",
          "Use 'Monitor ANVISA' para regulamentação",
          "Use 'Gerador de Quizzes' para avaliações"
        ],
      },
    ],
    faq: [
      {
        question: "Como cadastrar um colaborador?",
        answer: "Acesse Dashboard > Colaboradores > Novo Colaborador. Preencha dados pessoais, cargo e permissões.",
        category: "Cadastro",
      },
      {
        question: "Como emitir certificado de treinamento?",
        answer: "Certificados são emitidos automaticamente ao registrar conclusão do treinamento. Acesse Treinamentos > [Treinamento] > Emitir Certificado.",
        category: "Certificados",
      },
      {
        question: "Onde vejo treinamentos pendentes?",
        answer: "No Dashboard principal ou em Dashboard > Treinamentos com filtro 'Status: Pendente'.",
        category: "Dashboard",
      },
      {
        question: "Como atualizar um POP?",
        answer: "Acesse POPs > [POP desejado] > Editar. Faça as alterações e incremente a versão.",
        category: "POPs",
      },
      {
        question: "Como usar o Assistente IA?",
        answer: "Clique no ícone de chat (canto superior direito). Escolha o especialista (RDC 67, Guia VISADOCS, etc).",
        category: "IA",
      },
    ],
  },
};

// GET - Buscar informações da knowledge base
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category"); // 'anvisa' | 'visadocs'
    const section = searchParams.get("section");   // subcategoria
    const query = searchParams.get("query");       // busca textual

    let data: any = KNOWLEDGE_BASE;

    // Filtrar por categoria
    if (category && category !== "all") {
      data = KNOWLEDGE_BASE[category as keyof typeof KNOWLEDGE_BASE] || {};
    }

    // Busca textual simples
    if (query && query.length > 2) {
      const results = searchKnowledge(query);
      return NextResponse.json({
        query,
        results,
        meta: {
          totalResults: results.length,
          lastUpdated: KNOWLEDGE_BASE.anvisa.lastUpdated,
        },
      });
    }

    return NextResponse.json({
      data,
      meta: {
        lastUpdated: KNOWLEDGE_BASE.anvisa.lastUpdated,
        version: KNOWLEDGE_BASE.visadocs.version,
        categories: ["anvisa", "visadocs"],
      },
    });
  } catch (error: any) {
    console.error("Erro knowledge base:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// POST - Busca específica
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { query, category = "all", limit = 10 } = body;

    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: "Query muito curta (mín 3 caracteres)" },
        { status: 400 }
      );
    }

    const results = searchKnowledge(query, category, limit);

    return NextResponse.json({
      query,
      category,
      results,
      meta: {
        totalResults: results.length,
        lastUpdated: KNOWLEDGE_BASE.anvisa.lastUpdated,
      },
    });
  } catch (error: any) {
    console.error("Erro busca:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// Função de busca simples
function searchKnowledge(
  query: string,
  category?: string,
  limit: number = 10
): Array<{
  type: string;
  title: string;
  content: string;
  source: string;
  url?: string;
}> {
  const results: any[] = [];
  const q = query.toLowerCase();

  // Buscar em ANVISA
  if (!category || category === "anvisa" || category === "all") {
    KNOWLEDGE_BASE.anvisa.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        const searchable = `${item.code} ${item.title} ${item.summary} ${item.keyPoints?.join(" ")}`.toLowerCase();
        if (searchable.includes(q)) {
          results.push({
            type: item.type,
            title: `${item.code} - ${item.title}`,
            content: item.summary,
            source: "ANVISA",
            url: item.url,
            impact: item.impact,
            status: item.status,
          });
        }
      });
    });
  }

  // Buscar em VISADOCS FAQ
  if (!category || category === "visadocs" || category === "all") {
    KNOWLEDGE_BASE.visadocs.faq.forEach((item) => {
      if (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      ) {
        results.push({
          type: "FAQ",
          title: item.question,
          content: item.answer,
          source: "VISADOCS",
          category: item.category,
        });
      }
    });

    // Buscar em features
    KNOWLEDGE_BASE.visadocs.features.forEach((feature) => {
      if (
        feature.name.toLowerCase().includes(q) ||
        feature.description.toLowerCase().includes(q)
      ) {
        results.push({
          type: "Feature",
          title: feature.name,
          content: feature.description,
          source: "VISADOCS",
          howTo: feature.howTo,
        });
      }
    });
  }

  return results.slice(0, limit);
}
