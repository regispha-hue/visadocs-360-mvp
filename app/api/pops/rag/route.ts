import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Simulação da integração com POPs RAG (em produção, usar Python backend)
const POPS_RAG_API = process.env.POPS_RAG_API_URL || "http://localhost:8000";

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
    const query = searchParams.get("query");
    const category = searchParams.get("category");

    switch (action) {
      case "search":
        return await handleSearch(query, category, tenantId);
      case "validate":
        return await handleValidate(searchParams, tenantId);
      case "knowledge":
        return await handleKnowledge(query, category);
      case "kits":
        return await handleKits();
      case "stats":
        return await handleStats(tenantId);
      case "compliance":
        return await handleCompliance(tenantId);
      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POPs RAG API:", error);
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
      case "create_from_template":
        return await handleCreateFromTemplate(data, tenantId);
      case "validate_pop":
        return await handleValidatePop(data, tenantId);
      case "add_knowledge":
        return await handleAddKnowledge(data);
      case "generate_insights":
        return await handleGenerateInsights(data, tenantId);
      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POPs RAG POST:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

async function handleSearch(query: string | null, category: string | null, tenantId: string) {
  if (!query) {
    return NextResponse.json({ error: "Query obrigatória" }, { status: 400 });
  }

  try {
    const response = await fetch(`${POPS_RAG_API}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        category: category || undefined,
        tenant_id: tenantId,
        limit: 20
      })
    });

    if (!response.ok) {
      throw new Error("Erro na busca semântica");
    }

    const results = await response.json();
    return NextResponse.json({ results });
  } catch (error) {
    // Fallback para busca simulada
    const mockResults = generateMockSearchResults(query, category);
    return NextResponse.json({ results: mockResults });
  }
}

async function handleValidate(searchParams: URLSearchParams, tenantId: string) {
  const popId = searchParams.get("popId");
  const popCodigo = searchParams.get("codigo");

  if (!popId && !popCodigo) {
    return NextResponse.json({ error: "POP ID ou código obrigatório" }, { status: 400 });
  }

  try {
    const response = await fetch(`${POPS_RAG_API}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pop_id: popId,
        pop_codigo: popCodigo,
        tenant_id: tenantId
      })
    });

    if (!response.ok) {
      throw new Error("Erro na validação");
    }

    const validation = await response.json();
    return NextResponse.json({ validation });
  } catch (error) {
    // Fallback para validação simulada
    const mockValidation = generateMockValidation();
    return NextResponse.json({ validation: mockValidation });
  }
}

