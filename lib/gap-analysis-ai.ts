/**
 * Sistema de Gap Analysis Automático com IA
 * Analisa os POPs da farmácia e aponta faltas de conformidade
 */

import { prisma } from '@/lib/db';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';

interface GapAnalysisConfig {
  tenantId: string;
  escopo: 'COMPLETO' | 'SETOR' | 'POP_ESPECIFICO';
  setores?: string[];
  pops?: string[];
  normasBase?: string[];
  incluirRecomendacoes: boolean;
  nivelDetalhe: 'BASICO' | 'INTERMEDIARIO' | 'DETALHADO';
}

interface GapIdentificado {
  codigo: string;
  tipo: 'FALTANTE' | 'INCOMPLETO' | 'DESATUALIZADO' | 'NAO_CONFORME';
  severidade: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO';
  descricao: string;
  requisitoNorma: string;
  secaoAfetada?: string;
  impacto: string;
  recomendacao: string;
  prioridade: number;
  evidencias?: string[];
}

interface AnaliseGap {
  tenantId: string;
  dataAnalise: Date;
  escopo: string;
  resumo: {
    totalPOPs: number;
    gapsIdentificados: number;
    gapsCriticos: number;
    conformidadeGeral: number;
    statusGeral: 'CONFORME' | 'PARCIALMENTE_CONFORME' | 'NAO_CONFORME';
  };
  gapsPorSetor: { [setor: string]: GapIdentificado[] };
  gapsPorSeveridade: { [severidade: string]: number };
  gapsPorTipo: { [tipo: string]: number };
  planoAcao: PlanoAcao[];
  recomendacoesEstrategicas: string[];
}

interface PlanoAcao {
  id: string;
  gapId: string;
  descricao: string;
  responsavel: string;
  prazo: Date;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  recursos?: string[];
  kpis?: string[];
}

class GapAnalysisAI {
  private static instance: GapAnalysisAI;
  private normasReferencia: Map<string, any> = new Map();
  private requisitosObrigatorios: Map<string, string[]> = new Map();

  private constructor() {
    this.carregarNormasReferencia();
    this.carregarRequisitosObrigatorios();
  }

  static getInstance(): GapAnalysisAI {
    if (!GapAnalysisAI.instance) {
      GapAnalysisAI.instance = new GapAnalysisAI();
    }
    return GapAnalysisAI.instance;
  }

  /**
   * Carrega normas de referência
   */
  private carregarNormasReferencia(): void {
    // RDC 67/2007 - Boas Práticas de Manipulação
    this.normasReferencia.set('RDC_67_2007', {
      nome: 'RDC 67/2007',
      titulo: 'Boas Práticas de Manipulação em Farmácias',
      secoesObrigatorias: [
        '1. OBJETIVO',
        '2. RESPONSABILIDADE',
        '3. PROCEDIMENTOS',
        '4. CONTROLES',
        '5. SEGURANÇA',
        '6. TREINAMENTO',
        '7. DOCUMENTAÇÃO'
      ],
      requisitosMinimos: {
        'Manipulação': [
          'POP de manipulação de formulações magistrais',
          'POP de manipulação de hormônios',
          'POP de manipulação de antibióticos',
          'POP de manipulação de substâncias controladas',
          'POP de paramentação',
          'POP de higienização das mãos',
          'POP de limpeza e desinfecção'
        ],
        'Controle de Qualidade': [
          'POP de controle de qualidade de matérias-primas',
          'POP de controle de qualidade de produtos acabados',
          'POP de validação de métodos analíticos',
          'POP de calibração de equipamentos',
          'POP de amostragem'
        ],
        'Armazenamento': [
          'POP de armazenamento de matérias-primas',
          'POP de armazenamento de produtos acabados',
          'POP de controle de temperatura e umidade',
          'POP de gestão de estoque'
        ]
      }
    });

    // RDC 888/2024 - Validação de Métodos Analíticos
    this.normasReferencia.set('RDC_888_2024', {
      nome: 'RDC 888/2024',
      titulo: 'Validação de Métodos Analíticos',
      secoesObrigatorias: [
        '1. OBJETIVO',
        '2. ABRANGÊNCIA',
        '3. PARÂMETROS DE VALIDAÇÃO',
        '4. PROCEDIMENTOS',
        '5. CRITÉRIOS DE ACEITAÇÃO',
        '6. DOCUMENTAÇÃO'
      ],
      requisitosMinimos: {
        'Controle de Qualidade': [
          'POP de validação de especificidade',
          'POP de validação de linearidade',
          'POP de validação de precisão',
          'POP de validação de exatidão',
          'POP de validação de robustez',
          'POP de revalidação periódica'
        ]
      }
    });
  }

