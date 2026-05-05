/**
 * API Dossiê do Colaborador - Gera PDF consolidado
 * GET /api/colaboradores/[id]/dossie
 * PDF com: dados pessoais + treinamentos + certificados
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateDossieHtml(
  farmaciaNome: string,
  colaborador: any,
  treinamentos: any[],
  dataGeracao: string,
  logoUrl?: string | null
): string {
  // Gerar código de validação único
  const validationCode = `VIS-DOS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  const treinamentosConcluidos = treinamentos.filter((t) => t.status === "CONCLUIDO");
  const treinamentosPendentes = treinamentos.filter((t) => t.status === "PENDENTE");
  const treinamentosAprovados = treinamentos.filter((t) => t.aprovadoQuiz);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Dossiê - ${colaborador.nome}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #1e293b; }
    
    .header { text-align: center; border-bottom: 3px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px; }
    .header img { max-height: 50px; max-width: 200px; margin-bottom: 10px; }
    .header h1 { font-size: 20pt; color: #0d9488; margin-bottom: 5px; }
    .header h2 { font-size: 14pt; color: #0f766e; margin-bottom: 3px; }
    .header p { font-size: 9pt; color: #64748b; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60pt; color: rgba(200, 200, 200, 0.15); font-weight: bold; pointer-events: none; z-index: 1000; }
    .confidential { position: fixed; top: 10px; right: 20mm; font-size: 8pt; color: #dc2626; font-weight: bold; border: 1px solid #dc2626; padding: 2px 8px; border-radius: 4px; }
    
    .section { margin-bottom: 20px; }
    .section-title { background: #f0fdfa; padding: 8px 12px; border-left: 4px solid #0d9488; margin-bottom: 10px; font-size: 12pt; font-weight: 600; color: #0f766e; }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { padding: 8px; background: #f8fafc; border-radius: 4px; }
    .info-label { font-size: 8pt; color: #64748b; text-transform: uppercase; }
    .info-value { font-size: 10pt; font-weight: 500; }
    
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 10px; }
    th { background: #e2e8f0; padding: 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #cbd5e1; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: 500; }
    .badge-concluido { background: #d1fae5; color: #065f46; }
    .badge-pendente { background: #fef3c7; color: #b45309; }
    .badge-aprovado { background: #dbeafe; color: #1d4ed8; }
    .badge-reprovado { background: #fee2e2; color: #991b1b; }
    
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
    .stat-card { text-align: center; padding: 15px; background: #f0fdfa; border-radius: 8px; }
    .stat-value { font-size: 24pt; font-weight: 700; color: #0d9488; }
    .stat-label { font-size: 9pt; color: #64748b; }
    
    .footer { position: fixed; bottom: 15mm; left: 20mm; right: 20mm; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; }
    .page-break { page-break-after: always; }
    
    .certificados { margin-top: 15px; }
    .cert-item { padding: 10px; background: #f0fdf4; border-left: 3px solid #22c55e; margin-bottom: 8px; border-radius: 4px; }
    .cert-title { font-weight: 600; color: #166534; }
    .cert-meta { font-size: 9pt; color: #64748b; }
  </style>
</head>
<body>
  <div class="confidential">CONFIDENCIAL</div>
  <div class="watermark">${farmaciaNome}</div>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="${farmaciaNome}" />` : ''}
    <h1>📁 DOSSIÊ DO COLABORADOR</h1>
    <h2>${colaborador.nome}</h2>
    <p><strong>${farmaciaNome}</strong> | Gerado em ${dataGeracao}</p>
  </div>
`;

  // Seção 1: Dados Pessoais
  html += `
  <div class="section">
    <div class="section-title">👤 Dados Pessoais</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nome Completo</div>
        <div class="info-value">${colaborador.nome}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Função</div>
        <div class="info-value">${colaborador.funcao || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Setor</div>
        <div class="info-value">${colaborador.setor || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CPF</div>
        <div class="info-value">${colaborador.cpfMasked || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data de Admissão</div>
        <div class="info-value">${colaborador.dataAdmissao ? new Date(colaborador.dataAdmissao).toLocaleDateString("pt-BR") : "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Status</div>
        <div class="info-value">${colaborador.status}</div>
      </div>
      <div class="info-item">
        <div class="info-label">E-mail</div>
        <div class="info-value">${colaborador.email || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Cargo</div>
        <div class="info-value">${colaborador.cargoModelo?.nome || "-"}</div>
      </div>
    </div>
  </div>
`;

  // Seção 2: Estatísticas
  html += `
  <div class="section">
    <div class="section-title">📊 Resumo de Treinamentos</div>
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${treinamentos.length}</div>
        <div class="stat-label">Total de Treinamentos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${treinamentosConcluidos.length}</div>
        <div class="stat-label">Concluídos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${treinamentosAprovados.length}</div>
        <div class="stat-label">Certificados Válidos</div>
      </div>
    </div>
  </div>
`;

  // Seção 3: Treinamentos
  if (treinamentos.length > 0) {
    html += `
  <div class="section">
    <div class="section-title">🎓 Histórico de Treinamentos</div>
    <table>
      <thead>
        <tr>
          <th>POP</th>
          <th>Data</th>
          <th>Instrutor</th>
          <th>Nota</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
`;
    treinamentos.forEach((t) => {
      const statusClass =
        t.status === "CONCLUIDO"
          ? "badge-concluido"
          : t.status === "PENDENTE"
          ? "badge-pendente"
          : "";
      const nota = t.notaQuiz ? t.notaQuiz.toFixed(1) : "-";
      const data = t.dataTreinamento
        ? new Date(t.dataTreinamento).toLocaleDateString("pt-BR")
        : "-";

      html += `        <tr>
          <td><strong>${t.pop?.codigo || "-"}</strong><br><small>${t.pop?.titulo || ""}</small></td>
          <td>${data}</td>
          <td>${t.instrutor || "-"}</td>
          <td>${nota}</td>
          <td><span class="badge ${statusClass}">${t.status}</span></td>
        </tr>
`;
    });
    html += `      </tbody>
    </table>
  </div>
`;
  }

  // Seção 4: Certificados
  if (treinamentosAprovados.length > 0) {
    html += `
  <div class="section">
    <div class="section-title">🏆 Certificados Válidos</div>
    <div class="certificados">
`;
    treinamentosAprovados.forEach((t) => {
      html += `      <div class="cert-item">
        <div class="cert-title">✓ ${t.pop?.codigo} - ${t.pop?.titulo}</div>
        <div class="cert-meta">
          Concluído em ${new Date(t.dataTreinamento).toLocaleDateString("pt-BR")} 
          | Nota: ${t.notaQuiz?.toFixed(1) || "-"}
        </div>
      </div>
`;
    });
    html += `    </div>
  </div>
`;
  }

  html += `
  <div class="footer">
    <p>VISADOCS - Documentação para Fiscalização ANVISA • Conformidade RDC 67/2007</p>
    <p>Código Validação: ${validationCode} • Gerado em: ${dataGeracao}</p>
  </div>
</body>
</html>`;

  return html;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Buscar colaborador
    const colaborador = await prisma.colaborador.findFirst({
      where: { id, tenantId },
    // @ts-ignore
      include: { cargoModelo: true },
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: "Colaborador não encontrado" },
        { status: 404 }
      );
    }

    // Buscar dados da farmácia
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nome: true, logoUrl: true } as any,
    });

    // Buscar treinamentos com POPs
    const treinamentos = await prisma.treinamento.findMany({
      where: { colaboradorId: id, tenantId },
      include: { pop: true },
      orderBy: { dataTreinamento: "desc" },
    });

    const dataGeracao = new Date().toLocaleString("pt-BR");
    const html = generateDossieHtml(
    // @ts-ignore
      tenant?.nome || "Farmácia",
      colaborador,
      treinamentos,
      dataGeracao,
      (tenant as any)?.logoUrl
    );

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
          landscape: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Falha ao gerar PDF");
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      pdfUrl: result.url,
      downloadUrl: result.downloadUrl,
      colaboradorNome: colaborador.nome,
      totalTreinamentos: treinamentos.length,
      totalCertificados: treinamentos.filter((t) => t.aprovadoQuiz).length,
    });
  } catch (error) {
    console.error("Erro ao gerar Dossiê:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF do dossiê" },
      { status: 500 }
    );
  }
}
