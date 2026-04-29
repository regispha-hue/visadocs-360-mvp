/**
 * Atualizador Automático de POPs
 * Sistema inteligente para atualizar POPs baseado em novas normas regulatórias
 */

import { prisma } from '@/lib/db';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { anvisaScraper } from './anvisa-web-scraper';

interface TemplatePOP {
  codigo: string;
  titulo: string;
  setor: string;
  objetivo: string;
  descricao: string;
  equipeEnvolvida: string[];
  literaturaConsultada: string[];
  validadeAnos: number;
  secoes: {
    [key: string]: {
      titulo: string;
      conteudo: string;
      obrigatorio: boolean;
    };
  };
}

interface RequisitoNorma {
  secao: string;
  requisito: string;
  detalhes: string;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  acaoRecomendada: string;
}

class POPAutoUpdater {
  private static instance: POPAutoUpdater;
  private templates: Map<string, TemplatePOP> = new Map();

  private constructor() {
    this.carregarTemplates();
  }

  static getInstance(): POPAutoUpdater {
    if (!POPAutoUpdater.instance) {
      POPAutoUpdater.instance = new POPAutoUpdater();
    }
    return POPAutoUpdater.instance;
  }

  /**
   * Carrega templates de POPs base
   */
  private carregarTemplates(): void {
    const templatesBase: TemplatePOP[] = [
      {
        codigo: "POP.012",
        titulo: "Manipulação de Substâncias Controladas",
        setor: "Manipulação",
        objetivo: "Estabelecer procedimentos seguros para manipulação de substâncias sujeitas a controle especial",
        descricao: "Este POP descreve os procedimentos para manipulação, armazenamento e controle de substâncias controladas",
        equipeEnvolvida: ["Farmacêutico", "Técnico", "Auxiliar"],
        literaturaConsultada: ["RDC 67/2007", "Portaria 344/98"],
        validadeAnos: 2,
        secoes: {
          "1. OBJETIVO": {
            titulo: "1. OBJETIVO",
            conteudo: "Estabelecer procedimentos seguros para manipulação...",
            obrigatorio: true
          },
          "2. RESPONSABILIDADE": {
            titulo: "2. RESPONSABILIDADE",
            conteudo: "Farmacêutico responsável técnico...",
            obrigatorio: true
          },
          "3. PROCEDIMENTOS": {
            titulo: "3. PROCEDIMENTOS",
            conteudo: "3.1 Recebimento de matéria-prima...",
            obrigatorio: true
          },
          "4. CONTROLES": {
            titulo: "4. CONTROLES",
            conteudo: "4.1 Controle de estoque...",
            obrigatorio: true
          },
          "5. SEGURANÇA": {
            titulo: "5. SEGURANÇA",
            conteudo: "5.1 EPIs obrigatórios...",
            obrigatorio: true
          }
        }
      },
      {
        codigo: "POP.021",
        titulo: "Validação de Métodos Analíticos",
        setor: "Controle de Qualidade",
        objetivo: "Estabelecer procedimentos para validação de métodos analíticos",
        descricao: "Este POP define os requisitos e procedimentos para validação de métodos analíticos",
        equipeEnvolvida: ["Farmacêutico QC", "Analista"],
        literaturaConsultada: ["RDC 67/2007", "RDC 888/2024"],
        validadeAnos: 2,
        secoes: {
          "1. OBJETIVO": {
            titulo: "1. OBJETIVO",
            conteudo: "Estabelecer procedimentos para validação...",
            obrigatorio: true
          },
          "2. ABRANGÊNCIA": {
            titulo: "2. ABRANGÊNCIA",
            conteudo: "Aplica-se a todos os métodos analíticos...",
            obrigatorio: true
          },
          "3. PARÂMETROS": {
            titulo: "3. PARÂMETROS DE VALIDAÇÃO",
            conteudo: "3.1 Especificidade...",
            obrigatorio: true
          },
          "4. PROCEDIMENTOS": {
            titulo: "4. PROCEDIMENTOS",
            conteudo: "4.1 Planejamento da validação...",
            obrigatorio: true
          }
        }
      }
    ];

    templatesBase.forEach(template => {
      this.templates.set(template.codigo, template);
    });
  }