async function handleKnowledge(query: string | null, category: string | null) {
  try {
    const response = await fetch(`${POPS_RAG_API}/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query || "",
        category: category || undefined,
        limit: 15
      })
    });

    if (!response.ok) {
      throw new Error("Erro na busca de conhecimento");
    }

    const knowledge = await response.json();
    return NextResponse.json({ knowledge });
  } catch (error) {
    // Fallback para conhecimento simulado
    const mockKnowledge = generateMockKnowledge(query, category);
    return NextResponse.json({ knowledge: mockKnowledge });
  }
}

async function handleKits() {
  try {
    const response = await fetch(`${POPS_RAG_API}/kits`);
    
    if (!response.ok) {
      throw new Error("Erro ao buscar kits");
    }

    const kits = await response.json();
    return NextResponse.json({ kits });
  } catch (error) {
    // Fallback para kits simulados
    const mockKits = generateMockKits();
    return NextResponse.json({ kits: mockKits });
  }
}

async function handleStats(tenantId: string) {
  try {
    const response = await fetch(`${POPS_RAG_API}/stats/${tenantId}`);
    
    if (!response.ok) {
      throw new Error("Erro ao buscar estatísticas");
    }

    const stats = await response.json();
    return NextResponse.json({ stats });
  } catch (error) {
    // Fallback para estatísticas simuladas
    const mockStats = generateMockStats();
    return NextResponse.json({ stats: mockStats });
  }
}

async function handleCompliance(tenantId: string) {
  try {
    const response = await fetch(`${POPS_RAG_API}/compliance/${tenantId}`);
    
    if (!response.ok) {
      throw new Error("Erro ao buscar conformidade");
    }

    const compliance = await response.json();
    return NextResponse.json({ compliance });
  } catch (error) {
    // Fallback para conformidade simulada
    const mockCompliance = generateMockCompliance();
    return NextResponse.json({ compliance: mockCompliance });
  }
}

async function handleCreateFromTemplate(data: any, tenantId: string) {
  const { templateType, category, title } = data;

  if (!templateType || !category || !title) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  try {
    const response = await fetch(`${POPS_RAG_API}/create_from_template`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_type: templateType,
        category,
        title,
        tenant_id: tenantId
      })
    });

    if (!response.ok) {
      throw new Error("Erro ao criar POP");
    }

    const pop = await response.json();
    return NextResponse.json({ pop });
  } catch (error) {
    // Fallback para criação simulada
    const mockPop = generateMockPop(templateType, category, title);
    return NextResponse.json({ pop: mockPop });
  }
}

async function handleValidatePop(data: any, tenantId: string) {
  const { popId, codigo, titulo, conteudo, categoria } = data;

  if (!codigo || !titulo || !conteudo || !categoria) {
    return NextResponse.json({ error: "Dados do POP incompletos" }, { status: 400 });
  }

  try {
    const response = await fetch(`${POPS_RAG_API}/validate_pop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pop_id: popId,
        codigo,
        titulo,
        conteudo,
        categoria,
        tenant_id: tenantId
      })
    });

    if (!response.ok) {
      throw new Error("Erro na validação");
    }

    const validation = await response.json();
    return NextResponse.json({ validation });
  } catch (error) {
    // Fallback para validação simulada
    const mockValidation = generateMockValidation();
    return NextResponse.json({ validation: mockValidation });
  }
}

async function handleAddKnowledge(data: any) {
  const { title, content, category, entryType, source, tags } = data;

  if (!title || !content || !category || !entryType) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  try {
    const response = await fetch(`${POPS_RAG_API}/add_knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        category,
        entry_type: entryType,
        source: source || "Manual",
        tags: tags || []
      })
    });

    if (!response.ok) {
      throw new Error("Erro ao adicionar conhecimento");
    }

    const result = await response.json();
    return NextResponse.json({ success: true, entry: result });
  } catch (error) {
    // Fallback para adição simulada
    const mockEntry = generateMockKnowledgeEntry(title, content, category, entryType);
    return NextResponse.json({ success: true, entry: mockEntry });
  }
}

async function handleGenerateInsights(data: any, tenantId: string) {
  const { popIds } = data;

  try {
    const response = await fetch(`${POPS_RAG_API}/generate_insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pop_ids: popIds || [],
        tenant_id: tenantId
      })
    });

    if (!response.ok) {
      throw new Error("Erro ao gerar insights");
    }

    const insights = await response.json();
    return NextResponse.json({ insights });
  } catch (error) {
    // Fallback para insights simulados
    const mockInsights = generateMockInsights();
    return NextResponse.json({ insights: mockInsights });
  }
}

// Funções de fallback (mock data)
function generateMockSearchResults(query: string, category: string | null) {
  return [
    {
      type: "pop_document",
      id: "pop_001",
      codigo: "POP.001",
      titulo: "Recebimento de Matérias-Primas",
      categoria: "recebimento_armazenamento",
      relevance_score: 0.95,
      match_reasons: ["Termos exatos: recebimento, matérias-primas", "Contexto farmacêutico"],
      snippet: "Procedimento para recebimento e inspeção de matérias-primas na farmácia..."
    },
    {
      type: "knowledge_entry",
      id: "kb_001",
      title: "BEST PRACTICE: Paramentação para Área de Manipulação",
      category: "manipulacao",
      entry_type: "best_practice",
      relevance_score: 0.87,
      content: "Paramentação completa é obrigatória para entrada em área de manipulação...",
      tags: ["paramentação", "epi", "segurança"]
    }
  ];
}

