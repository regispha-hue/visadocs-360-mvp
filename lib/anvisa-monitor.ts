/**
 * Inteligencia Regulatoria Ativa - Radar ANVISA.
 *
 * Coleta candidatos em fontes oficiais, analisa impacto provavel nos POPs do
 * tenant e gera alertas para revisao humana do RT/administrador. A rotina nao
 * altera POPs automaticamente.
 */

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";

type TipoAtualizacao = "NOVA_NORMA" | "ALTERACAO" | "REVOGACAO" | "ORIENTACAO";

interface ANVISANorma {
  numero: string;
  titulo: string;
  tipo: string;
  orgao: string;
  dataPublicacao: Date;
  dataVigencia?: Date;
  ementa?: string;
  conteudo?: string;
  urlOficial?: string;
  categorias: string[];
  aplicabilidade: string[];
}

interface AtualizacaoDetectada {
  tipo: TipoAtualizacao;
  norma: ANVISANorma;
  descricao: string;
  detalhes?: Record<string, unknown>;
  impactoPOPs: string[];
  acoesNecessarias: string[];
}

interface FonteRegulatoria {
  nome: string;
  url: string;
  orgao: "ANVISA" | "DOU";
}

interface MonitorResult {
  modoColeta: "FONTES_OFICIAIS_HTTP";
  fontesConsultadas: number;
  fontesConfiguradas: number;
  candidatosColetados: number;
  atualizacoesDetectadas: number;
  tenantsProcessados: number;
  normasCriadasOuAtualizadas: number;
  alertasCriados: number;
  errosFonte: Array<{ fonte: string; erro: string }>;
}

const FONTES_OFICIAIS: FonteRegulatoria[] = [
  {
    nome: "ANVISA - Noticias",
    orgao: "ANVISA",
    url: "https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa",
  },
  {
    nome: "ANVISA - Legislacao e regulamentacao",
    orgao: "ANVISA",
    url: "https://www.gov.br/anvisa/pt-br/assuntos/regulamentacao/legislacao",
  },
  {
    nome: "Diario Oficial da Uniao - busca ANVISA farmacia manipulacao",
    orgao: "DOU",
    url: "https://www.in.gov.br/consulta/-/buscar/dou?q=ANVISA%20farmacia%20manipulacao%20RDC",
  },
];

function resolverFontesOficiais(): FonteRegulatoria[] {
  const rawSources = process.env.ANVISA_RADAR_SOURCES;
  if (!rawSources) return FONTES_OFICIAIS;

  try {
    const parsed = JSON.parse(rawSources) as Array<Partial<FonteRegulatoria>>;
    const customSources = parsed
      .filter((source) => source.nome && source.url && (source.orgao === "ANVISA" || source.orgao === "DOU"))
      .map((source) => ({
        nome: source.nome!,
        url: source.url!,
        orgao: source.orgao!,
      }));

    return customSources.length ? customSources : FONTES_OFICIAIS;
  } catch (error) {
    console.warn("ANVISA_RADAR_SOURCES invalido; usando fontes padrao.", error);
    return FONTES_OFICIAIS;
  }
}

const TERMOS_REGULATORIOS = [
  "anvisa",
  "rdc",
  "resolucao",
  "resolução",
  "instrucao normativa",
  "instrução normativa",
  "farmacia",
  "farmácia",
  "manipulacao",
  "manipulação",
  "boas praticas",
  "boas práticas",
  "controle de qualidade",
  "calibracao",
  "calibração",
  "temperatura",
  "umidade",
  "agua purificada",
  "água purificada",
  "saneantes",
  "medicamentos",
  "substancias controladas",
  "substâncias controladas",
  "farmacopeia",
  "farmacopeia brasileira",
];

