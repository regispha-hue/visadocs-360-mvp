/**
 * API Master List PDF - Gera PDF com lista completa de POPs por setor
 * GET /api/pops/master-list/pdf
 * Usa Abacus HTML2PDF API
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Template HTML para Master List
function generateMasterListHtml(
  farmaciaNome: string,
  data: string,
  popsPorSetor: Record<string, any[]>,
  logoUrl?: string | null
): string {
  const setores = Object.keys(popsPorSetor).sort();
  
  // Gerar código de validação único
  const validationCode = `VIS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Master List - ${farmaciaNome}</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #1e293b; }
    .header { text-align: center; border-bottom: 3px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { font-size: 18pt; color: #0d9488; margin-bottom: 5px; }
    .header p { font-size: 9pt; color: #64748b; }
    .setor { margin-bottom: 20px; page-break-inside: avoid; }
    .setor-header { background: #f0fdfa; padding: 8px 12px; border-left: 4px solid #0d9488; margin-bottom: 8px; }
    .setor-header h2 { font-size: 12pt; color: #0f766e; margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    th { background: #e2e8f0; padding: 6px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #cbd5e1; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) { background: #f8fafc; }
    .codigo { font-family: monospace; font-weight: 600; color: #0d9488; }
    .versao { font-size: 8pt; color: #64748b; }
    .status { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8pt; }
    .status-ATIVO { background: #d1fae5; color: #065f46; }
    .status-RASCUNHO { background: #fef3c7; color: #b45309; }
    .footer { position: fixed; bottom: 10px; left: 15mm; right: 15mm; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; }
    .page-break { page-break-after: always; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60pt; color: rgba(200, 200, 200, 0.15); font-weight: bold; pointer-events: none; z-index: 1000; }
    .confidential { position: fixed; top: 10px; right: 15mm; font-size: 8pt; color: #dc2626; font-weight: bold; border: 1px solid #dc2626; padding: 2px 8px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="confidential">CONFIDENCIAL</div>
  <div class="watermark">${farmaciaNome}</div>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="${farmaciaNome}" style="max-height: 50px; max-width: 200px; margin-bottom: 10px;" />` : ''}
    <h1>📋 Master List de POPs</h1>
    <p><strong>${farmaciaNome}</strong> | Gerado em ${data} | Documento para Fiscalização ANVISA</p>
  </div>
`;

  setores.forEach((setor, index) => {
    const pops = popsPorSetor[setor];
    html += `
  <div class="setor">
    <div class="setor-header">
      <h2>${setor} (${pops.length} POPs)</h2>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 12%">Código</th>
          <th style="width: 35%">Título</th>
          <th style="width: 15%">Responsável</th>
          <th style="width: 12%">Versão</th>
          <th style="width: 15%">Validado Em</th>
          <th style="width: 11%">Status</th>
        </tr>
      </thead>
      <tbody>
`;
    pops.forEach((pop) => {
      const statusClass = `status-${pop.status}`;
      const validadoEm = pop.validadoEm
        ? new Date(pop.validadoEm).toLocaleDateString("pt-BR")
        : "-";
      html += `        <tr>
          <td class="codigo">${pop.codigo}</td>
          <td>${pop.titulo}</td>
          <td>${pop.responsavel || "-"}</td>
          <td class="versao">${pop.versao || "Rev00"}</td>
          <td>${validadoEm}</td>
          <td><span class="status ${statusClass}">${pop.status}</span></td>
        </tr>
`;
    });
    html += `      </tbody>
    </table>
  </div>
`;
    if (index < setores.length - 1) {
      html += `  <div class="page-break"></div>
`;
    }
  });

  html += `
  <div class="footer">
    <span>VISADOCS - Conformidade RDC 67/2007 | Código Validação: ${validationCode}</span>
    <span>Página</span>
  </div>
</body>
</html>`;

  return html;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 403 }
      );
    }

    // Buscar dados da farmácia
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nome: true, logoUrl: true } as any,
    });

    // Buscar todos os POPs ativos
    const pops = await prisma.pop.findMany({
      where: {
        tenantId,
        status: "ATIVO",
      },
      select: {
        id: true,
        codigo: true,
        titulo: true,
        setor: true,
        versao: true,
        dataRevisao: true,
        responsavel: true,
        validadoEm: true,
        status: true,
      },
      orderBy: [{ setor: "asc" }, { codigo: "asc" }],
    });

    // Agrupar por setor
    const popsPorSetor: Record<string, typeof pops> = {};
    pops.forEach((pop) => {
      if (!popsPorSetor[pop.setor]) {
        popsPorSetor[pop.setor] = [];
      }
      popsPorSetor[pop.setor].push(pop);
    });

    const dataGeracao = new Date().toLocaleString("pt-BR");
    // @ts-ignore
    const html = generateMasterListHtml(tenant?.nome || "Farmácia", dataGeracao, popsPorSetor, (tenant as any)?.logoUrl);

    // Gerar PDF via Abacus HTML2PDF API
    const response = await fetch(
      "https://apps.abacus.ai/api/createConvertHtmlToPdfRequest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.ABACUSAI_API_KEY!,
        },
        body: JSON.stringify({
          html,
          format: "A4",
          landscape: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Falha ao gerar PDF");
    }

    const result = await response.json();

    // Retornar URL do PDF ou redirecionar
    return NextResponse.json({
      success: true,
      pdfUrl: result.url,
      downloadUrl: result.downloadUrl,
      totalPOPs: pops.length,
      totalSetores: Object.keys(popsPorSetor).length,
    });
  } catch (error) {
    console.error("Erro ao gerar Master List PDF:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF" },
      { status: 500 }
    );
  }
}