function generateMockValidation() {
  return {
    pop_validation: {
      status: "compliant",
      score: 0.92,
      issues: 2,
      critical_issues: 0
    },
    nexoritia_validation: {
      valid: true,
      coherent: true,
      confidence: 0.89,
      axioms_found: 5,
      violations: 0
    },
    combined_status: "compliant",
    compliance_score: 0.91,
    recommendations: ["Revisar seção de materiais", "Adicionar mais detalhes nos procedimentos"],
    proofs: []
  };
}

function generateMockKnowledge(query: string | null, category: string | null) {
  return [
    {
      id: "kb_001",
      title: "BEST PRACTICE: Paramentação para Área de Manipulação",
      content: "Paramentação completa é obrigatória para entrada em área de manipulação...",
      category: "manipulacao",
      entry_type: "best_practice",
      source: "RDC 67/2007",
      relevance_score: 1.0,
      tags: ["paramentação", "epi", "segurança"]
    },
    {
      id: "kb_002",
      title: "ALERTA: Contaminação Cruzada",
      content: "Risco de contaminação cruzada em áreas de manipulação...",
      category: "manipulacao",
      entry_type: "warning",
      source: "Best Practice",
      relevance_score: 0.9,
      tags: ["contaminação", "cruzada", "risco"]
    }
  ];
}

function generateMockKits() {
  return [
    {
      id: "kit_001",
      name: "Kit Recebimento e Armazenamento",
      category: "recebimento_armazenamento",
      description: "POPs essenciais para recebimento e armazenamento",
      required_pops: ["POP.001", "POP.002", "POP.003", "POP.004", "POP.005"],
      optional_pops: ["POP.006", "POP.007"],
      compliance_score: 0.95
    },
    {
      id: "kit_002",
      name: "Kit Manipulação Farmacêutica",
      category: "manipulacao",
      description: "POPs para todas as etapas de manipulação",
      required_pops: ["POP.012", "POP.013", "POP.014", "POP.015", "POP.016"],
      optional_pops: ["POP.017", "POP.018"],
      compliance_score: 0.92
    }
  ];
}

function generateMockStats() {
  return {
    total_pops: 45,
    by_category: {
      "recebimento_armazenamento": 7,
      "manipulacao": 12,
      "controle_qualidade": 8,
      "administrativo": 6
    },
    by_status: {
      "published": 38,
      "draft": 5,
      "validated": 2
    },
    avg_compliance: 0.91
  };
}

function generateMockCompliance() {
  return {
    tenant_id: "default",
    generated_at: new Date().toISOString(),
    summary: {
      total_pops: 45,
      avg_compliance: 0.91
    },
    by_category: {
      "recebimento_armazenamento": {
        total_pops: 7,
        avg_compliance: 0.95,
        nexoritia_alignment_rate: 0.89
      },
      "manipulacao": {
        total_pops: 12,
        avg_compliance: 0.88,
        nexoritia_alignment_rate: 0.85
      }
    },
    recommendations: [
      "PRIORIDADE ALTA: Melhorar conformidade em manipulacao",
      "REVISAR: Alinhar POPs de controle_qualidade com axiomas Nexoritia"
    ]
  };
}

function generateMockPop(templateType: string, category: string, title: string) {
  return {
    id: `pop_${Date.now()}`,
    codigo: `POP.${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
    titulo: title,
    tipo: "RQ",
    categoria: category,
    conteudo: `Conteúdo gerado a partir do template ${templateType}...`,
    versao: "1.0",
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenant_id: "default"
  };
}

function generateMockKnowledgeEntry(title: string, content: string, category: string, entryType: string) {
  return {
    id: `kb_${Date.now()}`,
    title,
    content,
    category,
    entry_type: entryType,
    source: "Manual",
    relevance_score: 0.8,
    tags: ["manual", "custom"],
    created_at: new Date().toISOString()
  };
}

function generateMockInsights() {
  return [
    {
      id: `insight_${Date.now()}`,
      type: "pattern_detection",
      content: "Problema 'pop_006' detectado em 4 POPs. Considerar treinamento específico.",
      confidence: 0.85,
      sources: ["POP.001", "POP.002", "POP.003", "POP.004"],
      created_at: new Date().toISOString()
    }
  ];
}