  /**
   * Carrega requisitos obrigatórios por setor
   */
  private carregarRequisitosObrigatorios(): void {
    this.requisitosObrigatorios.set('Manipulação', [
      'Paramentação adequada',
      'Higienização das mãos',
      'Procedimentos de limpeza',
      'Controle de cruzamento',
      'Registro de manipulação',
      'Verificação de fórmula',
      'Controle de ambiente'
    ]);

    this.requisitosObrigatorios.set('Controle de Qualidade', [
      'Especificações técnicas',
      'Métodos analíticos validados',
      'Equipamentos calibrados',
      'Registro de resultados',
      'Tratamento de desvios',
      'Amostragem representativa',
      'Conservação de amostras'
    ]);

    this.requisitosObrigatorios.set('Armazenamento', [
      'Controle de temperatura',
      'Controle de umidade',
      'FIFO/FEFO',
      'Segregação de produtos',
      'Inspeção de estoque',
      'Controle de pragas',
      'Registro de entrada/saída'
    ]);
  }

  /**
   * Executa análise de gap completa
   */
  async executarAnaliseGap(config: GapAnalysisConfig): Promise<AnaliseGap> {
    try {
      console.log(`Iniciando análise de gap para tenant ${config.tenantId}`);

      // 1. Coletar dados da farmácia
      const dadosFarmacia = await this.coletarDadosFarmacia(config);

      // 2. Analisar conformidade com IA
      const gapsIdentificados = await this.analisarConformidadeIA(dadosFarmacia, config);

      // 3. Agrupar gaps por setor
      const gapsPorSetor = this.agruparGapsPorSetor(gapsIdentificados);

      // 4. Gerar estatísticas
      const estatisticas = this.gerarEstatisticas(gapsIdentificados, dadosFarmacia);

      // 5. Gerar plano de ação
      const planoAcao = await this.gerarPlanoAcao(gapsIdentificados, config);

      // 6. Gerar recomendações estratégicas
      const recomendacoes = await this.gerarRecomendacoesEstrategicas(gapsIdentificados, dadosFarmacia);

      // 7. Montar análise final
      const analise: AnaliseGap = {
        tenantId: config.tenantId,
        dataAnalise: new Date(),
        escopo: config.escopo,
        resumo: estatisticas.resumo,
        gapsPorSetor,
        gapsPorSeveridade: estatisticas.porSeveridade,
        gapsPorTipo: estatisticas.porTipo,
        planoAcao,
        recomendacoesEstrategicas: recomendacoes
      };

      // 8. Salvar análise no banco
      await this.salvarAnalise(analise);

      // 9. Criar auditoria
      await createAuditLog({
        action: 'GAP_ANALYSIS',
        entity: 'GapAnalysis',
        entityId: `${config.tenantId}_${Date.now()}`,
        userId: 'system',
        userName: 'Sistema IA',
        tenantId: config.tenantId,
        details: {
          escopo: config.escopo,
          totalGaps: gapsIdentificados.length,
          gapsCriticos: gapsIdentificados.filter(g => g.severidade === 'CRITICO').length,
          conformidade: estatisticas.resumo.conformidadeGeral
        }
      });

      console.log(`Análise de gap concluída: ${gapsIdentificados.length} gaps identificados`);
      return analise;

    } catch (error) {
      console.error('Erro na análise de gap:', error);
      throw error;
    }
  }

