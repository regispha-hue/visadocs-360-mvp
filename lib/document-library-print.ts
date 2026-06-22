import { AlignmentType, Document, Footer, Header, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

type PrintableDocument = {
  title: string;
  code?: string | null;
  type?: string | null;
  version?: string | null;
  content?: string | null;
  tenant?: { nome?: string | null } | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

export async function generateLibraryEditableDocx(item: PrintableDocument): Promise<Buffer> {
  const generatedAt = new Date();
  const tenantName = item.tenant?.nome || "Farmácia";
  const version = item.version || "sem versão";
  const title = [item.code, item.title].filter(Boolean).join(" - ");

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: tenantName, bold: true }),
                  new TextRun({ text: ` | Versão ${version} | Gerado em ${formatDateTime(generatedAt)}` }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Documento controlado - Visadocs 360", italics: true })],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: title, bold: true })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Tipo: ${item.type || "Documento"} | Versão vigente: ${version}`, bold: true }),
            ],
          }),
          ...splitContent(item.content || "Documento sem conteúdo textual cadastrado."),
        ],
      },
    ],
  });

  return (await Packer.toBuffer(doc)) as Buffer;
}

export function generateLibraryFinalPdf(item: PrintableDocument): Buffer {
  const generatedAt = new Date();
  const tenantName = item.tenant?.nome || "Farmácia";
  const version = item.version || "sem versão";
  const title = [item.code, item.title].filter(Boolean).join(" - ");
  const content = normalizePdfText(item.content || "Documento sem conteúdo textual cadastrado.");
  const lines: string[] = [];

  lines.push("q");
  lines.push("1 1 1 rg");
  lines.push(`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re f`);
  lines.push("0.05 0.58 0.53 RG");
  lines.push("1.4 w");
  lines.push(`32 32 ${PAGE_WIDTH - 64} ${PAGE_HEIGHT - 64} re S`);
  lines.push("Q");

  text(lines, tenantName, 52, 48, 13, "F2");
  textRight(lines, `Versão ${version}`, PAGE_WIDTH - 52, 48, 10, "F1");
  textRight(lines, `Gerado em ${formatDateTime(generatedAt)}`, PAGE_WIDTH - 52, 64, 9, "F1");
  text(lines, title, 52, 96, 16, "F2");
  text(lines, `Tipo: ${item.type || "Documento"} | Versão vigente: ${version}`, 52, 120, 10, "F1");

  const wrapped = wrap(content.replace(/\r/g, "").split("\n").join(" "), 92).slice(0, 42);
  let y = 154;
  for (const line of wrapped) {
    text(lines, line, 52, y, 10, "F1");
    y += 15;
  }

  textCenter(lines, "Documento controlado - Visadocs 360", PAGE_HEIGHT - 42, 9, "F2");
  return buildPdf(lines.join("\n"));
}

function splitContent(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => new Paragraph({ children: [new TextRun({ text: line })] }));
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function wrap(value: string, max: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (`${current} ${word}`.trim().length > max) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildPdf(content: string): Buffer {
  const contentBuffer = Buffer.from(content, "latin1");
  const objects: Buffer[] = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "latin1"),
    Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`, "latin1"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "latin1"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "latin1"),
    Buffer.concat([Buffer.from(`<< /Length ${contentBuffer.length} >>\nstream\n`, "latin1"), contentBuffer, Buffer.from("\nendstream", "latin1")]),
  ];
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
    chunks.push(Buffer.from(`${i + 1} 0 obj\n`, "latin1"), objects[i], Buffer.from("\nendobj\n", "latin1"));
  }
  const xrefOffset = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(chunks);
}

function text(lines: string[], value: string, x: number, yFromTop: number, size: number, font: string) {
  lines.push("BT", `/${font} ${size} Tf`, "0.10 0.10 0.16 rg", `1 0 0 1 ${x} ${PAGE_HEIGHT - yFromTop} Tm`, `${pdfLiteral(value)} Tj`, "ET");
}

function textRight(lines: string[], value: string, rightX: number, yFromTop: number, size: number, font: string) {
  const width = normalizePdfText(value).length * size * 0.48;
  text(lines, value, rightX - width, yFromTop, size, font);
}

function textCenter(lines: string[], value: string, yFromTop: number, size: number, font: string) {
  const width = normalizePdfText(value).length * size * 0.48;
  text(lines, value, (PAGE_WIDTH - width) / 2, yFromTop, size, font);
}

function pdfLiteral(value: string) {
  return `(${normalizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")})`;
}

function normalizePdfText(value: string) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "");
}
