import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle,
  Header, Footer, VerticalAlign, ShadingType,
  convertMillimetersToTwip,
} from "docx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MpData {
  codigo: string;
  nome: string;
  descricao?: string | null;
  casNumber?: string | null;
  dci?: string | null;
  categoria?: string | null;
  unidadeMedida: string;
  estoqueMinimo?: number | null;
  especificacoes?: any;
  status: string;
  fornecedor?: { nome: string } | null;
  tenant?: { nome: string } | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const TEAL = "0d9488";
const DARK = "1f2937";
const WHITE = "ffffff";

function labelValueRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: "f0fdfa" },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 20, font: "Calibri", color: DARK })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [new TextRun({ text: value || "—", size: 20, font: "Calibri", color: DARK })],
          }),
        ],
      }),
    ],
  });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text, bold: true, size: 24, color: TEAL, font: "Calibri" }),
    ],
    spacing: { before: 300, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: TEAL },
    },
  });
}

export async function generateMpDocx(mp: MpData): Promise<Buffer> {
  const farmaciaName = mp.tenant?.nome || "Farmácia";
  const dataAtual = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.SOLID, color: TEAL },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Ficha de Especificação de Matéria-Prima", bold: true, size: 26, color: WHITE, font: "Calibri" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.SOLID, color: DARK },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: mp.codigo, bold: true, size: 22, color: WHITE, font: "Calibri" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      labelValueRow("Nome", mp.nome),
      labelValueRow("Código", mp.codigo),
      labelValueRow("Nº CAS", mp.casNumber || ""),
      labelValueRow("DCI / DCB", mp.dci || ""),
      labelValueRow("Categoria", mp.categoria || ""),
      labelValueRow("Unidade de Medida", mp.unidadeMedida),
      labelValueRow("Estoque Mínimo", mp.estoqueMinimo != null ? String(mp.estoqueMinimo) : ""),
      labelValueRow("Fornecedor", mp.fornecedor?.nome || ""),
      labelValueRow("Status", mp.status),
    ],
  });

  const specs = mp.especificacoes || {};
  const specRows: TableRow[] = [];
  const specFields: [string, string][] = [
    ["Aspecto", specs.aspecto || ""],
    ["Cor", specs.cor || ""],
    ["Odor", specs.odor || ""],
    ["pH", specs.ph || ""],
    ["Densidade", specs.densidade || ""],
    ["Solubilidade", specs.solubilidade || ""],
    ["Ponto de Fusão", specs.pontoFusao || ""],
    ["Teor (%)", specs.teor || ""],
    ["Umidade (%)", specs.umidade || ""],
  ];
  for (const [label, value] of specFields) {
    if (value) specRows.push(labelValueRow(label, value));
  }

  const children: any[] = [
    headerTable,
    new Paragraph({ spacing: { after: 200 } }),
    sectionTitle("Dados Gerais"),
    infoTable,
  ];

  if (mp.descricao) {
    children.push(sectionTitle("Descrição"));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: mp.descricao, size: 22, font: "Calibri", color: DARK })],
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED,
      })
    );
  }

  if (specRows.length > 0) {
    children.push(sectionTitle("Especificações Físico-Químicas"));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: specRows,
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(25),
              bottom: convertMillimetersToTwip(25),
              left: convertMillimetersToTwip(20),
              right: convertMillimetersToTwip(20),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: farmaciaName, bold: true, size: 20, color: TEAL, font: "Calibri" }),
                  new TextRun({ text: "  |  VISADOCS", size: 18, color: "9ca3af", font: "Calibri" }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `Ficha MP: ${mp.codigo} - ${mp.nome}  |  Gerado em: ${dataAtual}`, size: 16, color: "9ca3af", font: "Calibri" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer as Buffer;
}
