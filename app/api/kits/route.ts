/**
 * API Kits - Retorna catálogo de kits com contagem de POPs
 * GET /api/kits
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { KIT_CATALOG, getKitPopCounts } from "@/lib/kit-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Get POP counts per kit
    const popCounts: Record<string, number> = {};
    
    if (tenantId) {
      // Count POPs per setor (which maps to kits)
      const pops = await prisma.pop.groupBy({
        by: ["setor"],
        where: {
          tenantId,
          status: "ATIVO",
        },
        _count: {
          id: true,
        },
      });

      // Map setores to kits
      const setorToKit: Record<string, string> = {
        "Gestão Qualidade": "kit-qualidade",
        "RH e Pessoal": "kit-rh",
        "Fornecedores": "kit-fornecedores",
        "Infraestrutura": "kit-infraestrutura",
        "Equipamentos": "kit-equipamentos",
        "Limpeza": "kit-limpeza",
        "Atendimento": "kit-atendimento",
        "Escrituração": "kit-escrituracao",
        "Controle Qualidade": "kit-controle-qualidade",
        "Almoxarifado": "kit-almoxarifado",
        "Manipulação": "kit-manipulacao",
        "Água Purificada": "kit-agua",
      };

      // Initialize all kits with 0
      KIT_CATALOG.forEach((kit) => {
        popCounts[kit.id] = 0;
      });

      // Sum counts
      pops.forEach((pop) => {
        const kitId = setorToKit[pop.setor];
        if (kitId && popCounts[kitId] !== undefined) {
          popCounts[kitId] += pop._count.id;
        }
      });
    } else {
      // For SUPER_ADMIN or when no tenant, return empty counts
      KIT_CATALOG.forEach((kit) => {
        popCounts[kit.id] = 0;
      });
    }

    // Build response with kits and counts
    const kitsWithCounts = KIT_CATALOG.map((kit) => ({
      ...kit,
      popCount: popCounts[kit.id] || 0,
    }));

    return NextResponse.json({
      kits: kitsWithCounts,
    });
  } catch (error) {
    console.error("Erro ao buscar kits:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
