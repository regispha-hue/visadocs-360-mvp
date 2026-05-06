// app/api/pops/[id]/pdf/route.ts
// API para geração de PDF de POP com IP tracking e personalização

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const tenantId = (session.user as any).tenantId;

    // Buscar POP
    const pop = await prisma.pop.findUnique({
      where: { id },
      include: {
        tenant: true,
        documentos: true,
      },
    });

    if (!pop) {
      return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });
    }

    // Verificar permissão
    if (pop.tenantId !== tenantId && (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Capturar IP do request
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               request.ip ||
               "IP não identificado";

    const userAgent = request.headers.get("user-agent") || "User-Agent não identificado";
    const timestamp = new Date().toLocaleString("pt-BR");

    // Buscar dados do tenant para personalização
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    // Gerar HTML do PDF
    const html = generatePDFHTML(pop, tenant, {
      userId,
      userName: (session.user as any).name || "Usuário",
      ip,
      userAgent,
      timestamp,
    });

    // Gerar PDF com Puppeteer
    const browser = await puppeteer.launch({
    // @ts-ignore
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "80px",
        bottom: "80px",
        left: "40px",
        right: "40px",
      },
    });
    
    await browser.close();

    // Log da geração
    await prisma.securityLog.create({
      data: {
        action: "PDF_GENERATION",
        severity: "LOW",
        userId,
        tenantId,
        details: {
          popId: id,
          popTitulo: pop.titulo,
          ip,
          userAgent: userAgent.substring(0, 200),
          timestamp,
        },
        ip,
        userAgent: userAgent.substring(0, 255),
      },
    });

    // Retornar PDF
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pop.codigo}-${pop.titulo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`,
        "X-POP-ID": id,
        "X-Generated-By": userId,
        "X-Generated-At": timestamp,
        "X-IP": ip,
      },
    });

  } catch (error: any) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar PDF" },
      { status: 500 }
    );
  }
}

// Função para gerar HTML do PDF
function generatePDFHTML(
  pop: any,
  tenant: any,
  metadata: {
    userId: string;
    userName: string;
    ip: string;
    userAgent: string;
    timestamp: string;
  }
): string {
  const logoUrl = tenant?.logoUrl || "";
  const watermarkText = `${tenant?.nome || "VISADOCS"} - ${metadata.userName} - ${metadata.ip}`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pop.codigo} - ${pop.titulo}</title>
  <style>
    @page {
      margin: 80px 40px;
      @top-center {
        content: "${pop.codigo} - ${pop.titulo}";
        font-size: 10px;
        color: #666;
      }
      @bottom-center {
        content: "Página " counter(page) " de " counter(pages);
        font-size: 10px;
        color: #666;
      }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
    }
    
    /* Watermark */
    .watermark {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: -1;
      opacity: 0.05;
      pointer-events: none;
    }
    
    .watermark-text {
      position: absolute;
      font-size: 48px;
      font-weight: bold;
      color: #000;
      transform: rotate(-45deg);
      white-space: nowrap;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .logo {
      max-height: 60px;
      max-width: 200px;
    }
    
    .header-info {
      text-align: right;
      font-size: 10px;
      color: #666;
    }
    
    /* Title */
    .pop-title {
      background: #f0fdfa;
      padding: 15px 20px;
      border-left: 4px solid #0d9488;
      margin-bottom: 20px;
    }
    
    .pop-code {
      font-size: 14px;
      font-weight: bold;
      color: #0d9488;
      margin-bottom: 5px;
    }
    
    .pop-name {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
    }
    
    .pop-meta {
      display: flex;
      gap: 30px;
      margin-top: 10px;
      font-size: 10px;
      color: #666;
    }
    
    /* Sections */
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #0d9488;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    
    .section-content {
      text-align: justify;
    }
    
    .section-content p {
      margin-bottom: 10px;
    }
    
    .section-content ul {
      margin-left: 20px;
      margin-bottom: 10px;
    }
    
    .section-content li {
      margin-bottom: 5px;
    }
    
    /* Footer - Security Info */
    .security-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #ccc;
      font-size: 8px;
      color: #999;
      text-align: center;
    }
    
    .security-footer p {
      margin-bottom: 3px;
    }
    
    /* Signature Area */
    .signature-area {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    
    .signature-title {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .signature-row {
      display: flex;
      justify-content: space-between;
      gap: 40px;
    }
    
    .signature-box {
      flex: 1;
    }
    
    .signature-line {
      border-bottom: 1px solid #333;
      height: 40px;
      margin-bottom: 5px;
    }
    
    .signature-label {
      font-size: 10px;
      color: #666;
    }
    
    /* Prose styles */
    .prose h1 { font-size: 20px; margin-bottom: 15px; }
    .prose h2 { font-size: 16px; margin: 20px 0 10px 0; }
    .prose h3 { font-size: 14px; margin: 15px 0 8px 0; }
    .prose p { margin-bottom: 10px; }
    .prose ul { margin: 10px 0 10px 20px; }
    .prose ol { margin: 10px 0 10px 20px; }
    .prose li { margin-bottom: 5px; }
    .prose strong { font-weight: bold; }
    .prose em { font-style: italic; }
    .prose table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .prose th, .prose td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .prose th { background: #f5f5f5; }
  </style>
</head>
<body>
  <!-- Watermark Layer -->
  <div class="watermark">
    ${Array.from({ length: 15 }).map((_, i) => 
      `<div class="watermark-text" style="top: ${i * 15}%; left: -20%;">${watermarkText}</div>`
    ).join('')}
  </div>

  <!-- Header -->
  <div class="header">
    <div>
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : 
        `<div style="font-size: 24px; font-weight: bold; color: #0d9488;">${tenant?.nome || "VISADOCS"}</div>`}
    </div>
    <div class="header-info">
      <div><strong>CNPJ:</strong> ${tenant?.cnpj || "N/A"}</div>
      <div><strong>Responsável:</strong> ${tenant?.responsavel || "N/A"}</div>
      <div><strong>Telefone:</strong> ${tenant?.telefone || "N/A"}</div>
    </div>
  </div>

  <!-- POP Title -->
  <div class="pop-title">
    <div class="pop-code">${pop.codigo}</div>
    <div class="pop-name">${pop.titulo}</div>
    <div class="pop-meta">
      <span><strong>Versão:</strong> ${pop.version}</span>
      <span><strong>Status:</strong> ${pop.status}</span>
      <span><strong>Categoria:</strong> ${pop.categoria}</span>
    </div>
  </div>

  <!-- Objetivo -->
  <div class="section">
    <div class="section-title">1. OBJETIVO</div>
    <div class="section-content prose">
      ${pop.objetivo || "Não definido"}
    </div>
  </div>

  <!-- Descrição -->
  <div class="section">
    <div class="section-title">2. DESCRIÇÃO DO PROCEDIMENTO</div>
    <div class="section-content prose">
      ${pop.descricao || "Não definido"}
    </div>
  </div>

  <!-- Responsabilidades -->
  <div class="section">
    <div class="section-title">3. RESPONSABILIDADES</div>
    <div class="section-content">
      <ul>
        <li><strong>Responsável Técnico:</strong> Supervisão geral do procedimento</li>
        <li><strong>Farmacêutico:</strong> Execução e controle do procedimento</li>
        <li><strong>Operadores:</strong> Execução conforme procedimento estabelecido</li>
      </ul>
    </div>
  </div>

  <!-- Procedimento -->
  <div class="section">
    <div class="section-title">4. PROCEDIMENTO</div>
    <div class="section-content">
      <p>Consultar versão completa no sistema VISADOCS para acesso aos detalhes operacionais.</p>
    </div>
  </div>

  <!-- Anexos -->
  ${pop.documentos?.length > 0 ? `
  <div class="section">
    <div class="section-title">5. DOCUMENTOS RELACIONADOS</div>
    <div class="section-content">
      <ul>
        ${pop.documentos.map((doc: any) => 
          `<li>${doc.titulo} (${doc.tipo})</li>`
        ).join('')}
      </ul>
    </div>
  </div>
  ` : ''}

  <!-- Signature Area -->
  <div class="signature-area">
    <div class="signature-title">5. ASSINATURAS E APROVAÇÃO</div>
    <div class="signature-row">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">
          <strong>Responsável Técnico</strong><br>
          Nome: _________________________<br>
          CRF: _________________________<br>
          Data: ____/____/______
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">
          <strong>Funcionário Treinado</strong><br>
          Nome: _________________________<br>
          Função: ______________________<br>
          Data: ____/____/______
        </div>
      </div>
    </div>
  </div>

  <!-- Security Footer -->
  <div class="security-footer">
    <p><strong>DOCUMENTO CONTROLADO E RASTREÁVEL</strong></p>
    <p>Gerado por: ${metadata.userName} (${metadata.userId}) em ${metadata.timestamp}</p>
    <p>IP: ${metadata.ip} | Tenant: ${tenant?.nome || "N/A"}</p>
    <p>Este documento é de uso exclusivo de ${tenant?.nome || "VISADOCS"}. Proibida a reprodução.</p>
    <p>Hash de Verificação: ${Date.now().toString(36).toUpperCase()}</p>
  </div>
</body>
</html>
  `;
}
