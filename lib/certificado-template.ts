import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CertificadoData {
  colaboradorNome: string;
  colaboradorFuncao: string;
  popCodigo: string;
  popTitulo: string;
  popSetor: string;
  nota: number;
  acertos: number;
  totalQuestoes: number;
  completadoEm: Date;
  codigoValidacao: string;
  tenantNome: string;
  tenantCnpj: string;
  responsavelTecnico: string;
}

export function generateCertificadoHtml(data: CertificadoData): string {
  const dataFormatada = format(new Date(data.completadoEm), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const horaFormatada = format(new Date(data.completadoEm), "HH:mm", { locale: ptBR });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #fff;
      color: #1a1a2e;
    }

    .certificate {
      width: 297mm;
      height: 210mm;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Decorative border */
    .border-frame {
      position: absolute;
      top: 8mm;
      left: 8mm;
      right: 8mm;
      bottom: 8mm;
      border: 2px solid #0d9488;
      border-radius: 4px;
    }

    .border-frame-inner {
      position: absolute;
      top: 11mm;
      left: 11mm;
      right: 11mm;
      bottom: 11mm;
      border: 1px solid #99f6e4;
      border-radius: 2px;
    }

    /* Corner ornaments */
    .corner {
      position: absolute;
      width: 30px;
      height: 30px;
      border-color: #0d9488;
      border-style: solid;
    }
    .corner-tl { top: 14mm; left: 14mm; border-width: 3px 0 0 3px; }
    .corner-tr { top: 14mm; right: 14mm; border-width: 3px 3px 0 0; }
    .corner-bl { bottom: 14mm; left: 14mm; border-width: 0 0 3px 3px; }
    .corner-br { bottom: 14mm; right: 14mm; border-width: 0 3px 3px 0; }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 120px;
      font-weight: 700;
      color: rgba(13, 148, 136, 0.04);
      letter-spacing: 20px;
      white-space: nowrap;
      font-family: 'Playfair Display', serif;
      pointer-events: none;
    }

    .content {
      position: relative;
      z-index: 1;
      padding: 18mm 24mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 6mm;
    }

    .brand {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 6px;
      color: #0d9488;
      text-transform: uppercase;
      margin-bottom: 2mm;
    }

    .title {
      font-family: 'Playfair Display', serif;
      font-size: 38px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 2px;
      margin-bottom: 1mm;
    }

    .subtitle {
      font-size: 13px;
      font-weight: 400;
      color: #6b7280;
      letter-spacing: 4px;
      text-transform: uppercase;
    }

    .divider {
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, #0d9488, #14b8a6, #0d9488);
      margin: 5mm auto;
      border-radius: 2px;
    }

    /* Body */
    .body {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4mm;
    }

    .certifies {
      font-size: 13px;
      color: #6b7280;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .name {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 600;
      color: #0d9488;
      padding: 2mm 0;
      border-bottom: 2px solid #99f6e4;
      display: inline-block;
    }

    .role {
      font-size: 14px;
      color: #4b5563;
      font-weight: 500;
      margin-top: 1mm;
    }

    .description {
      font-size: 14px;
      color: #374151;
      line-height: 1.7;
      max-width: 600px;
      margin: 3mm auto 0;
    }

    .pop-highlight {
      font-weight: 600;
      color: #0d9488;
    }

    .result-box {
      display: inline-flex;
      align-items: center;
      gap: 16px;
      background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
      border: 1px solid #99f6e4;
      border-radius: 8px;
      padding: 8px 24px;
      margin-top: 3mm;
    }

    .result-item {
      text-align: center;
    }

    .result-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .result-value {
      font-size: 20px;
      font-weight: 700;
      color: #0d9488;
    }

    .result-divider {
      width: 1px;
      height: 32px;
      background: #99f6e4;
    }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
      margin-top: auto;
      padding-top: 6mm;
    }

    .signature {
      text-align: center;
      min-width: 180px;
    }

    .signature-line {
      width: 200px;
      border-top: 1px solid #9ca3af;
      margin-bottom: 2mm;
    }

    .signature-name {
      font-size: 12px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .signature-role {
      font-size: 10px;
      color: #6b7280;
    }

    .validation {
      text-align: right;
    }

    .validation-label {
      font-size: 9px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .validation-code {
      font-size: 11px;
      font-weight: 600;
      color: #0d9488;
      font-family: 'Courier New', monospace;
      letter-spacing: 1px;
    }

    .validation-date {
      font-size: 10px;
      color: #6b7280;
    }

    .tenant-info {
      text-align: left;
      min-width: 180px;
    }

    .tenant-name {
      font-size: 12px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .tenant-cnpj {
      font-size: 10px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border-frame"></div>
    <div class="border-frame-inner"></div>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    <div class="watermark">VISADOCS</div>

    <div class="content">
      <div class="header">
        <div class="brand">VISADOCS</div>
        <div class="title">Microcertificado</div>
        <div class="subtitle">Procedimento Operacional Padr\u00e3o</div>
      </div>

      <div class="divider"></div>

      <div class="body">
        <div class="certifies">Certifica que</div>
        <div class="name">${escapeHtml(data.colaboradorNome)}</div>
        <div class="role">${escapeHtml(data.colaboradorFuncao)} \u2014 ${escapeHtml(data.tenantNome)}</div>

        <div class="description">
          Concluiu com \u00eaxito a avalia\u00e7\u00e3o referente ao<br/>
          <span class="pop-highlight">${escapeHtml(data.popCodigo)} - ${escapeHtml(data.popTitulo)}</span><br/>
          Setor: ${escapeHtml(data.popSetor)}
        </div>

        <div style="display: flex; justify-content: center;">
          <div class="result-box">
            <div class="result-item">
              <div class="result-label">Nota</div>
              <div class="result-value">${data.nota.toFixed(1)}%</div>
            </div>
            <div class="result-divider"></div>
            <div class="result-item">
              <div class="result-label">Acertos</div>
              <div class="result-value">${data.acertos}/${data.totalQuestoes}</div>
            </div>
            <div class="result-divider"></div>
            <div class="result-item">
              <div class="result-label">Data</div>
              <div class="result-value" style="font-size: 14px;">${dataFormatada}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="tenant-info">
          <div class="tenant-name">${escapeHtml(data.tenantNome)}</div>
          <div class="tenant-cnpj">CNPJ: ${formatCnpj(data.tenantCnpj)}</div>
        </div>

        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-name">${escapeHtml(data.responsavelTecnico)}</div>
          <div class="signature-role">Respons\u00e1vel T\u00e9cnico</div>
        </div>

        <div class="validation">
          <div class="validation-label">C\u00f3digo de Valida\u00e7\u00e3o</div>
          <div class="validation-code">${escapeHtml(data.codigoValidacao)}</div>
          <div class="validation-date">${dataFormatada} \u00e0s ${horaFormatada}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCnpj(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return cnpj;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
}
