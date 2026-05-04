// app/api/integracao/processar/route.ts
// API para processar arquivos de ERP e mapear com IA

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { callAI } from "@/lib/ai-router";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Receber arquivo
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Validar tipo
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Use Excel ou CSV." },
        { status: 400 }
      );
    }

    // Ler arquivo
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

    if (data.length < 2) {
      return NextResponse.json(
        { error: "Arquivo vazio ou sem dados" },
        { status: 400 }
      );
    }

    // Extrair cabeçalhos e amostra de dados
    const headers = data[0] as string[];
    const sampleRows = data.slice(1, 6); // 5 primeiras linhas

    // Detectar origem do ERP via IA
    const erpDetection = await detectERPSource(headers, sampleRows);

    // Mapear colunas com IA
    const columnMapping = await mapColumnsWithAI(headers, sampleRows, erpDetection);

    // Processar dados
    const processedData = data.slice(1).map((row: any) => {
      const obj: any = {};
      columnMapping.forEach((mapping: any) => {
        const colIndex = headers.indexOf(mapping.sourceColumn);
        if (colIndex >= 0) {
          obj[mapping.targetColumn] = row[colIndex];
        }
      });
      return obj;
    });

    // Verificar inconsistências
    const inconsistencies = await checkInconsistencies(processedData, tenantId);

    // Sincronizar com banco
    let syncedCount = 0;
    const errors: Array<{ record: string; error: string }> = [];
    
    for (const record of processedData) {
      try {
        // Verificar se colaborador já existe
        const existing = await prisma.colaborador.findFirst({
          where: {
            tenantId,
            OR: [
              { nome: { contains: record.nome_colaborador || "" } },
              { email: record.email || "" },
            ],
          },
        });

        if (!existing && record.nome_colaborador) {
          // Criar novo colaborador
          await prisma.colaborador.create({
            data: {
              tenantId,
              nome: record.nome_colaborador,
              email: record.email || null,
              telefone: record.telefone || null,
              cargo: record.cargo || null,
              dataAdmissao: record.data_admissao
                ? new Date(record.data_admissao)
                : null,
              status: "ATIVO",
              fonteIntegracao: erpDetection.source,
            },
          });
          syncedCount++;
        }
      } catch (e: any) {
        const errorMsg = e?.message || "Erro desconhecido";
        console.error("Erro ao sincronizar registro:", e);
        errors.push({
          record: record.nome_colaborador || "Desconhecido",
          error: errorMsg,
        });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      source: erpDetection.source,
      recordCount: syncedCount,
      totalRecords: processedData.length,
      errorCount: errors.length,
      mappings: columnMapping,
      inconsistencies: inconsistencies.length > 0 ? inconsistencies : null,
      errors: errors.length > 0 ? errors : null,
      message: `${syncedCount} de ${processedData.length} registros sincronizados${errors.length > 0 ? ` (${errors.length} erros)` : ""}`,
    });

  } catch (error: any) {
    console.error("Erro ao processar arquivo:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao processar arquivo" },
      { status: 500 }
    );
  }
}

// Detectar origem do ERP
async function detectERPSource(headers: string[], sampleRows: any[]): Promise<any> {
  const prompt = `Analise os cabeçalhos de colunas e amostra de dados abaixo para identificar qual ERP (sistema de gestão) eles vêm de:

CABEÇALHOS: ${headers.join(", ")}

AMOSTRA DE DADOS (primeiras 3 linhas):
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

OPÇÕES DE ERP:
- Fagron FórmulaCerta (farmácia de manipulação)
- Trier ERP (gestão empresarial)
- HOS Sistemas (hospitalar)
- SAP (enterprise)
- Genérico/Outro

Responda em JSON:
{
  "source": "Nome do ERP detectado",
  "confidence": 85,
  "reasoning": "Por que você identificou este ERP"
}`;

  try {
    const response = await callAI(prompt, { temperature: 0.3 });
    const content = response.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(content);
  } catch (e) {
    return {
      source: "ERP Genérico",
      confidence: 50,
      reasoning: "Não foi possível identificar o ERP específico",
    };
  }
}

// Mapear colunas com IA
async function mapColumnsWithAI(headers: string[], sampleRows: any[], erpInfo: any): Promise<any[]> {
  const prompt = `Você é um especialista em integração de sistemas ERP para farmácias de manipulação.

Mapeie as colunas do ${erpInfo.source} para o schema do Visadocs:

CABEÇALHOS DO ERP: ${headers.join(", ")}

AMOSTRA DE DADOS:
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

COLUNAS DO VISADOCS (target):
- nome_colaborador: Nome completo do funcionário
- email: Email corporativo
- telefone: Telefone de contato
- cargo: Função/Cargo na farmácia
- data_admissao: Data de entrada na empresa
- cpf: CPF do colaborador
- registro_crf: Registro no conselho regional de farmácia

Responda em JSON array:
[
  {
    "sourceColumn": "coluna_no_erp",
    "targetColumn": "coluna_no_visadocs",
    "confidence": 95,
    "sample": "valor de exemplo"
  }
]`;

  try {
    const response = await callAI(prompt, { temperature: 0.2 });
    const content = response.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(content);
  } catch (e) {
    // Fallback: mapeamento básico
    return headers.map((h) => ({
      sourceColumn: h,
      targetColumn: h.toLowerCase().replace(/\s+/g, "_"),
      confidence: 50,
      sample: sampleRows[0]?.[headers.indexOf(h)] || "",
    }));
  }
}

// Verificar inconsistências
async function checkInconsistencies(data: any[], tenantId: string): Promise<any[]> {
  const inconsistencies: any[] = [];

  for (const record of data) {
    if (!record.nome_colaborador) continue;

    const existing = await prisma.colaborador.findFirst({
      where: {
        tenantId,
        nome: { contains: record.nome_colaborador },
      },
    });

    if (!existing) {
      inconsistencies.push({
        nome: record.nome_colaborador,
        cargo: record.cargo || "N/A",
        reason: "Funcionário no ERP mas não cadastrado no Visadocs",
      });
    }
  }

  return inconsistencies;
}