  /**
   * Processa atualização de POPs baseado em nova norma
   */
  async processarAtualizacaoNorma(normaId: string): Promise<void> {
    try {
      console.log(`Processando atualização de POPs para norma ${normaId}`);

      // 1. Buscar norma
      const norma = await prisma.normaRegulatoria.findUnique({
        where: { id: normaId },
        include: {
          atualizacoes: true
        }
      });

      if (!norma) {
        throw new Error(`Norma ${normaId} não encontrada`);
      }

      // 2. Extrair requisitos da norma
      const requisitos = await this.extrairRequisitosNorma(norma);

      // 3. Identificar POPs impactados
      const popsImpactados = await this.identificarPOPsImpactados(norma, requisitos);

      // 4. Atualizar cada POP
      for (const popInfo of popsImpactados) {
        await this.atualizarPOP(popInfo.pop, requisitos, norma);
      }

      console.log(`Atualização concluída: ${popsImpactados.length} POPs atualizados`);

    } catch (error) {
      console.error('Erro ao processar atualização de POPs:', error);
      throw error;
    }
  }

  /**
   * Extrai requisitos estruturados da norma
   */
  private async extrairRequisitosNorma(norma: any): Promise<RequisitoNorma[]> {
    const requisitos: RequisitoNorma[] = [];

    // Análise baseada no conteúdo da norma
    if (norma.conteudo) {
      // Usar IA para extrair requisitos (simulação)
      const requisitosExtraidos = await this.analisarConteudoNormaIA(norma);
      requisitos.push(...requisitosExtraidos);
    }

    // Análise baseada nas atualizações
    if (norma.atualizacoes && norma.atualizacoes.length > 0) {
      for (const atualizacao of norma.atualizacoes) {
        if (atualizacao.detalhes?.acoesNecessarias) {
          atualizacao.detalhes.acoesNecessarias.forEach((acao: string, index: number) => {
            requisitos.push({
              secao: this.identificarSecaoPorAcao(acao),
              requisito: acao,
              detalhes: `Requisito da ${norma.numero} - ${atualizacao.descricao}`,
              prioridade: this.definirPrioridadeAcao(acao),
              acaoRecomendada: acao
            });
          });
        }
      }
    }

    return requisitos;
  }

  /**
   * Analisa conteúdo da norma usando IA (simulação)
   */
  private async analisarConteudoNormaIA(norma: any): Promise<RequisitoNorma[]> {
    // Simulação de análise de conteúdo com IA
    // Em produção, integrar com OpenAI, Claude ou similar
    
    const conteudo = norma.conteudo.toLowerCase();
    const requisitos: RequisitoNorma[] = [];

    // Análise baseada em palavras-chave e padrões
    if (conteudo.includes('validação') || conteudo.includes('método')) {
      requisitos.push({
        secao: 'PROCEDIMENTOS',
        requisito: 'Implementar validação de métodos analíticos',
        detalhes: 'Conforme requisitos da norma',
        prioridade: 'ALTA',
        acaoRecomendada: 'Criar/Atualizar POP de validação'
      });
    }

    if (conteudo.includes('segurança') || conteudo.includes('epi')) {
      requisitos.push({
        secao: 'SEGURANÇA',
        requisito: 'Atualizar procedimentos de segurança',
        detalhes: 'Incluir novos requisitos de EPIs',
        prioridade: 'ALTA',
        acaoRecomendada: 'Revisar seção de segurança'
      });
    }

    if (conteudo.includes('registro') || conteudo.includes('documentação')) {
      requisitos.push({
        secao: 'CONTROLES',
        requisito: 'Implementar novos registros obrigatórios',
        detalhes: 'Conforme especificado na norma',
        prioridade: 'MEDIA',
        acaoRecomendada: 'Criar novos formulários de registro'
      });
    }

    return requisitos;
  }