  /**
   * Coleta dados da farmácia para análise
   */
  private async coletarDadosFarmacia(config: GapAnalysisConfig): Promise<any> {
    const whereClause: any = { tenantId: config.tenantId };

    // Filtrar por escopo
    if (config.escopo === 'SETOR' && config.setores) {
      whereClause.setor = { in: config.setores };
    } else if (config.escopo === 'POP_ESPECIFICO' && config.pops) {
      whereClause.codigo = { in: config.pops };
    }

    // POPs
    const pops = await prisma.pop.findMany({
      where: whereClause,
      include: {
        treinamentos: {
          include: { colaborador: true }
        },
        documentos: true
      }
    });

    // Colaboradores
    const colaboradores = await prisma.colaborador.findMany({
      where: { tenantId: config.tenantId },
      include: {
        treinamentos: true
      }
    });

    // Documentos
    const documentos = await prisma.documento.findMany({
      where: { tenantId: config.tenantId }
    });

    // Não conformidades existentes
    const naoConformidades = await prisma.naoConformidade.findMany({
      where: { tenantId: config.tenantId },
      include: { pop: true }
    });

    return {
      pops,
      colaboradores,
      documentos,
      naoConformidades,
      setores: [...new Set(pops.map(p => p.setor))]
    };
  }

  /**
   * Analisa conformidade usando IA
   */
  private async analisarConformidadeIA(dadosFarmacia: any, config: GapAnalysisConfig): Promise<GapIdentificado[]> {
    const gaps: GapIdentificado[] = [];

    // 1. Análise de POPs faltantes
    const gapsFaltantes = await this.analisarPOPsFaltantes(dadosFarmacia);
    gaps.push(...gapsFaltantes);

    // 2. Análise de POPs incompletos
    const gapsIncompletos = await this.analisarPOPsIncompletos(dadosFarmacia);
    gaps.push(...gapsIncompletos);

    // 3. Análise de POPs desatualizados
    const gapsDesatualizados = await this.analisarPOPsDesatualizados(dadosFarmacia);
    gaps.push(...gapsDesatualizados);

    // 4. Análise de conformidade de conteúdo
    const gapsNaoConformes = await this.analisarConformidadeConteudo(dadosFarmacia);
    gaps.push(...gapsNaoConformes);

    // 5. Análise de treinamentos
    const gapsTreinamentos = await this.analisarTreinamentos(dadosFarmacia);
    gaps.push(...gapsTreinamentos);

    // 6. Análise de documentação
    const gapsDocumentacao = await this.analisarDocumentacao(dadosFarmacia);
    gaps.push(...gapsDocumentacao);

    return gaps;
  }

