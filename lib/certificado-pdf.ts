interface CertificadoPdfData {
  colaboradorNome: string;
  colaboradorFuncao: string;
  popCodigo: string;
  popTitulo: string;
  popSetor: string;
  popVersao?: string;
  nota: number;
  totalQuestoes: number;
  completadoEm: Date | string;
  codigoValidacao: string;
  tenantNome: string;
  tenantCnpj: string;
  responsavelTecnico: string;
}

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

export function generateCertificadoPdfBuffer(data: CertificadoPdfData): Buffer {
  const completedAt = new Date(data.completadoEm);
  const dataFormatada = formatDatePtBr(completedAt);
  const horaFormatada = formatTimePtBr(completedAt);

  const lines: string[] = [];

  // Background and frames
  lines.push("q");
  lines.push("1 1 1 rg");
  lines.push(`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re f`);
  lines.push("0.05 0.58 0.53 RG");
  lines.push("2 w");
  lines.push(`28 28 ${PAGE_WIDTH - 56} ${PAGE_HEIGHT - 56} re S`);
  lines.push("0.82 0.93 0.91 RG");
  lines.push("1 w");
  lines.push(`42 42 ${PAGE_WIDTH - 84} ${PAGE_HEIGHT - 84} re S`);
  lines.push("Q");

  // Header
  textCenter(lines, "VISADOCS", 64, 26, "F2", 0.05, 0.45, 0.43);
  textCenter(lines, "Registro interno de treinamento", 64, 13, "F1", 0.30, 0.36, 0.42);
  textCenter(lines, "Procedimento Operacional Padrao", 88, 16, "F2", 0.10, 0.10, 0.18);

  // Body
  textCenter(lines, "Registra que", 140, 14, "F3", 0.35, 0.35, 0.40);
  textCenter(lines, data.colaboradorNome, 176, 30, "F2", 0.08, 0.10, 0.18);
  textCenter(lines, `${data.colaboradorFuncao} - ${data.tenantNome}`, 206, 12, "F1", 0.30, 0.36, 0.42);

  textCenter(lines, "concluiu a avaliacao interna vinculada ao POP:", 252, 15, "F1", 0.12, 0.12, 0.16);
  textCenter(lines, `${data.popCodigo} - ${data.popTitulo}`, 282, 18, "F2", 0.05, 0.45, 0.43);
  textCenter(lines, `Setor: ${data.popSetor} | Versao POP: ${data.popVersao || "nao informada"}`, 310, 13, "F1", 0.30, 0.36, 0.42);

  // Result box
  roundedBox(lines, 220, 345, 400, 72);
  text(lines, "Nota", 258, 382, 11, "F1", 0.42, 0.45, 0.50);
  text(lines, `${data.nota.toFixed(1)}%`, 250, 360, 20, "F2", 0.05, 0.45, 0.43);

  text(lines, "Questoes", 388, 382, 11, "F1", 0.42, 0.45, 0.50);
  text(lines, `${data.totalQuestoes}`, 405, 360, 20, "F2", 0.05, 0.45, 0.43);

  text(lines, "Data", 515, 382, 11, "F1", 0.42, 0.45, 0.50);
  text(lines, dataFormatada, 480, 362, 13, "F2", 0.05, 0.45, 0.43);

  // Footer
  text(lines, data.tenantNome, 70, 500, 12, "F2", 0.10, 0.10, 0.18);
  text(lines, `CNPJ: ${formatCnpj(data.tenantCnpj)}`, 70, 518, 10, "F1", 0.35, 0.35, 0.40);

  line(lines, 342, 512, 500, 512);
  textCenterAt(lines, data.responsavelTecnico, 421, 530, 11, "F2", 0.10, 0.10, 0.18);
  textCenterAt(lines, "Responsavel Tecnico", 421, 546, 9, "F1", 0.35, 0.35, 0.40);

  textRight(lines, "Codigo de validacao", 770, 500, 9, "F1", 0.42, 0.45, 0.50);
  textRight(lines, data.codigoValidacao, 770, 518, 11, "F2", 0.10, 0.10, 0.18);
  textRight(lines, `${dataFormatada} as ${horaFormatada}`, 770, 536, 9, "F1", 0.42, 0.45, 0.50);

  textCenter(lines, "Registro operacional interno. Nao substitui revisao do Responsavel Tecnico nem representa validacao sanitaria oficial.", 568, 8, "F1", 0.45, 0.45, 0.48);

  return buildPdf(lines.join("\n"));
}