  /**
   * Identifica seção do POP baseado na ação
   */
  private identificarSecaoPorAcao(acao: string): string {
    const acaoLower = acao.toLowerCase();

    if (acaoLower.includes('trein') || acaoLower.includes('capacit')) {
      return 'TREINAMENTO';
    }
    if (acaoLower.includes('proced') || acaoLower.includes('execut')) {
      return 'PROCEDIMENTOS';
    }
    if (acaoLower.includes('control') || acaoLower.includes('regist')) {
      return 'CONTROLES';
    }
    if (acaoLower.includes('seguran') || acaoLower.includes('epi')) {
      return 'SEGURANÇA';
    }
    if (acaoLower.includes('respons') || acaoLower.includes('atribui')) {
      return 'RESPONSABILIDADE';
    }

    return 'PROCEDIMENTOS';
  }

  /**
   * Define prioridade da ação
   */
  private definirPrioridadeAcao(acao: string): 'ALTA' | 'MEDIA' | 'BAIXA' {
    const acaoLower = acao.toLowerCase();
    const palavrasAlta = ['obrigatório', 'exigência', 'crítico', 'imediato'];
    const palavrasMedia = ['recomendado', 'deverá', 'necessário'];

    if (palavrasAlta.some(p => acaoLower.includes(p))) return 'ALTA';
    if (palavrasMedia.some(p => acaoLower.includes(p))) return 'MEDIA';
    return 'BAIXA';
  }

  /**
   * Identifica POPs que precisam ser atualizados
   */
  private async identificarPOPsImpactados(norma: any, requisitos: RequisitoNorma[]): Promise<any[]> {
    const popsImpactados: any[] = [];

    // 1. POPs explicitamente mencionados na norma
    if (norma.popsImpactados && norma.popsImpactados.length > 0) {
      const popsExplicitos = await prisma.pop.findMany({
        where: {
          codigo: { in: norma.popsImpactados }
        }
      });

      popsImpactados.push(...popsExplicitos.map((pop: any) => ({ pop, tipoImpacto: 'EXPLICITO' })));
    }

    // 2. POPs por categoria/setor
    const tenants = await prisma.tenant.findMany({
      where: { status: 'ATIVO' },
      select: { id: true }
    });

    for (const tenant of tenants) {
      // Buscar POPs por setor relevante
      const setoresRelevantes = this.identificarSetoresRelevantes(norma);
      
      if (setoresRelevantes.length > 0) {
        const popsPorSetor = await prisma.pop.findMany({
          where: {
            tenantId: tenant.id,
            setor: { in: setoresRelevantes }
          }
        });

        popsImpactados.push(...popsPorSetor.map((pop: any) => ({ pop, tipoImpacto: 'SETORIAL' })));
      }

      // 3. POPs por palavras-chave no conteúdo
      const popsPorPalavraChave = await this.buscarPOPsPorPalavrasChave(tenant.id, norma);
      popsImpactados.push(...popsPorPalavraChave.map((pop: any) => ({ pop, tipoImpacto: 'CONTEUDO' })));
    }

    // Remover duplicados
    const unicos = new Map();
    popsImpactados.forEach(item => {
      unicos.set(item.pop.id, item);
    });

    return Array.from(unicos.values());
  }

  /**
   * Identifica setores relevantes baseado na norma
   */
  private identificarSetoresRelevantes(norma: any): string[] {
    const setores: string[] = [];
    const categorias = norma.categorias || [];

    if (categorias.includes('Manipulação')) setores.push('Manipulação');
    if (categorias.includes('Qualidade')) setores.push('Controle de Qualidade');
    if (categorias.includes('Segurança')) setores.push('Segurança');
    if (categorias.includes('Validação')) setores.push('Controle de Qualidade');
    if (categorias.includes('Controlados')) setores.push('Manipulação');

    return setores;
  }

  /**
   * Busca POPs por palavras-chave no conteúdo
   */
  private async buscarPOPsPorPalavrasChave(tenantId: string, norma: any): Promise<any[]> {
    const palavrasChave = this.extrairPalavrasChaveNorma(norma);
    
    if (palavrasChave.length === 0) return [];

    // Construir query de busca
    const condicoes = palavrasChave.map(palavra => ({
      descricao: { contains: palavra, mode: 'insensitive' }
    }));

    return await prisma.pop.findMany({
      where: {
        tenantId,
        OR: condicoes
      }
    });
  }

