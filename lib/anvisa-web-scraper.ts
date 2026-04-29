/**
 * Web Scraper para monitoramento da ANVISA
 * Busca atualizações regulatórias em tempo real
 */

import { JSDOM } from 'jsdom';
import { prisma } from '@/lib/db';

interface ANVISASource {
  nome: string;
  url: string;
  seletorAtualizacoes: string;
  seletorTitulo: string;
  seletorData: string;
  seletorLink: string;
  frequenciaMinutos: number;
}

class ANVISAScraper {
  private static instance: ANVISAScraper;
  private fontes: ANVISASource[] = [
    {
      nome: "Diário Oficial da União - ANVISA",
      url: "https://www.in.gov.br/pesquisa?search_type=all&pagina=1&orgao=Minist%C3%A9rio%20da%20Sa%C3%BAde&termo_anvisa=ANVISA",
      seletorAtualizacoes: ".result-item",
      seletorTitulo: ".title-marker",
      seletorData: ".published-date",
      seletorLink: "a",
      frequenciaMinutos: 120
    },
    {
      nome: "Portal ANVISA - Normas",
      url: "https://www.gov.br/anvisa/pt-br/assuntos/legislacao/normas",
      seletorAtualizacoes: ".document-item",
      seletorTitulo: ".document-title",
      seletorData: ".document-date",
      seletorLink: "a",
      frequenciaMinutos: 180
    },
    {
      nome: "ANVISA - Consultas Públicas",
      url: "https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/consultas-publicas",
      seletorAtualizacoes: ".consultation-item",
      seletorTitulo: ".consultation-title",
      seletorData: ".consultation-date",
      seletorLink: "a",
      frequenciaMinutos: 240
    }
  ];

  private constructor() {}

  static getInstance(): ANVISAScraper {
    if (!ANVISAScraper.instance) {
      ANVISAScraper.instance = new ANVISAScraper();
    }
    return ANVISAScraper.instance;
  }

  /**
   * Busca atualizações de todas as fontes
   */
  async buscarTodasAtualizacoes(): Promise<any[]> {
    const todasAtualizacoes: any[] = [];

    for (const fonte of this.fontes) {
      try {
        console.log(`Buscando atualizações de: ${fonte.nome}`);
        const atualizacoes = await this.buscarAtualizacoesFonte(fonte);
        todasAtualizacoes.push(...atualizacoes);
      } catch (error) {
        console.error(`Erro ao buscar de ${fonte.nome}:`, error);
      }
    }

    return this.filtrarAtualizacoesRelevantes(todasAtualizacoes);
  }

  /**
   * Busca atualizações de uma fonte específica
   */
  private async buscarAtualizacoesFonte(fonte: ANVISASource): Promise<any[]> {
    try {
      // Em produção, usar um serviço de proxy ou crawling service
      // Por enquanto, simulando dados
      return this.simularBuscaDados(fonte);
    } catch (error) {
      console.error(`Erro ao buscar ${fonte.nome}:`, error);
      return [];
    }
  }

  /**
   * Simulação de busca de dados (substituir com crawling real)
   */
  private async simularBuscaDados(fonte: ANVISASource): Promise<any[]> {
    // Simulação de dados reais da ANVISA
    const dadosSimulados = {
      "Diário Oficial da União - ANVISA": [
        {
          titulo: "RESOLUÇÃO DE DIRETORIA COLEGIADA - RDC N° 888, DE 15 DE ABRIL DE 2024",
          data: new Date("2024-04-15"),
          link: "https://www.in.gov.br/en/web/dou/-/resolucao-de-diretoria-colegiada-rdc-n-888-de-15-de-abril-de-2024-540823456",
          conteudo: "Dispõe sobre a validação de métodos analíticos em farmácias de manipulação",
          tipo: "RDC",
          numero: "RDC 888/2024"
        },
        {
          titulo: "INSTRUÇÃO NORMATIVA - IN N° 58, DE 20 DE MARÇO DE 2024",
          data: new Date("2024-03-20"),
          link: "https://www.in.gov.br/en/web/dou/-/instrucao-normativa-in-n-58-de-20-de-marco-de-2024-539823456",
          conteudo: "Atualiza os requisitos técnicos para manipulação de substâncias sujeitas a controle especial",
          tipo: "IN",
          numero: "IN 58/2024"
        }
      ],
      "Portal ANVISA - Normas": [
        {
          titulo: "RDC 67/2007 - ATUALIZAÇÃO",
          data: new Date("2024-04-10"),
          link: "https://www.gov.br/anvisa/pt-br/assuntos/legislacao/regulamentacoes",
          conteudo: "Nova atualização da RDC 67/2007 sobre boas práticas de manipulação",
          tipo: "RDC",
          numero: "RDC 67/2007"
        }
      ],
      "ANVISA - Consultas Públicas": [
        {
          titulo: "CP 123/2024 - Revisão de POPs de Manipulação",
          data: new Date("2024-04-05"),
          link: "https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/consultas-publicas",
          conteudo: "Consulta pública sobre revisão dos procedimentos operacionais padrão",
          tipo: "CP",
          numero: "CP 123/2024"
        }
      ]
    };

    return dadosSimulados[fonte.nome] || [];
  }

