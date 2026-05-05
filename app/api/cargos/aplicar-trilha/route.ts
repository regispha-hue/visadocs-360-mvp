/**
 * API Aplicar Trilha - Cria treinamentos PENDENTE para colaborador baseado no cargo
 * POST /api/cargos/aplicar-trilha
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { KIT_CATALOG } from "@/lib/kit-catalog";

export const dynamic = "force-dynamic";

// Mapeamento de setores para kits
const SETOR_TO_KIT: Record<string, string> = {
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 403 });
    }

    const body = await request.json();
    const { colaboradorId } = body;

    if (!colaboradorId) {
      return NextResponse.json(
        { error: "ID do colaborador é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar colaborador com cargo
    const colaborador = await prisma.colaborador.findFirst({
      where: { id: colaboradorId, tenantId },
      include: { cargoModelo: true },
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: "Colaborador não encontrado" },
        { status: 404 }
      );
    }

    if (!colaborador.cargoModeloId || !colaborador.cargoModelo) {
      return NextResponse.json(
        { error: "Colaborador não tem cargo associado" },
        { status: 400 }
      );
    }

    const cargo = colaborador.cargoModelo;
    const kitIds = cargo.kitIds || [];

    if (kitIds.length === 0) {
      return NextResponse.json(
        { error: "Cargo não tem kits associados" },
        { status: 400 }
      );
    }

    // Buscar setores dos kits
    const setoresDosKits: string[] = [];
    kitIds.forEach((kitId: string) => {
      const kit = KIT_CATALOG.find((k) => k.id === kitId);
      if (kit) {
        kit.setores.forEach((s) => {
          if (!setoresDosKits.includes(s)) {
            setoresDosKits.push(s);
          }
        });
      }
    });

    // Buscar POPs ativos dos setores do cargo
    const pops = await prisma.pop.findMany({
      where: {
        tenantId,
        status: "ATIVO",
        setor: { in: setoresDosKits },
      },
      select: { id: true, titulo: true, setor: true },
    });

    // Verificar treinamentos existentes
    const existingTreinamentos = await prisma.treinamento.findMany({
      where: {
        colaboradorId,
        tenantId,
      },
      select: { popId: true },
    });

    const existingPopIds = new Set(existingTreinamentos.map((t) => t.popId));

    // Criar treinamentos PENDENTE para POPs que não existem
    const treinamentosCriados = [];
    for (const pop of pops) {
      if (!existingPopIds.has(pop.id)) {
        const treinamento = await prisma.treinamento.create({
          data: {
            tenantId,
            popId: pop.id,
            colaboradorId,
            dataTreinamento: new Date(),
            instrutor: "Trilha de Onboarding",
            status: "PENDENTE",
          },
        });
        treinamentosCriados.push(treinamento);
      }
    }

    // Audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.TRILHA_APLICADA,
      entity: "Treinamento",
      userId: user.id,
      userName: user.name,
      tenantId,
      details: {
        colaboradorId,
        colaboradorNome: colaborador.nome,
        cargoId: cargo.id,
        cargoNome: cargo.nome,
        treinamentosCriados: treinamentosCriados.length,
      },
    });

    return NextResponse.json({
      success: true,
      colaboradorId,
      cargoId: cargo.id,
      treinamentosCriados: treinamentosCriados.length,
      totalPOPs: pops.length,
      mensagem: `${treinamentosCriados.length} treinamentos criados para ${colaborador.nome}`,
    });
  } catch (error) {
    console.error("Erro ao aplicar trilha:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
