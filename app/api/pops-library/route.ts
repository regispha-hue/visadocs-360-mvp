// app/api/pops-library/route.ts
// API para Biblioteca de POPs - RAG e Treinamentos
// Integra com sistema de certificação e liberação de fluxos

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const POPS_KITS_PATH = "C:/Users/Usuario/visadocs-360-mvp/pops_kits";

// GET - Listar kits e POPs disponíveis
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kit = searchParams.get("kit");
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const popId = searchParams.get("pop");

    // Carregar índice
    const indexPath = join(POPS_KITS_PATH, "pops_index.json");
    const indexContent = await readFile(indexPath, "utf-8");
    const index = JSON.parse(indexContent);

    // Se solicitou POP específico
    if (popId && kit) {
      const popContent = await getPopContent(kit, popId);
      return NextResponse.json({ pop: popContent });
    }

    // Se solicitou kit específico
    if (kit) {
      const kitPops = await getKitPops(kit);
      return NextResponse.json({ 
        kit: index.kits.find((k: any) => k.folder === kit),
        pops: kitPops 
      });
    }

    // Busca textual
    if (search) {
      const results = await searchPops(search, category);
      return NextResponse.json({ 
        query: search,
        results,
        total: results.length 
      });
    }

    // Listar todos os kits
    return NextResponse.json({
      kits: index.kits,
      totalKits: index.total_kits,
      totalPops: index.total_pops,
      meta: {
        lastUpdated: index.updated_at || index.generated_at,
        version: "2.1.0"
      }
    });

  } catch (error: any) {
    console.error("Erro na biblioteca de POPs:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// POST - Criar treinamento a partir de POP da biblioteca
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      kitFolder, 
      popId, 
      tenantId, 
      colaboradoresIds,
      generateMaterials = true 
    } = body;

    if (!kitFolder || !popId || !tenantId) {
      return NextResponse.json(
        { error: "kitFolder, popId e tenantId são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar conteúdo do POP
    const popContent = await getPopContent(kitFolder, popId);
    if (!popContent) {
      return NextResponse.json(
        { error: "POP não encontrado na biblioteca" },
        { status: 404 }
      );
    }

    // Criar POP no sistema se não existir
    let pop = await prisma.pop.findFirst({
      where: {
        codigo: popContent.codigo,
        tenantId
      }
    });

    if (!pop) {
      pop = await prisma.pop.create({
        data: {
          codigo: popContent.codigo,
          titulo: popContent.titulo,
          objetivo: popContent.objetivo || "Treinamento obrigatório - Biblioteca VISADOCS",
          descricao: popContent.descricao || "",
    // @ts-ignore
          categoria: mapCategory(popContent.categoria),
          status: "ATIVO",
          version: "1.0.0",
          tenantId,
          bibliotecaRef: `${kitFolder}/${popId}`,
          fonte: "BIBLIOTECA_VISADOCS"
        }
      });
    }

    // Gerar materiais de treinamento se solicitado
    let materiais = null;
    if (generateMaterials) {
      materiais = await generateTrainingMaterials(pop.id, popContent);
    }

    // Criar treinamentos para colaboradores
    const treinamentos = [];
    if (colaboradoresIds && colaboradoresIds.length > 0) {
      for (const colaboradorId of colaboradoresIds) {
        const treinamento = await prisma.treinamento.create({
          data: {
            colaboradorId,
            popId: pop.id,
            tenantId,
    // @ts-ignore
            dataAgendada: new Date(),
            status: "PENDENTE",
            tipo: "BIBLIOTECA",
            fonte: "BIBLIOTECA_VISADOCS"
          }
        });
        treinamentos.push(treinamento);
      }
    }

    return NextResponse.json({
      success: true,
      pop,
      treinamentosCriados: treinamentos.length,
      materiais,
      message: `POP ${popContent.codigo} importado da biblioteca e ${treinamentos.length} treinamentos agendados`
    });

  } catch (error: any) {
    console.error("Erro ao criar treinamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// Funções auxiliares

async function getKitPops(kitFolder: string): Promise<any[]> {
  const kitPath = join(POPS_KITS_PATH, kitFolder, "POPs");
  const pops = [];
  
  try {
    const entries = await readdir(kitPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.includes("POP")) {
        // Extrair código e título do nome da pasta
        const match = entry.name.match(/POP\.(\d+)\s*-\s*(.+)/);
        pops.push({
          id: entry.name,
          codigo: match ? `POP.${match[1]}` : entry.name,
          titulo: match ? match[2] : entry.name,
          path: join(kitPath, entry.name),
          folder: entry.name
        });
      }
    }
  } catch (e) {
    console.error(`Erro ao ler kit ${kitFolder}:`, e);
  }
  
  return pops.sort((a, b) => a.codigo.localeCompare(b.codigo));
}

async function getPopContent(kitFolder: string, popId: string): Promise<any | null> {
  const popPath = join(POPS_KITS_PATH, kitFolder, "POPs", popId);
  
  try {
    // Extrair informações do nome da pasta
    const match = popId.match(/POP\.(\d+)\s*-\s*(.+)/);
    if (!match) return null;
    
    const codigo = `POP.${match[1]}`;
    const titulo = match[2];
    
    // Tentar ler arquivos de conteúdo
    let conteudo = "";
    try {
      const files = await readdir(popPath);
      const docFiles = files.filter(f => 
        f.endsWith('.docx') || f.endsWith('.pdf') || f.endsWith('.doc')
      );
      
      if (docFiles.length > 0) {
        conteudo = `Documento: ${docFiles[0]}`;
      }
    } catch (e) {
      // Pasta pode estar vazia
    }
    
    return {
      codigo,
      titulo,
      conteudo,
      categoria: inferirCategoria(titulo),
      path: popPath,
      kit: kitFolder
    };
  } catch (e) {
    return null;
  }
}

async function searchPops(query: string, category?: string): Promise<any[]> {
  const results = [];
  const q = query.toLowerCase();
  
  try {
    const indexPath = join(POPS_KITS_PATH, "pops_index.json");
    const indexContent = await readFile(indexPath, "utf-8");
    const index = JSON.parse(indexContent);
    
    for (const kit of index.kits) {
      const kitPops = await getKitPops(kit.folder);
      
      for (const pop of kitPops) {
        const searchable = `${pop.codigo} ${pop.titulo}`.toLowerCase();
        
        if (searchable.includes(q)) {
          if (!category || pop.categoria === category) {
            results.push({
              ...pop,
              kit: kit.folder,
              kitName: kit.name,
              kitCategory: kit.category
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("Erro na busca:", e);
  }
  
  return results.slice(0, 50); // Limitar resultados
}

async function generateTrainingMaterials(popId: string, popContent: any): Promise<any> {
  // Aqui integraríamos com o sistema de geração de materiais
  // Por enquanto, retornar estrutura básica
  return {
    popId,
    tipo: "BIBLIOTECA",
    materiaisPrevistos: [
      "slides",
      "quiz",
      "poster",
      "checklist"
    ],
    status: "PENDENTE_GERACAO"
  };
}

function mapCategory(categoria: string): string {
  const map: Record<string, string> = {
    "manipulacao": "MANIPULACAO",
    "qualidade": "CONTROLE_QUALIDADE",
    "recebimento": "RECEBIMENTO",
    "limpeza": "LIMPEZA",
    "higiene": "HIGIENE",
    "treinamento": "TREINAMENTO",
    "documentacao": "DOCUMENTACAO",
    "estoque": "ESTOQUE",
    "dispensacao": "DISPENSACAO",
  };
  
  const key = categoria?.toLowerCase() || "";
  return map[key] || "GERAL";
}

function inferirCategoria(titulo: string): string {
  const t = titulo.toLowerCase();
  
  if (t.includes("manipula") || t.includes("prepara")) return "manipulacao";
  if (t.includes("qualidade") || t.includes("controle") || t.includes("cq")) return "qualidade";
  if (t.includes("recebimento") || t.includes("aquisicao")) return "recebimento";
  if (t.includes("limpeza") || t.includes("higieniza")) return "limpeza";
  if (t.includes("higiene") || t.includes("maos")) return "higiene";
  if (t.includes("treinamento") || t.includes("capacita")) return "treinamento";
  if (t.includes("document") || t.includes("registro")) return "documentacao";
  if (t.includes("estoque") || t.includes("armazenamento")) return "estoque";
  if (t.includes("dispensacao") || t.includes("receita")) return "dispensacao";
  
  return "geral";
}