function buildPdf(content: string): Buffer {
  const contentBuffer = Buffer.from(content, "latin1");

  const objects: Buffer[] = [];

  objects.push(Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1"));
  objects.push(Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "latin1"));
  objects.push(Buffer.from(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>`,
    "latin1"
  ));
  objects.push(Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "latin1"));
  objects.push(Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "latin1"));
  objects.push(Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>", "latin1"));
  objects.push(Buffer.concat([
    Buffer.from(`<< /Length ${contentBuffer.length} >>\nstream\n`, "latin1"),
    contentBuffer,
    Buffer.from("\nendstream", "latin1"),
  ]));

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(bufferLength(chunks));
    chunks.push(Buffer.from(`${i + 1} 0 obj\n`, "latin1"));
    chunks.push(objects[i]);
    chunks.push(Buffer.from("\nendobj\n", "latin1"));
  }

  const xrefOffset = bufferLength(chunks);

  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  chunks.push(Buffer.from(xref, "latin1"));

  return Buffer.concat(chunks);
}

function bufferLength(chunks: Buffer[]): number {
  return chunks.reduce((total, chunk) => total + chunk.length, 0);
}

function text(lines: string[], value: string, x: number, yFromTop: number, size: number, font: string, r: number, g: number, b: number): void {
  const y = PAGE_HEIGHT - yFromTop;
  lines.push("BT");
  lines.push(`/${font} ${size} Tf`);
  lines.push(`${r} ${g} ${b} rg`);
  lines.push(`1 0 0 1 ${x} ${y} Tm`);
  lines.push(`${pdfLiteral(value)} Tj`);
  lines.push("ET");
}

function textCenter(lines: string[], value: string, yFromTop: number, size: number, font: string, r: number, g: number, b: number): void {
  const estimatedWidth = normalizePdfText(value).length * size * 0.48;
  text(lines, value, (PAGE_WIDTH - estimatedWidth) / 2, yFromTop, size, font, r, g, b);
}

function textCenterAt(lines: string[], value: string, centerX: number, yFromTop: number, size: number, font: string, r: number, g: number, b: number): void {
  const estimatedWidth = normalizePdfText(value).length * size * 0.48;
  text(lines, value, centerX - estimatedWidth / 2, yFromTop, size, font, r, g, b);
}

function textRight(lines: string[], value: string, rightX: number, yFromTop: number, size: number, font: string, r: number, g: number, b: number): void {
  const estimatedWidth = normalizePdfText(value).length * size * 0.48;
  text(lines, value, rightX - estimatedWidth, yFromTop, size, font, r, g, b);
}

function line(lines: string[], x1: number, y1FromTop: number, x2: number, y2FromTop: number): void {
  lines.push("q");
  lines.push("0.05 0.58 0.53 RG");
  lines.push("1 w");
  lines.push(`${x1} ${PAGE_HEIGHT - y1FromTop} m ${x2} ${PAGE_HEIGHT - y2FromTop} l S`);
  lines.push("Q");
}

function roundedBox(lines: string[], x: number, yFromTop: number, width: number, height: number): void {
  const y = PAGE_HEIGHT - yFromTop - height;
  lines.push("q");
  lines.push("0.95 0.99 0.98 rg");
  lines.push(`${x} ${y} ${width} ${height} re f`);
  lines.push("0.72 0.86 0.84 RG");
  lines.push("1 w");
  lines.push(`${x} ${y} ${width} ${height} re S`);
  lines.push("Q");
}

function pdfLiteral(value: string): string {
  const safe = normalizePdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
  return `(${safe})`;
}

function normalizePdfText(value: string): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "");
}

function formatDatePtBr(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTimePtBr(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCnpj(cnpj: string): string {
  const digits = String(cnpj ?? "").replace(/\D/g, "");

  if (digits.length !== 14) {
    return cnpj || "";
  }

  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
