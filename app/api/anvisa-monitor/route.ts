/**
 * API Monitor ANVISA
 * GET /api/anvisa-monitor - Buscar últimas publicações
 * POST /api/anvisa-monitor - Atualizar normas manualmente
 * Apenas SUPER_ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export const dynamic = "force-dynamic";

// Fontes de dados ANVISA
const ANVISA_SOURCES = {
  consultasPublicas: "https://www.gov.br/anvisa/pt-br/acessoainformacao/consultaspublicas",
  resolucoes: "https://www.gov.br/anvisa/pt-br/assuntos/regulamentacao/resolucoes",
  portarias: "https://www.gov.br/anvisa/pt-br/assuntos/regulamentacao/portarias",
  rdc: "https://www.gov.br/anvisa/pt-br/assuntos/regulamentacao/rdc",
};

// GET - Buscar publicações recentes (simulação/mock)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Em produção, aqui faria web scraping real
    // Por enquanto, retorna dados mockados para demonstração
    const mockPublications = [
      {
        id: "1",
        numero: "RDC 876/2024",
        titulo: "Dispõe sobre boas práticas de distribuição e armazenamento de medicamentos",
        tipo: "RDC",
        dataPublicacao: "2024-01-15",
        ementa: "Atualiza requisitos para distribuidores de medicamentos",
        urlOficial: "https://www.in.gov.br/materia/-/asset_publisher/...",
        categorias: ["Distribuição", "Armazenamento"],
        nivelImpacto: 4,
        isNew: true,
      },
      {
        id: "2",
        numero: "Portaria 123/2024",
        titulo: "Determina normas para manipulação de medicamentos estéreis",
        tipo: "Portaria",
        dataPublicacao: "2024-01-10",
        ementa: "Novos requisitos para farmácias de manipulação",
        urlOficial: "https://www.in.gov.br/materia/-/asset_publisher/...",
        categorias: ["Manipulação", "Estéril"],
        nivelImpacto: 5,
        isNew: true,
      },
      {
        id: "3",
        numero: "RDC 675/2022",
        titulo: "Boas Práticas de Distribuição e Transporte de Medicamentos",
        tipo: "RDC",
        dataPublicacao: "2022-09-15",
        ementa: "Regulamenta as Boas Práticas de Distribuição e Transporte",
        urlOficial: "https://www.in.gov.br/materia/-/asset_publisher/...",
        categorias: ["Distribuição", "Transporte"],
        nivelImpacto: 5,
        isNew: false,
      },
    ];

    return NextResponse.json({
      publications: mockPublications,
      lastUpdate: new Date().toISOString(),
      source: "ANVISA/DOU (Simulação)",
    });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar publicações" },
      { status: 500 }
    );
  }
}

// POST - Simular atualização manual
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { prisma } = require("@/lib/prisma");

    // Simular criação de uma nova norma
    const novaNorma = await prisma.normaRegulatoria.create({
      data: {
        numero: "RDC 999/2024",
        titulo: "Atualização de Boas Práticas de Manipulação",
        tipo: "RDC",
        orgao: "ANVISA",
        status: "ATIVA",
        ementa: "Nova regulamentação para farmácias de manipulação",
        urlOficial: "https://www.in.gov.br/materia/-/asset_publisher/...",
        dataPublicacao: new Date(),
        categorias: ["Manipulação", "Qualidade"],
        aplicabilidade: ["Farmácias"],
        nivelImpacto: 5,
        complexidade: 4,
      },
    });

    // Criar atualização
    const atualizacao = await prisma.atualizacaoNorma.create({
      data: {
        normaId: novaNorma.id,
        tipo: "NOVA_NORMA",
        descricao: "Nova norma publicada no DOU",
        dataDeteccao: new Date(),
        dataPublicacao: new Date(),
        impactoPOPs: ["POP.001", "POP.002"],
        acoesNecessarias: [
          "Revisar POPs de manipulação",
          "Atualizar treinamentos",
          "Verificar documentação",
        ],
        status: "Detectada",
        detectadoPor: "Sistema IA",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Norma simulada criada com sucesso",
      norma: novaNorma,
      atualizacao,
    });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar norma" },
      { status: 500 }
    );
  }
}