  /**
   * Filtra atualizações relevantes para farmácias de manipulação
   */
  private filtrarAtualizacoesRelevantes(atualizacoes: any[]): any[] {
    const termosRelevantes = [
      "manipulação", "farmácia", "medicamento", "controle de qualidade",
      "pop", "procedimento operacional", "rdc 67", "substância controlada",
      "hormônio", "antibiótico", "validação", "qualidade", "segurança"
    ];

    return atualizacoes.filter(atualizacao => {
      const textoCompleto = `${atualizacao.titulo} ${atualizacao.conteudo}`.toLowerCase();
      return termosRelevantes.some(termo => textoCompleto.includes(termo.toLowerCase()));
    });
  }

  /**
   * Extrai informações estruturadas de uma atualização
   */
  extrairInformacoesEstruturadas(atualizacao: any): any {
    const informacoes = {
      numero: this.extrairNumeroNorma(atualizacao.titulo),
      titulo: atualizacao.titulo,
      tipo: this.extrairTipoNorma(atualizacao.titulo),
      orgao: "ANVISA",
      dataPublicacao: atualizacao.data,
      ementa: atualizacao.conteudo,
      urlOficial: atualizacao.link,
      categorias: this.identificarCategorias(atualizacao),
      aplicabilidade: ["Farmácias", "Distribuidoras"],
      conteudo: atualizacao.conteudo
    };

    return informacoes;
  }

  /**
   * Extrai número da norma do título
   */
  private extrairNumeroNorma(titulo: string): string {
    const padroes = [
      /RDC N°\s*(\d+\/\d{4})/i,
      /IN N°\s*(\d+\/\d{4})/i,
      /CP N°\s*(\d+\/\d{4})/i,
      /PORTARIA N°\s*(\d+\/\d{4})/i
    ];

    for (const padrao of padroes) {
      const match = titulo.match(padrao);
      if (match) return match[1];
    }

    return "Desconhecido";
  }

  /**
   * Extrai tipo da norma
   */
  private extrairTipoNorma(titulo: string): string {
    if (titulo.includes("RDC")) return "RDC";
    if (titulo.includes("IN")) return "IN";
    if (titulo.includes("CP")) return "CP";
    if (titulo.includes("PORTARIA")) return "Portaria";
    if (titulo.includes("RESOLUÇÃO")) return "Resolução";
    return "Outro";
  }

  /**
   * Identifica categorias da norma
   */
  private identificarCategorias(atualizacao: any): string[] {
    const texto = `${atualizacao.titulo} ${atualizacao.conteudo}`.toLowerCase();
    const categorias = [];

    if (texto.includes("manipulação") || texto.includes("farmácia")) {
      categorias.push("Manipulação");
    }
    if (texto.includes("qualidade") || texto.includes("controle")) {
      categorias.push("Qualidade");
    }
    if (texto.includes("segurança") || texto.includes("risco")) {
      categorias.push("Segurança");
    }
    if (texto.includes("validação") || texto.includes("método")) {
      categorias.push("Validação");
    }
    if (texto.includes("controle especial") || texto.includes("substância")) {
      categorias.push("Controlados");
    }

    return categorias.length > 0 ? categorias : ["Geral"];
  }

  /**
   * Verifica se atualização já foi processada
   */
  async verificarAtualizacaoProcessada(numero: string, data: Date): Promise<boolean> {
    const existente = await prisma.normaRegulatoria.findFirst({
      where: {
        numero,
        dataPublicacao: data
      }
    });

    return !!existente;
  }

  /**
   * Salva nova atualização no banco
   */
  async salvarAtualizacao(atualizacao: any): Promise<void> {
    const infoEstruturada = this.extrairInformacoesEstruturadas(atualizacao);

    await prisma.normaRegulatoria.create({
      data: {
        numero: infoEstruturada.numero,
        titulo: infoEstruturada.titulo,
        tipo: infoEstruturada.tipo,
        orgao: infoEstruturada.orgao,
        status: "ATIVA",
        dataPublicacao: infoEstruturada.dataPublicacao,
        ementa: infoEstruturada.ementa,
        urlOficial: infoEstruturada.urlOficial,
        categorias: infoEstruturada.categorias,
        aplicabilidade: infoEstruturada.aplicabilidade,
        conteudo: infoEstruturada.conteudo,
        nivelImpacto: this.calcularImpactoInicial(infoEstruturada),
        complexidade: this.calcularComplexidadeInicial(infoEstruturada)
      }
    });
  }

  /**
   * Calcula impacto inicial baseado na categoria
   */
  private calcularImpactoInicial(info: any): number {
    let impacto = 1;

    if (info.categorias.includes("Segurança")) impacto += 2;
    if (info.categorias.includes("Qualidade")) impacto += 1;
    if (info.categorias.includes("Controlados")) impacto += 2;
    if (info.tipo === "RDC") impacto += 1;

    return Math.min(impacto, 5);
  }

  /**
   * Calcula complexidade inicial
   */
  private calcularComplexidadeInicial(info: any): number {
    let complexidade = 1;

    if (info.categorias.length > 2) complexidade += 1;
    if (info.tipo === "RDC") complexidade += 1;
    if (info.conteudo && info.conteudo.length > 500) complexidade += 1;

    return Math.min(complexidade, 5);
  }
}

export const anvisaScraper = ANVISAScraper.getInstance();