const CATEGORIAS_POR_TERMO: Array<{ termos: string[]; categoria: string; popHints: string[]; acoes: string[] }> = [
  {
    termos: ["manipulacao", "manipulação", "boas praticas", "boas práticas", "rdc 67"],
    categoria: "Boas Praticas de Manipulacao",
    popHints: ["manipulacao", "manipulação", "boas praticas", "boas práticas", "recebimento", "armazenamento"],
    acoes: ["Avaliar impacto nos POPs de manipulacao", "Verificar necessidade de revisao do MBP"],
  },
  {
    termos: ["controle de qualidade", "validacao", "validação", "laudo", "calibracao", "calibração"],
    categoria: "Controle de Qualidade",
    popHints: ["controle de qualidade", "validacao", "validação", "calibracao", "calibração", "laudo"],
    acoes: ["Avaliar POPs de controle de qualidade", "Confirmar registros, criterios e evidencias exigidas"],
  },
  {
    termos: ["temperatura", "umidade", "monitoramento ambiental", "geladeira", "refrigerador"],
    categoria: "Monitoramento Ambiental",
    popHints: ["temperatura", "umidade", "limpeza", "monitoramento", "ambiente"],
    acoes: ["Conferir controles periodicos de temperatura/umidade", "Avaliar necessidade de tarefa recorrente"],
  },
  {
    termos: ["substancias controladas", "substâncias controladas", "portaria 344", "antimicrobiano", "receita"],
    categoria: "Controlados e Prescricao",
    popHints: ["controlad", "antimicrobiano", "receita", "dispensacao", "dispensação"],
    acoes: ["Revisar POPs de receitas e controlados", "Checar registros obrigatorios e livros aplicaveis"],
  },
  {
    termos: ["agua purificada", "água purificada", "agua potavel", "água potável"],
    categoria: "Agua Farmaceutica",
    popHints: ["agua", "água", "purificacao", "purificação", "barrilete", "destilador"],
    acoes: ["Avaliar POPs de agua potavel/purificada", "Verificar periodicidade dos registros de limpeza e ensaios"],
  },
];

function normalizarTexto(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hashCurto(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16).toUpperCase();
}

function limparHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function extrairLinks(html: string, fonte: FonteRegulatoria) {
  const links: Array<{ titulo: string; url: string; fonte: FonteRegulatoria }> = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html))) {
    const url = normalizarUrl(match[1], fonte.url);
    if (!url) continue;

    const titulo = limparHtml(match[2]);
    if (!titulo || titulo.length < 8) continue;

    const textoBusca = normalizarTexto(`${titulo} ${url}`);
    if (!TERMOS_REGULATORIOS.some((termo) => textoBusca.includes(normalizarTexto(termo)))) continue;

    links.push({ titulo: titulo.slice(0, 280), url, fonte });
  }

  return links;
}

function classificarAtualizacao(titulo: string): TipoAtualizacao {
  const texto = normalizarTexto(titulo);
  if (texto.includes("revoga") || texto.includes("revogacao")) return "REVOGACAO";
  if (texto.includes("altera") || texto.includes("alteracao")) return "ALTERACAO";
  if (texto.includes("orienta") || texto.includes("guia") || texto.includes("perguntas")) return "ORIENTACAO";
  return "NOVA_NORMA";
}

function extrairTipoENumero(titulo: string, url: string) {
  const texto = `${titulo} ${url}`;
  const match = texto.match(/\b(RDC|IN|Instrucao Normativa|Instrução Normativa|Portaria|Resolucao|Resolução)\s*(?:n[ºo.]*)?\s*([0-9]{1,5})(?:[./-]([0-9]{4}))?/i);
  if (!match) {
    return {
      tipo: "ATO",
      numero: `ANVISA-${hashCurto(`${titulo}|${url}`)}`,
    };
  }

  const tipo = match[1]
    .replace(/Instrução Normativa/i, "IN")
    .replace(/Instrucao Normativa/i, "IN")
    .replace(/Resolução/i, "RDC")
    .replace(/Resolucao/i, "RDC")
    .toUpperCase();

  return {
    tipo,
    numero: match[3] ? `${tipo} ${match[2]}/${match[3]}` : `${tipo} ${match[2]}`,
  };
}

function classificarCategoriasEAcoes(titulo: string, url: string) {
  const texto = normalizarTexto(`${titulo} ${url}`);
  const categorias = new Set<string>();
  const popHints = new Set<string>();
  const acoes = new Set<string>();

  for (const regra of CATEGORIAS_POR_TERMO) {
    if (regra.termos.some((termo) => texto.includes(normalizarTexto(termo)))) {
      categorias.add(regra.categoria);
      regra.popHints.forEach((hint) => popHints.add(hint));
      regra.acoes.forEach((acao) => acoes.add(acao));
    }
  }

  if (!categorias.size) {
    categorias.add("Regulatorio Farmaceutico");
    acoes.add("Triar relevancia regulatoria para a farmacia");
  }

  acoes.add("Submeter a avaliacao do RT antes de alterar POPs ou treinamentos");

  return {
    categorias: Array.from(categorias),
    popHints: Array.from(popHints),
    acoes: Array.from(acoes),
  };
}