  /**
   * Extrai palavras-chave da norma
   */
  private extrairPalavrasChaveNorma(norma: any): string[] {
    const texto = `${norma.titulo} ${norma.ementa} ${norma.conteudo || ''}`.toLowerCase();
    const palavrasChave: string[] = [];

    // Lista de palavras-chave relevantes
    const termosRelevantes = [
      'validação', 'método', 'analítico', 'qualidade', 'controle',
      'manipulação', 'segurança', 'epi', 'registro', 'documentação',
      'hormônio', 'antibiótico', 'controlado', 'especial', 'procedimento'
    ];

    termosRelevantes.forEach(termo => {
      if (texto.includes(termo)) {
        palavrasChave.push(termo);
      }
    });

    return palavrasChave;
  }

  /**
   * Atualiza um POP específico
   */
  private async atualizarPOP(pop: any, requisitos: RequisitoNorma[], norma: any): Promise<void> {
    try {
      console.log(`Atualizando POP ${pop.codigo}: ${pop.titulo}`);

      // 1. Criar nova versão
      const novaVersao = this.gerarNovaVersao(pop.versao);

      // 2. Aplicar atualizações no conteúdo
      const conteudoAtualizado = await this.aplicarAtualizacoesConteudo(pop, requisitos);

      // 3. Atualizar POP no banco
      await prisma.pop.update({
        where: { id: pop.id },
        data: {
          versao: novaVersao,
          descricao: conteudoAtualizado.descricao,
          dataRevisao: new Date(),
          validadeAnos: conteudoAtualizado.validadeAnos,
          literaturaConsultada: this.atualizarLiteratura(pop.literaturaConsultada || [], norma.numero),
          controleAlteracoes: this.registrarAlteracao(pop.controleAlteracoes || [], norma, requisitos),
          status: 'ATIVO'
        }
      });

      // 4. Criar auditoria
      await createAuditLog({
        action: AUDIT_ACTIONS.POP_UPDATED,
        entity: 'Pop',
        entityId: pop.id,
        userId: 'system',
        userName: 'Sistema IA',
        tenantId: pop.tenantId,
        details: {
          versaoAntiga: pop.versao,
          versaoNova: novaVersao,
          norma: norma.numero,
          requisitosAplicados: requisitos.length
        }
      });

      // 5. Gerar notificação de treinamento
      await this.gerarNotificacaoTreinamento(pop, norma, requisitos);

      console.log(`POP ${pop.codigo} atualizado com sucesso`);

    } catch (error) {
      console.error(`Erro ao atualizar POP ${pop.codigo}:`, error);
      throw error;
    }
  }

  /**
   * Gera nova versão do POP
   */
  private gerarNovaVersao(versaoAtual: string): string {
    const match = versaoAtual.match(/Rev(\d+)/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      return `Rev${num.toString().padStart(2, '0')}`;
    }
    return 'Rev01';
  }

  /**
   * Aplica atualizações no conteúdo do POP
   */
  private async aplicarAtualizacoesConteudo(pop: any, requisitos: RequisitoNorma[]): Promise<any> {
    let descricao = pop.descricao || '';
    let validadeAnos = pop.validadeAnos || 2;

    // Agrupar requisitos por seção
    const requisitosPorSecao = new Map<string, RequisitoNorma[]>();
    requisitos.forEach(req => {
      if (!requisitosPorSecao.has(req.secao)) {
        requisitosPorSecao.set(req.secao, []);
      }
      requisitosPorSecao.get(req.secao)!.push(req);
    });

    // Aplicar atualizações seção por seção
    requisitosPorSecao.forEach((reqsDaSecao, secao) => {
      const textoSecao = this.gerarTextoSecao(secao, reqsDaSecao);
      
      // Verificar se seção já existe
      const secaoExistente = descricao.includes(`${secao}`);
      
      if (secaoExistente) {
        // Atualizar seção existente
        const regex = new RegExp(`${secao}[^\\n]*\\n([\\s\\S]*?)(?=\\n\\d+\\.|\\n[A-Z]|$)`, 'i');
        descricao = descricao.replace(regex, `${secao}\n${textoSecao}\n`);
      } else {
        // Adicionar nova seção
        descricao += `\n${secao}\n${textoSecao}\n`;
      }

      // Ajustar validade baseado na criticidade
      const hasAltaPrioridade = reqsDaSecao.some(req => req.prioridade === 'ALTA');
      if (hasAltaPrioridade) {
        validadeAnos = Math.min(validadeAnos, 1); // Reduz validade para mudanças críticas
      }
    });

    return {
      descricao,
      validadeAnos
    };
  }

