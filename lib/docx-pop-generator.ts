import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle,
  HeadingLevel, Header, Footer, PageBreak,
  TableOfContents, VerticalAlign, ShadingType,
  convertInchesToTwip, convertMillimetersToTwip,
} from "docx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PopData {
  codigo: string;
  titulo: string;
  setor: string;
  versao: string;
  dataRevisao: string | Date;
  responsavel: string;
  objetivo: string;
  descricao: string;
  equipeEnvolvida?: string | null;
  glossario?: string | null;
  literaturaConsultada?: string | null;
  controleAlteracoes?: any;
  validadoPor?: string | null;
  implantadoEm?: string | Date | null;
  implantadoPor?: string | null;
  validadeAnos?: number | null;
  tenant?: { nome: string } | null;
}

const TEAL = "0d9488";
const DARK = "1f2937";
const LIGHT_GRAY = "f3f4f6";
const WHITE = "ffffff";

function headerTable(pop: PopData): Table {
  return new Table({
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
                  new TextRun({ text: pop.titulo, bold: true, size: 28, color: WHITE, font: "Calibri" }),
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
                  new TextRun({ text: pop.codigo, bold: true, size: 22, color: WHITE, font: "Calibri" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Versão: ${pop.versao}`, size: 18, color: WHITE, font: "Calibri" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
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

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text, size: 22, font: "Calibri", color: DARK }),
    ],
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function splitIntoParagraphs(text: string): Paragraph[] {
  return text.split("\n").filter(l => l.trim()).map(line => bodyParagraph(line));
}

function alteracoesTable(alteracoes: any[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: ["Nº Revisão", "Motivo", "Data", "Responsável"].map(h =>
      new TableCell({
        shading: { type: ShadingType.SOLID, color: TEAL },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: "Calibri" })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      })
    ),
  });

  const dataRows = (alteracoes || []).map((alt: any, idx: number) =>
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(alt.revisao || idx), size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER })],
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: alt.motivo || "", size: 20, font: "Calibri" })] })],
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: alt.data || "", size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER })],
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: alt.responsavel || "", size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER })],
          verticalAlign: VerticalAlign.CENTER,
        }),
      ],
    })
  );

  if (dataRows.length === 0) {
    dataRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "00", size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Implantação inicial", size: 20, font: "Calibri" })] })], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
        ],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

export async function generatePopDocx(pop: PopData): Promise<Buffer> {
  const dataRevisaoStr = pop.dataRevisao
    ? format(new Date(pop.dataRevisao), "dd/MM/yyyy", { locale: ptBR })
    : "";
  const implantadoEmStr = pop.implantadoEm
    ? format(new Date(pop.implantadoEm), "dd/MM/yyyy", { locale: ptBR })
    : "___/___/___";
  const farmaciaName = pop.tenant?.nome || "Farmácia";
  const validadeAnos = pop.validadeAnos || 2;

  const footerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: `Aprovado por: ${pop.validadoPor || ""} `, size: 18, font: "Calibri" })] })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: `Implantado em: ${implantadoEmStr}   Validade: ${validadeAnos < 10 ? "0" + validadeAnos : validadeAnos} Anos`, size: 18, font: "Calibri" })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `Implantado por: ${pop.implantadoPor || ""}`, size: 18, font: "Calibri" })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `Edição: ${pop.versao}`, size: 18, font: "Calibri" })] })],
          }),
        ],
      }),
    ],
  });

  const sections: any[] = [];

  // Main content
  const children: any[] = [
    headerTable(pop),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  // Objetivos
  children.push(sectionTitle("Objetivos"));
  children.push(...splitIntoParagraphs(pop.objetivo));

  // Setor e equipe técnica envolvida
  children.push(sectionTitle("Setor e equipe técnica envolvida"));
  if (pop.equipeEnvolvida) {
    children.push(...splitIntoParagraphs(pop.equipeEnvolvida));
  } else {
    children.push(bodyParagraph(`Setor: ${pop.setor}. Responsável: ${pop.responsavel}.`));
  }

  // Glossário
  if (pop.glossario) {
    children.push(sectionTitle("Glossário"));
    children.push(...splitIntoParagraphs(pop.glossario));
  }

  // Descrição das Atividades
  children.push(sectionTitle("Descrição das Atividades"));
  children.push(...splitIntoParagraphs(pop.descricao));

  // Literatura consultada
  if (pop.literaturaConsultada) {
    children.push(sectionTitle("Literatura consultada"));
    children.push(...splitIntoParagraphs(pop.literaturaConsultada));
  }

  // Controle de alterações
  children.push(sectionTitle("Controle de alterações"));
  children.push(bodyParagraph("Instrumento para Controle de Revisões."));
  const alteracoes = Array.isArray(pop.controleAlteracoes) ? pop.controleAlteracoes : [];
  children.push(alteracoesTable(alteracoes));

  // Validação
  children.push(new Paragraph({ spacing: { before: 300 } }));
  children.push(footerTable);

  sections.push({
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
              new TextRun({ text: `${pop.codigo} - ${pop.titulo}  |  Rev. ${pop.versao}  |  ${dataRevisaoStr}`, size: 16, color: "9ca3af", font: "Calibri" }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
    },
    children,
  });

  const doc = new Document({ sections });
  const buffer = await Packer.toBuffer(doc);
  return buffer as Buffer;
}