  /**
   * Analisa POPs faltantes
   */
  private async analisarPOPsFaltantes(dadosFarmacia: any): Promise<GapIdentificado[]> {
    const gaps: GapIdentificado[] = [];
    const setoresFarmacia = dadosFarmacia.setores;

    // Para cada norma de referência
    for (const [normaId, norma] of this.normasReferencia.entries()) {
      for (const setor in norma.requisitosMinimos) {
        if (!setoresFarmacia.includes(setor)) continue;

        const requisitosNorma = norma.requisitosMinimos[setor];
        const popsFarmacia = dadosFarmacia.pops.filter((p: any) => p.setor === setor);

        for (const requisito of requisitosNorma) {
          const popExistente = popsFarmacia.find((p: any) => 
            p.titulo.toLowerCase().includes(requisito.toLowerCase()) ||
            p.descricao.toLowerCase().includes(requisito.toLowerCase())
          );

          if (!popExistente) {
            gaps.push({
              codigo: `GAP_FALTANTE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              tipo: 'FALTANTE',
              severidade: this.definirSeveridadeFaltante(setor, requisito),
              descricao: `POP faltante: ${requisito}`,
              requisitoNorma: norma.nome,
              secaoAfetada: setor,
              impacto: `Ausência de procedimento padrão pode comprometer a conformidade com ${norma.nome}`,
              recomendacao: `Criar POP para ${requisito} seguindo requisitos da ${norma.nome}`,
              prioridade: this.calcularPrioridade(setor, 'FALTANTE'),
              evidencias: [`Setor: ${setor}`, `Requisito: ${requisito}`]
            });
          }
        }
      }
    }

    return gaps;
  }

  /**
   * Analisa POPs incompletos
   */
  private async analisarPOPsIncompletos(dadosFarmacia: any): Promise<GapIdentificado[]> {
    const gaps: GapIdentificado[] = [];

    for (const pop of dadosFarmacia.pops) {
      const incompletudes = this.verificarCompletudePOP(pop);

      for (const incompletude of incompletudes) {
        gaps.push({
          codigo: `GAP_INCOMPLETO_${pop.id}_${incompletude.campo}`,
          tipo: 'INCOMPLETO',
          severidade: incompletude.severidade,
          descricao: `POP incompleto: ${pop.codigo} - ${incompletude.descricao}`,
          requisitoNorma: incompletude.norma,
          secaoAfetada: pop.setor,
          impacto: incompletude.impacto,
          recomendacao: incompletude.recomendacao,
          prioridade: this.calcularPrioridade(pop.setor, 'INCOMPLETO'),
          evidencias: [`POP: ${pop.codigo}`, `Campo faltante: ${incompletude.campo}`]
        });
      }
    }

    return gaps;
  }

  /**
   * Verifica completude de um POP
   */
  private verificarCompletudePOP(pop: any): any[] {
    const incompletudes: any[] = [];

    // Verificar campos obrigatórios
    if (!pop.validadoEm) {
      incompletudes.push({
        campo: 'validacao',
        descricao: 'POP não validado',
        severidade: 'ALTO',
        norma: 'RDC 67/2007',
        impacto: 'POP sem validação formal não possui garantia de adequação',
        recomendacao: 'Realizar validação do POP pelo Responsável Técnico'
      });
    }

    if (!pop.implantadoEm) {
      incompletudes.push({
        campo: 'implantacao',
        descricao: 'POP não implantado',
        severidade: 'CRITICO',
        norma: 'RDC 67/2007',
        impacto: 'POP não implantado não está em vigor na farmácia',
        recomendacao: 'Realizar implantação do POP com treinamento da equipe'
      });
    }

    if (!pop.literaturaConsultada || pop.literaturaConsultada.length === 0) {
      incompletudes.push({
        campo: 'literatura',
        descricao: 'Literatura consultada não informada',
        severidade: 'MEDIO',
        norma: 'RDC 67/2007',
        impacto: 'Falta de referência bibliográfica compromete embasamento técnico',
        recomendacao: 'Adicionar literatura consultada pertinente ao tema'
      });
    }

    // Verificar seções obrigatórias
    const secoesObrigatorias = [
      '1. OBJETIVO',
      '2. RESPONSABILIDADE', 
      '3. PROCEDIMENTOS',
      '4. CONTROLES'
    ];

    for (const secao of secoesObrigatorias) {
      if (!pop.descricao || !pop.descricao.includes(secao)) {
        incompletudes.push({
          campo: 'secao',
          descricao: `Seção obrigatória faltante: ${secao}`,
          severidade: 'ALTO',
          norma: 'RDC 67/2007',
          impacto: 'Seção essencial para compreensão e execução do procedimento',
          recomendacao: `Adicionar ${secao} ao conteúdo do POP`
        });
      }
    }

    return incompletudes;
  }

  /**
   * Analisa POPs desatualizados
   */
  private async analisarPOPsDesatualizados(dadosFarmacia: any): Promise<GapIdentificado[]> {
    const gaps: GapIdentificado[] = [];
    const dataLimite = new Date();
    dataLimite.setFullYear(dataLimite.getFullYear() - 2); // 2 anos atrás

    for (const pop of dadosFarmacia.pops) {
      if (pop.dataRevisao && pop.dataRevisao < dataLimite) {
        const mesesDesdeRevisao = Math.floor(
          (Date.now() - pop.dataRevisao.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        gaps.push({
          codigo: `GAP_DESATUALIZADO_${pop.id}`,
          tipo: 'DESATUALIZADO',
          severidade: mesesDesdeRevisao > 36 ? 'CRITICO' : mesesDesdeRevisao > 24 ? 'ALTO' : 'MEDIO',
          descricao: `POP desatualizado: ${pop.codigo} - ${mesesDesdeRevisao} meses sem revisão`,
          requisitoNorma: 'RDC 67/2007',
          secaoAfetada: pop.setor,
          impacto: `POP com ${mesesDesdeRevisao} meses pode não refletir práticas atuais e novas regulamentações`,
          recomendacao: 'Revisar e atualizar o POP, verificando conformidade com normas vigentes',
          prioridade: this.calcularPrioridade(pop.setor, 'DESATUALIZADO'),
          evidencias: [
            `Última revisão: ${pop.dataRevisao.toLocaleDateString('pt-BR')}`,
            `Meses sem revisão: ${mesesDesdeRevisao}`
          ]
        });
      }
    }

    return gaps;
  }

  /**
   * Analisa conformidade do conteúdo dos POPs
   */
  private async analisarConformidadeConteudo(dadosFarmacia: any): Promise<GapIdentificado[]> {
    const gaps: GapIdentificado[] = [];

    for (const pop of dadosFarmacia.pops) {
      const naoConformidades = await this.verificarConformidadeConteudo(pop);

      for (const nc of naoConformidades) {
        gaps.push({
          codigo: `GAP_NAO_CONFORME_${pop.id}_${nc.item}`,
          tipo: 'NAO_CONFORME',
          severidade: nc.severidade,
          descricao: `Não conformidade no POP ${pop.codigo}: ${nc.descricao}`,
          requisitoNorma: nc.norma,
          secaoAfetada: pop.setor,
          impacto: nc.impacto,
          recomendacao: nc.recomendacao,
          prioridade: this.calcularPrioridade(pop.setor, 'NAO_CONFORME'),
          evidencias: nc.evidencias
        });
      }
    }

    return gaps;
  }

  /**
   * Verifica conformidade do conteúdo de um POP
   */
  private async verificarConformidadeConteudo(pop: any): Promise<any[]> {
    const naoConformidades: any[] = [];
    const conteudo = (pop.descricao || '').toLowerCase();

    // Verificar requisitos específicos por setor
    if (pop.setor === 'Manipulação') {
      if (!conteudo.includes('parament') || !conteudo.includes('epi')) {
        naoConformidades.push({
          item: 'paramentacao',
          descricao: 'Não menciona paramentação ou EPIs',
          severidade: 'CRITICO',
          norma: 'RDC 67/2007',
          impacto: 'Risco de contaminação e segurança do manipulador',
          recomendacao: 'Incluir seção específica sobre paramentação e EPIs obrigatórios',
          evidencias: ['Setor: Manipulação', 'Requisito: Segurança do manipulador']
        });
      }

      if (!conteudo.includes('regist')) {
        naoConformidades.push({
          item: 'registro',
          descricao: 'Não menciona registros obrigatórios',
          severidade: 'ALTO',
          norma: 'RDC 67/2007',
          impacto: 'Falta de rastreabilidade das manipulações',
          recomendacao: 'Incluir seção sobre registros obrigatórios e formulários',
          evidencias: ['Setor: Manipulação', 'Requisito: Rastreabilidade']
        });
      }
    }

    if (pop.setor === 'Controle de Qualidade') {
      if (!conteudo.includes('especific') && !conteudo.includes('limite')) {
        naoConformidades.push({
          item: 'especificacoes',
          descricao: 'Não menciona especificações ou limites de aceitação',
          severidade: 'ALTO',
          norma: 'RDC 67/2007',
          impacto: 'Ausência de critérios claros de aprovação/reprovação',
          recomendacao: 'Incluir especificações técnicas e limites de aceitação',
          evidencias: ['Setor: Controle de Qualidade', 'Requisito: Critérios de qualidade']
        });
      }
    }

    return naoConformidades;
  }

  /**
   * Analisa treinamentos
   */
  private async analisarTreinamentos(dadosFarmacia: any): Promise<GapIdentificado[]> {
    const gaps: GapIdentificado[] = [];

    // Verificar colaboradores sem treinamento
    for (const colaborador of dadosFarmacia.colaboradores) {
      if (colaborador.treinamentos.length === 0) {
        gaps.push({
          codigo: `GAP_TREINAMENTO_${colaborador.id}`,
          tipo: 'FALTANTE',
          severidade: 'ALTO',
          descricao: `Colaborador sem treinamento registrado: ${colaborador.nome}`,
          requisitoNorma: 'RDC 67/2007',
          secaoAfetada: 'Treinamento',
          impacto: 'Colaborador não treinado compromete a qualidade e segurança',
          recomendacao: 'Realizar treinamento imediato dos POPs essenciais para a função',
          prioridade: 4,
          evidencias: [`Colaborador: ${colaborador.nome}`, `Função: ${colaborador.funcao}`]
        });
      }
    }

    // Verificar POPs sem treinamento
    for (const pop of dadosFarmacia.pops) {
      if (!pop.treinamentos || pop.treinamentos.length === 0) {
        gaps.push({
          codigo: `GAP_TREINAMENTO_POP_${pop.id}`,
          tipo: 'FALTANTE',
          severidade: 'CRITICO',
          descricao: `POP sem treinamento realizado: ${pop.codigo}`,
          requisitoNorma: 'RDC 67/2007',
          secaoAfetada: pop.setor,
          impacto: 'POP não treinado não está efetivamente implementado',
          recomendacao: 'Realizar treinamento do POP para todos os colaboradores envolvidos',
          prioridade: 5,
          evidencias: [`POP: ${pop.codigo}`, `Setor: ${pop.setor}`]
        });
      }
    }

    return gaps;
  }

  /**
   * Analisa documentação
   */
  private async analisarDocumentacao(dadosFarmacia: any): Promise<GapIdentificado[]> {
    const gaps: GapIdentificado[] = [];

    // Verificar documentos essenciais
    const documentosEssenciais = [
      { tipo: 'RQ', descricao: 'Requisitos de Qualidade' },
      { tipo: 'MBP', descricao: 'Manual de Boas Práticas' }
    ];

    for (const docEssencial of documentosEssenciais) {
      const existente = dadosFarmacia.documentos.find((d: any) => d.tipo === docEssencial.tipo);
      
      if (!existente) {
        gaps.push({
          codigo: `GAP_DOC_${docEssencial.tipo}`,
          tipo: 'FALTANTE',
          severidade: 'CRITICO',
          descricao: `Documento essencial faltante: ${docEssencial.descricao}`,
          requisitoNorma: 'RDC 67/2007',
          secaoAfetada: 'Documentação',
          impacto: 'Ausência de documento base compromete sistema de qualidade',
          recomendacao: `Elaborar e implementar ${docEssencial.descricao}`,
          prioridade: 5,
          evidencias: [`Tipo: ${docEssencial.tipo}`, `Descrição: ${docEssencial.descricao}`]
        });
      }
    }

    return gaps;
  }

  /**
   * Define severidade de gap faltante
   */
  private definirSeveridadeFaltante(setor: string, requisito: string): 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO' {
    const requisitosCriticos = [
      'manipulação', 'controle de qualidade', 'validação', 'segurança'
    ];

    const requisitoLower = requisito.toLowerCase();
    const setorLower = setor.toLowerCase();

    if (requisitosCriticos.some(rc => requisitoLower.includes(rc)) || 
        requisitoLower.includes('obrigatório') || 
        requisitoLower.includes('crítico')) {
      return 'CRITICO';
    }

    if (setorLower === 'manipulação' || setorLower === 'controle de qualidade') {
      return 'ALTO';
    }

    return 'MEDIO';
  }

  /**
   * Calcula prioridade de ação
   */
  private calcularPrioridade(setor: string, tipoGap: string): number {
    let base = 3;

    // Ajuste por setor
    if (setor === 'Manipulação' || setor === 'Controle de Qualidade') {
      base += 2;
    }

    // Ajuste por tipo
    if (tipoGap === 'FALTANTE') base += 2;
    if (tipoGap === 'DESATUALIZADO') base += 1;
    if (tipoGap === 'NAO_CONFORME') base += 1;

    return Math.min(base, 5);
  }

  /**
   * Agrupa gaps por setor
   */
  private agruparGapsPorSetor(gaps: GapIdentificado[]): { [setor: string]: GapIdentificado[] } {
    const agrupados: { [setor: string]: GapIdentificado[] } = {};

    for (const gap of gaps) {
      const setor = gap.secaoAfetada || 'Geral';
      if (!agrupados[setor]) {
        agrupados[setor] = [];
      }
      agrupados[setor].push(gap);
    }

    return agrupados;
  }

  /**
   * Gera estatísticas da análise
   */
  private gerarEstatisticas(gaps: GapIdentificado[], dadosFarmacia: any): any {
    const totalPOPs = dadosFarmacia.pops.length;
    const gapsCriticos = gaps.filter(g => g.severidade === 'CRITICO').length;
    const conformidadeGeral = totalPOPs > 0 ? 
      Math.max(0, 100 - (gaps.length / totalPOPs * 100)) : 0;

    let statusGeral: 'CONFORME' | 'PARCIALMENTE_CONFORME' | 'NAO_CONFORME';
    if (conformidadeGeral >= 95 && gapsCriticos === 0) {
      statusGeral = 'CONFORME';
    } else if (conformidadeGeral >= 70 && gapsCriticos <= 2) {
      statusGeral = 'PARCIALMENTE_CONFORME';
    } else {
      statusGeral = 'NAO_CONFORME';
    }

    // Agrupar por severidade
    const porSeveridade: { [key: string]: number } = gaps.reduce((acc, gap) => {
      acc[gap.severidade] = (acc[gap.severidade] || 0) + 1;
      return acc;
    }, {});

    // Agrupar por tipo
    const porTipo: { [key: string]: number } = gaps.reduce((acc, gap) => {
      acc[gap.tipo] = (acc[gap.tipo] || 0) + 1;
      return acc;
    }, {});

    return {
      resumo: {
        totalPOPs,
        gapsIdentificados: gaps.length,
        gapsCriticos,
        conformidadeGeral: Math.round(conformidadeGeral),
        statusGeral
      },
      porSeveridade,
      porTipo
    };
  }

  /**
   * Gera plano de ação
   */
  private async gerarPlanoAcao(gaps: GapIdentificado[], config: GapAnalysisConfig): Promise<PlanoAcao[]> {
    const plano: PlanoAcao[] = [];

    // Ordenar gaps por prioridade
    const gapsOrdenados = gaps.sort((a, b) => b.prioridade - a.prioridade);

    for (const gap of gapsOrdenados.slice(0, 20)) { // Limitar a 20 ações mais críticas
      plano.push({
        id: `ACAO_${gap.codigo}`,
        gapId: gap.codigo,
        descricao: gap.recomendacao,
        responsavel: this.definirResponsavel(gap),
        prazo: this.calcularPrazo(gap),
        prioridade: gap.prioridade >= 4 ? 'ALTA' : gap.prioridade >= 3 ? 'MEDIA' : 'BAIXA',
        status: 'PENDENTE',
        recursos: this.definirRecursos(gap),
        kpis: this.definirKPIs(gap)
      });
    }

    return plano;
  }

  /**
   * Define responsável pela ação
   */
  private definirResponsavel(gap: GapIdentificado): string {
    if (gap.secaoAfetada === 'Manipulação') return 'Responsável Técnico';
    if (gap.secaoAfetada === 'Controle de Qualidade') return 'Analista de Controle de Qualidade';
    if (gap.tipo === 'FALTANTE') return 'Administrador da Farmácia';
    return 'Responsável Técnico';
  }

  /**
   * Calcula prazo para ação
   */
  private calcularPrazo(gap: GapIdentificado): Date {
    const hoje = new Date();
    let diasPrazo = 30; // Padrão

    if (gap.severidade === 'CRITICO') diasPrazo = 7;
    else if (gap.severidade === 'ALTO') diasPrazo = 15;
    else if (gap.severidade === 'MEDIO') diasPrazo = 30;
    else if (gap.severidade === 'BAIXO') diasPrazo = 60;

    const prazo = new Date(hoje);
    prazo.setDate(prazo.getDate() + diasPrazo);
    return prazo;
  }

  /**
   * Define recursos necessários
   */
  private definirRecursos(gap: GapIdentificado): string[] {
    const recursos = [];

    if (gap.tipo === 'FALTANTE') {
      recursos.push('Equipe técnica', 'Template de POP', 'Revisão normativa');
    }

    if (gap.tipo === 'INCOMPLETO') {
      recursos.push('Revisão do POP', 'Validação técnica');
    }

    if (gap.tipo === 'DESATUALIZADO') {
      recursos.push('Atualização normativa', 'Revisão do conteúdo');
    }

    if (gap.secaoAfetada === 'Treinamento') {
      recursos.push('Instrutor', 'Material de treinamento', 'Tempo dos colaboradores');
    }

    return recursos;
  }

  /**
   * Define KPIs para acompanhamento
   */
  private definirKPIs(gap: GapIdentificado): string[] {
    const kpis = [];

    if (gap.tipo === 'FALTANTE') {
      kpis.push('POP criado e validado', 'Equipe treinada');
    }

    if (gap.tipo === 'INCOMPLETO') {
      kpis.push('POP revisado e aprovado', 'Campos obrigatórios preenchidos');
    }

    if (gap.tipo === 'DESATUALIZADO') {
      kpis.push('POP atualizado', 'Nova versão implantada');
    }

    if (gap.secaoAfetada === 'Treinamento') {
      kpis.push('100% dos colaboradores treinados', 'Avaliação de aprendizado > 70%');
    }

    return kpis;
  }

  /**
   * Gera recomendações estratégicas
   */
  private async gerarRecomendacoesEstrategicas(gaps: GapIdentificado[], dadosFarmacia: any): Promise<string[]> {
    const recomendacoes: string[] = [];

    // Análise de padrões
    const gapsPorSetor = this.agruparGapsPorSetor(gaps);
    const gapsCriticos = gaps.filter(g => g.severidade === 'CRITICO');

    // Recomendações baseadas nos gaps
    if (gapsCriticos.length > 5) {
      recomendacoes.push('Priorizar ações corretivas imediatas para gaps críticos de conformidade');
    }

    if (gapsPorSetor['Manipulação'] && gapsPorSetor['Manipulação'].length > 3) {
      recomendacoes.push('Revisar estrutura completa do setor de Manipulação para garantir conformidade');
    }

    if (gapsPorSetor['Treinamento'] && gapsPorSetor['Treinamento'].length > 2) {
      recomendacoes.push('Implementar programa sistemático de treinamento e reciclagem');
    }

    const gapsFaltantes = gaps.filter(g => g.tipo === 'FALTANTE');
    if (gapsFaltantes.length > gaps.length * 0.3) {
      recomendacoes.push('Desenvolver plano de expansão do sistema de POPs para cobrir todas as atividades críticas');
    }

    // Recomendações estratégicas gerais
    recomendacoes.push('Estabelecer calendário periódico de revisão de POPs (mínimo bienal)');
    recomendacoes.push('Implementar sistema de monitoramento contínuo de conformidade');
    recomendacoes.push('Criar comitê de qualidade para revisar e aprovar melhorias');

    return recomendacoes;
  }

  /**
   * Salva análise no banco
   */
  private async salvarAnalise(analise: AnaliseGap): Promise<void> {
    // Implementar salvamento em tabela específica
    console.log(`Análise de gap salva para tenant ${analise.tenantId}`);
  }

  /**
   * Busca análises anteriores
   */
  async buscarAnalisesAnteriores(tenantId: string, limite: number = 5): Promise<AnaliseGap[]> {
    // Implementar busca no banco
    return [];
  }

  /**
   * Compara evolução da conformidade
   */
  async compararEvolucao(tenantId: string): Promise<any> {
    const analises = await this.buscarAnalisesAnteriores(tenantId, 10);
    
    if (analises.length < 2) {
      return { mensagem: 'Análises insuficientes para comparação' };
    }

    const maisRecente = analises[0];
    const maisAntiga = analises[analises.length - 1];

    return {
      periodo: {
        inicio: maisAntiga.dataAnalise,
        fim: maisRecente.dataAnalise
      },
      evolucao: {
        conformidade: {
          anterior: maisAntiga.resumo.conformidadeGeral,
          atual: maisRecente.resumo.conformidadeGeral,
          variacao: maisRecente.resumo.conformidadeGeral - maisAntiga.resumo.conformidadeGeral
        },
        gaps: {
          anterior: maisAntiga.resumo.gapsIdentificados,
          atual: maisRecente.resumo.gapsIdentificados,
          variacao: maisRecente.resumo.gapsIdentificados - maisAntiga.resumo.gapsIdentificados
        },
        criticos: {
          anterior: maisAntiga.resumo.gapsCriticos,
          atual: maisRecente.resumo.gapsCriticos,
          variacao: maisRecente.resumo.gapsCriticos - maisAntiga.resumo.gapsCriticos
        }
      },
      tendencia: this.classificarTendencia(maisRecente.resumo.conformidadeGeral, maisAntiga.resumo.conformidadeGeral)
    };
  }

  /**
   * Classifica tendência de evolução
   */
  private classificarTendencia(atual: number, anterior: number): 'MELHORANDO' | 'ESTAVEL' | 'PIORANDO' {
    const variacao = atual - anterior;
    
    if (variacao > 5) return 'MELHORANDO';
    if (variacao < -5) return 'PIORANDO';
    return 'ESTAVEL';
  }
}

export const gapAnalysisAI = GapAnalysisAI.getInstance();
