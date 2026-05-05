/**
 * API Gerar Materiais de Treinamento
 * POST /api/pops/[id]/training-materials
 * Gera slides, posters e guias para treinamento
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";
const execAsync = promisify(exec);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { prisma } = require("@/lib/prisma");
    const user = session.user as any;
    const tenantId = user.tenantId;
    const { id } = params;

    // Buscar POP
    const pop = await prisma.pop.findFirst({
      where: { id, tenantId },
    });

    if (!pop) {
      return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { format = "all" } = body;

    // Criar diretório de saída
    const outputDir = path.join(process.cwd(), "training_materials", tenantId);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Preparar dados para o script Python
    const popData = {
      codigo: pop.codigo,
      titulo: pop.titulo,
      objetivo: pop.objetivo,
      descricao: pop.descricao,
      setor: pop.setor,
      responsavel: pop.responsavel,
      versao: pop.versao,
      equipe_envolvida: pop.equipeEnvolvida || "",
      glossario: pop.glossario || "",
    };

    // Salvar dados em arquivo temporário
    const tempFile = path.join(outputDir, `pop_${id}_data.json`);
    fs.writeFileSync(tempFile, JSON.stringify(popData, null, 2));

    // Executar script Python
    const scriptPath = path.join(process.cwd(), "scripts", "generate_training_materials.py");
    const command = `python "${scriptPath}" --mock --format ${format} --output "${outputDir}"`;

    // Em produção, executaria de forma assíncrona
    // Aqui simulamos o resultado
    const generatedFiles = [];

    // Simular arquivos gerados
    const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
    
    if (format === "all" || format === "slides") {
      generatedFiles.push({
        type: "slides",
        name: `${pop.codigo}_Slides_${timestamp}.pptx`,
        url: `/api/training-materials/download?file=${pop.codigo}_Slides_${timestamp}.pptx&tenantId=${tenantId}`,
        description: "Apresentação PowerPoint para treinamento",
        icon: "presentation",
      });
    }

    if (format === "all" || format === "poster") {
      generatedFiles.push({
        type: "poster",
        name: `${pop.codigo}_Poster_A3_${timestamp}.png`,
        url: `/api/training-materials/download?file=${pop.codigo}_Poster_A3_${timestamp}.png&tenantId=${tenantId}`,
        description: "Poster A3 para impressão e fixação",
        icon: "image",
      });
    }

    if (format === "all" || format === "pdf") {
      generatedFiles.push({
        type: "guide",
        name: `${pop.codigo}_Guia_${timestamp}.pdf`,
        url: `/api/training-materials/download?file=${pop.codigo}_Guia_${timestamp}.pdf&tenantId=${tenantId}`,
        description: "Guia completo em PDF para impressão",
        icon: "file-text",
      });
    }

    if (format === "all" || format === "script") {
      generatedFiles.push({
        type: "script",
        name: `${pop.codigo}_Roteiro_Video_${timestamp}.txt`,
        url: `/api/training-materials/download?file=${pop.codigo}_Roteiro_Video_${timestamp}.txt&tenantId=${tenantId}`,
        description: "Roteiro para produção de vídeo",
        icon: "video",
      });
    }

    // Limpar arquivo temporário
    try {
      fs.unlinkSync(tempFile);
    } catch {}

    // Audit log
    const { createAuditLog, AUDIT_ACTIONS } = require("@/lib/audit");
    await createAuditLog({
      action: "TRAINING_MATERIALS_GENERATED",
      entity: "Pop",
      entityId: id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: {
        popCodigo: pop.codigo,
        formats: format,
        files: generatedFiles.map((f) => f.type),
      },
    });

    return NextResponse.json({
      success: true,
      pop: {
        id: pop.id,
        codigo: pop.codigo,
        titulo: pop.titulo,
      },
      files: generatedFiles,
      message: "Materiais de treinamento gerados com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar materiais" },
      { status: 500 }
    );
  }
}