  /**
   * Gera texto para uma seção do POP
   */
  private gerarTextoSecao(secao: string, requisitos: RequisitoNorma[]): string {
    let texto = '';

    requisitos.forEach((req, index) => {
      texto += `${index + 1}. ${req.requisito}\n`;
      if (req.detalhes) {
        texto += `   ${req.detalhes}\n`;
      }
      texto += '\n';
    });

    return texto.trim();
  }

  /**
   * Atualiza literatura consultada
   */
  private atualizarLiteratura(literaturaAtual: string[], novaNorma: string): string[] {
    const literatura = [...literaturaAtual];
    
    if (!literatura.includes(novaNorma)) {
      literatura.push(novaNorma);
    }

    return literatura;
  }

  /**
   * Registra alterações no controle de mudanças
   */
  private registrarAlteracao(controleAtual: any[], norma: any, requisitos: RequisitoNorma[]): any[] {
    const novaAlteracao = {
      data: new Date().toISOString(),
      motivo: `Atualização baseada na ${norma.numero}`,
      descricao: norma.titulo,
      alteracoes: requisitos.map(req => ({
        secao: req.secao,
        descricao: req.requisito,
        prioridade: req.prioridade
      })),
      responsavel: 'Sistema IA',
      aprovadoPor: 'Pendente Aprovação RT'
    };

    return [...controleAtual, novaAlteracao];
  }

  /**
   * Gera notificação de treinamento
   */
  private async gerarNotificacaoTreinamento(pop: any, norma: any, requisitos: RequisitoNorma[]): Promise<void> {
    // Buscar colaboradores que treinaram este POP
    const treinamentos = await prisma.treinamento.findMany({
      where: { popId: pop.id },
      include: { colaborador: true }
    });

    // Gerar notificações (implementar sistema de notificações)
    for (const treinamento of treinamentos) {
      console.log(`Notificação gerada para ${treinamento.colaborador.nome}: POP ${pop.codigo} atualizado`);
      
      // Criar auditoria da notificação
      await createAuditLog({
        action: 'NOTIFICACAO_TREINAMENTO',
        entity: 'Treinamento',
        entityId: treinamento.id,
        userId: 'system',
        userName: 'Sistema IA',
        tenantId: pop.tenantId,
        details: {
          pop: pop.codigo,
          norma: norma.numero,
          colaborador: treinamento.colaborador.nome
        }
      });
    }
  }

  /**
   * Executa atualização automática para todas as normas pendentes
   */
  async executarAtualizacaoAutomatica(): Promise<void> {
    try {
      console.log('Iniciando atualização automática de POPs...');

      // 1. Buscar normas com atualizações não processadas
      const normasPendentes = await prisma.normaRegulatoria.findMany({
        where: {
          status: 'ATUALIZADA',
          atualizacoes: {
            some: {
              status: 'COMUNICADA'
            }
          }
        },
        include: {
          atualizacoes: true
        }
      });

      console.log(`Encontradas ${normasPendentes.length} normas pendentes de processamento`);

      // 2. Processar cada norma
      for (const norma of normasPendentes) {
        await this.processarAtualizacaoNorma(norma.id);
        
        // Marcar como processada
        await prisma.normaRegulatoria.update({
          where: { id: norma.id },
          data: { status: 'ATIVA' }
        });
      }

      console.log('Atualização automática concluída com sucesso');

    } catch (error) {
      console.error('Erro na atualização automática:', error);
      throw error;
    }
  }
}

export const popAutoUpdater = POPAutoUpdater.getInstance();