async function buscarHtmlComTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "VISADOCS-360-Regulatory-Radar/1.0 (+https://visadocs-360-mvp.vercel.app)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

class ANVISAMonitor {
  private static instance: ANVISAMonitor;
  private isRunning = false;
  private intervalo: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): ANVISAMonitor {
    if (!ANVISAMonitor.instance) {
      ANVISAMonitor.instance = new ANVISAMonitor();
    }
    return ANVISAMonitor.instance;
  }

  async executarAgora(): Promise<MonitorResult> {
    return this.executarMonitoramento();
  }

  async iniciarMonitoramento(intervaloMinutos: number = 60): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    await this.executarMonitoramento();
    this.intervalo = setInterval(() => {
      this.executarMonitoramento().catch((error) => {
        console.error("Erro no monitor ANVISA:", error);
      });
    }, intervaloMinutos * 60 * 1000);
  }

  pararMonitoramento(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
    this.isRunning = false;
  }

  private async executarMonitoramento(): Promise<MonitorResult> {
    const fontes = resolverFontesOficiais();
    const result: MonitorResult = {
      modoColeta: "FONTES_OFICIAIS_HTTP",
      fontesConsultadas: 0,
      fontesConfiguradas: fontes.length,
      candidatosColetados: 0,
      atualizacoesDetectadas: 0,
      tenantsProcessados: 0,
      normasCriadasOuAtualizadas: 0,
      alertasCriados: 0,
      errosFonte: [],
    };

    const atualizacoes = await this.buscarAtualizacoesRecentes(result, fontes);
    result.atualizacoesDetectadas = atualizacoes.length;

    const impactos = await this.analisarImpactoPOPs(atualizacoes);
    result.tenantsProcessados = new Set(impactos.map((impacto) => impacto.tenantId)).size;

    const alertas = await this.gerarAlertasTenants(impactos);
    result.alertasCriados = alertas.alertasCriados;
    result.normasCriadasOuAtualizadas = alertas.normasCriadasOuAtualizadas;

    return result;
  }

  private async buscarAtualizacoesRecentes(
    result: MonitorResult,
    fontes: FonteRegulatoria[]
  ): Promise<AtualizacaoDetectada[]> {
    const candidatos = new Map<string, AtualizacaoDetectada>();

    for (const fonte of fontes) {
      try {
        const html = await buscarHtmlComTimeout(fonte.url);
        result.fontesConsultadas += 1;

        for (const link of extrairLinks(html, fonte)) {
          const id = hashCurto(`${link.titulo}|${link.url}`);
          if (candidatos.has(id)) continue;

          const { tipo, numero } = extrairTipoENumero(link.titulo, link.url);
          const classificacao = classificarCategoriasEAcoes(link.titulo, link.url);
          const tipoAtualizacao = classificarAtualizacao(link.titulo);

          candidatos.set(id, {
            tipo: tipoAtualizacao,
            norma: {
              numero,
              titulo: link.titulo,
              tipo,
              orgao: fonte.orgao,
              dataPublicacao: new Date(),
              ementa: `Candidato regulatorio coletado em ${fonte.nome}. Revisao humana obrigatoria antes de qualquer alteracao operacional.`,
              conteudo: link.titulo,
              urlOficial: link.url,
              categorias: classificacao.categorias,
              aplicabilidade: ["Farmacias", "Farmacias de manipulacao"],
            },
            descricao: `${tipoAtualizacao.replace("_", " ")} detectada em fonte oficial: ${link.titulo}`,
            detalhes: {
              fonte: fonte.nome,
              url: link.url,
              coleta: "HTTP oficial",
              revisaoHumanaObrigatoria: true,
              popHints: classificacao.popHints,
            },
            impactoPOPs: [],
            acoesNecessarias: classificacao.acoes,
          });
          result.candidatosColetados += 1;
        }
      } catch (error) {
        result.errosFonte.push({
          fonte: fonte.nome,
          erro: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    return Array.from(candidatos.values()).slice(0, 25);
  }

  private async analisarImpactoPOPs(atualizacoes: AtualizacaoDetectada[]) {
    const impactos: Array<{
      tenantId: string;
      tenantNome: string;
      atualizacao: AtualizacaoDetectada;
      popsAfetados: Array<{ id: string; codigo: string; titulo: string; setor: string | null }>;
      severidade: number;
      prioridade: number;
    }> = [];

    if (!atualizacoes.length) return impactos;

    const tenants = await prisma.tenant.findMany({
      where: { status: "ATIVO" },
      select: { id: true, nome: true },
    });

    for (const tenant of tenants) {
      for (const atualizacao of atualizacoes) {
        const hints = ((atualizacao.detalhes?.popHints as string[] | undefined) || []).slice(0, 8);
        const orFilters = hints.flatMap((hint) => [
          { titulo: { contains: hint, mode: "insensitive" as const } },
          { descricao: { contains: hint, mode: "insensitive" as const } },
          { conteudo: { contains: hint, mode: "insensitive" as const } },
          { setor: { contains: hint, mode: "insensitive" as const } },
        ]);

        const popsAfetados = orFilters.length
          ? await prisma.pop.findMany({
              where: {
                tenantId: tenant.id,
                status: "ATIVO",
                OR: orFilters,
              },
              select: { id: true, codigo: true, titulo: true, setor: true },
              take: 20,
            })
          : [];

        atualizacao.impactoPOPs = popsAfetados.map((pop) => pop.codigo);

        impactos.push({
          tenantId: tenant.id,
          tenantNome: tenant.nome,
          atualizacao,
          popsAfetados,
          severidade: this.calcularSeveridade(atualizacao, popsAfetados.length),
          prioridade: this.calcularPrioridade(atualizacao),
        });
      }
    }

    return impactos;
  }

  private async gerarAlertasTenants(
    impactos: Awaited<ReturnType<ANVISAMonitor["analisarImpactoPOPs"]>>
  ): Promise<{ normasCriadasOuAtualizadas: number; alertasCriados: number }> {
    let normasCriadasOuAtualizadas = 0;
    let alertasCriados = 0;

    for (const impacto of impactos) {
      const codigoNorma = `RADAR-ANVISA-${hashCurto(`${impacto.atualizacao.norma.numero}|${impacto.atualizacao.norma.urlOficial || ""}`)}`;

      const normaExistente = await prisma.norma.findFirst({
        where: { tenantId: impacto.tenantId, codigo: codigoNorma },
        select: { id: true },
      });

      const norma = normaExistente
        ? await prisma.norma.update({
            where: { id: normaExistente.id },
            data: {
              numero: impacto.atualizacao.norma.numero,
              titulo: impacto.atualizacao.norma.titulo,
              descricao: this.montarDescricaoNorma(impacto),
              tipo: impacto.atualizacao.norma.tipo,
              dataAtualizacao: new Date(),
            },
          })
        : await prisma.norma.create({
            data: {
              tenantId: impacto.tenantId,
              codigo: codigoNorma,
              numero: impacto.atualizacao.norma.numero,
              titulo: impacto.atualizacao.norma.titulo,
              descricao: this.montarDescricaoNorma(impacto),
              tipo: impacto.atualizacao.norma.tipo,
              versao: "RADAR",
              dataAtualizacao: new Date(),
            },
          });

      normasCriadasOuAtualizadas += 1;

      const alertaAberto = await prisma.alertaNorma.findFirst({
        where: {
          tenantId: impacto.tenantId,
          normaId: norma.id,
          status: { in: ["NOVO", "PENDENTE", "EM_ANALISE"] },
        },
      });

      if (alertaAberto) continue;

      const alerta = await prisma.alertaNorma.create({
        data: {
          tenantId: impacto.tenantId,
          normaId: norma.id,
          tipo: impacto.prioridade >= 4 ? "RADAR_ANVISA_CRITICO" : "RADAR_ANVISA",
          severidade: this.severidadeTexto(impacto.severidade),
          prioridade: impacto.prioridade,
          descricao: this.montarDescricaoAlerta(impacto),
          status: "NOVO",
          dataAlerta: new Date(),
        },
      });

      alertasCriados += 1;

      await createAuditLog({
        action: AUDIT_ACTIONS.LIBRARY_ITEM_CREATED,
        entity: "AlertaNorma",
        entityId: alerta.id,
        userId: "system",
        userName: "Radar ANVISA",
        tenantId: impacto.tenantId,
        details: {
          norma: impacto.atualizacao.norma.numero,
          fonte: impacto.atualizacao.norma.urlOficial,
          popsAfetados: impacto.popsAfetados.map((pop) => pop.codigo),
          revisaoHumanaObrigatoria: true,
        },
      });
    }

    return { normasCriadasOuAtualizadas, alertasCriados };
  }

  private montarDescricaoNorma(impacto: {
    atualizacao: AtualizacaoDetectada;
    popsAfetados: Array<{ codigo: string; titulo: string; setor: string | null }>;
    prioridade: number;
  }) {
    const norma = impacto.atualizacao.norma;
    return [
      impacto.atualizacao.descricao,
      norma.ementa,
      `Fonte oficial: ${norma.urlOficial || "nao informada"}`,
      `Categorias: ${norma.categorias.join(", ")}`,
      `POPs localizados para triagem: ${
        impacto.popsAfetados.length
          ? impacto.popsAfetados.map((pop) => `${pop.codigo} - ${pop.titulo}`).join("; ")
          : "nenhum POP localizado automaticamente"
      }`,
      `Acoes sugeridas: ${impacto.atualizacao.acoesNecessarias.join("; ")}`,
      "A IA/radar apenas sugere triagem. RT ou administrador deve revisar e aprovar antes de qualquer mudanca.",
    ].join("\n");
  }

  private montarDescricaoAlerta(impacto: {
    atualizacao: AtualizacaoDetectada;
    popsAfetados: Array<{ codigo: string; titulo: string; setor: string | null }>;
    prioridade: number;
  }) {
    const pops = impacto.popsAfetados.map((pop) => pop.codigo).join(", ") || "sem correspondencia automatica";
    return [
      `${impacto.atualizacao.norma.numero}: ${impacto.atualizacao.norma.titulo}`,
      impacto.atualizacao.descricao,
      `POPs para triagem: ${pops}.`,
      `Acoes recomendadas: ${impacto.atualizacao.acoesNecessarias.join("; ")}.`,
      `Fonte: ${impacto.atualizacao.norma.urlOficial || "nao informada"}.`,
      "Revisao humana obrigatoria pelo RT/administrador antes de atualizar POPs ou treinamentos.",
    ].join("\n");
  }

  private calcularSeveridade(atualizacao: AtualizacaoDetectada, numPOPs: number): number {
    let base = 1;
    if (atualizacao.tipo === "NOVA_NORMA") base += 2;
    if (atualizacao.tipo === "ALTERACAO") base += 1;
    if (atualizacao.tipo === "REVOGACAO") base += 3;
    base += Math.min(numPOPs, 3);
    if (atualizacao.norma.categorias.some((categoria) => normalizarTexto(categoria).includes("qualidade"))) base += 1;
    if (atualizacao.norma.categorias.some((categoria) => normalizarTexto(categoria).includes("control"))) base += 1;
    return Math.min(base, 5);
  }

  private calcularPrioridade(atualizacao: AtualizacaoDetectada): number {
    let prioridade = 1;
    if (atualizacao.tipo === "NOVA_NORMA") prioridade += 3;
    if (atualizacao.tipo === "ALTERACAO") prioridade += 2;
    if (atualizacao.tipo === "REVOGACAO") prioridade += 4;
    if (atualizacao.norma.categorias.length >= 2) prioridade += 1;
    return Math.min(prioridade, 5);
  }

  private severidadeTexto(score: number) {
    if (score >= 5) return "CRITICA";
    if (score >= 4) return "ALTA";
    if (score >= 3) return "MEDIA";
    return "BAIXA";
  }

  getStatus(): { isRunning: boolean; proximaExecucao?: Date } {
    return {
      isRunning: this.isRunning,
      proximaExecucao: this.intervalo ? new Date(Date.now() + 60 * 60 * 1000) : undefined,
    };
  }
}

export const anvisaMonitor = ANVISAMonitor.getInstance();

export async function executarRadarANVISA(): Promise<MonitorResult> {
  return anvisaMonitor.executarAgora();
}

export async function iniciarMonitoramentoANVISA(): Promise<void> {
  await anvisaMonitor.iniciarMonitoramento(60);
}

export function pararMonitoramentoANVISA(): void {
  anvisaMonitor.pararMonitoramento();
}
