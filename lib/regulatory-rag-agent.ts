/**
 * Agente IA para Monitoramento Regulatório (RAG)
 * Consulta regularmente clippings das agências regulatórias para atualizar a biblioteca
 */

import { prisma } from '@/lib/db';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';

interface RAGConfig {
  tenantId: string;
  fontes: FonteRAG[];
  frequenciaConsulta: number; // em horas
  idiomas: string[];
  categoriasInteresse: string[];
  palavrasChave: string[];
  ativo: boolean;
}

interface FonteRAG {
  id: string;
  nome: string;
  tipo: 'ANVISA' | 'MINISTERIO_SAUDE' | 'ANVISA_MEMORIAL' | 'DIARIO_OFICIAL' | 'SITE_PARCEIRO' | 'RSS';
  url: string;
  seletores: {
    titulo: string;
    conteudo: string;
    data: string;
    link: string;
  };
  cabecalhos?: { [key: string]: string };
  frequencia: number; // em horas
  ativa: boolean;
}

interface DocumentoRAG {
  id: string;
  fonteId: string;
  titulo: string;
  conteudo: string;
  dataPublicacao: Date;
  url: string;
  categoria: string;
  relevancia: number;
  palavrasChave: string[];
  resumo: string;
  processado: boolean;
  tenantId?: string;
}

interface AnaliseDocumento {
  documento: DocumentoRAG;
  impacto: ImpactoRegulatorio;
  acoesRecomendadas: string[];
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  popsAfetados: string[];
}

interface ImpactoRegulatorio {
  nivel: 1 | 2 | 3 | 4 | 5;
  tipo: 'NOVA_EXIGENCIA' | 'ALTERACAO' | 'REVOGACAO' | 'ORIENTACAO' | 'INFORMATIVO';
  setoresAfetados: string[];
  complexidade: number;
  prazoImplementacao?: number; // em dias
}

class RegulatoryRAGAgent {
  private static instance: RegulatoryRAGAgent;
  private configuracoes: Map<string, RAGConfig> = new Map();
  private fontesPadrao: FonteRAG[] = [];
  private intervalos: Map<string, any> = new Map();
  private processando: Set<string> = new Set();

  private constructor() {
    this.carregarFontesPadrao();
  }

  static getInstance(): RegulatoryRAGAgent {
    if (!RegulatoryRAGAgent.instance) {
      RegulatoryRAGAgent.instance = new RegulatoryRAGAgent();
    }
    return RegulatoryRAGAgent.instance;
  }

  /**
   * Carrega fontes padrão de monitoramento
   */
  private carregarFontesPadrao(): void {
    this.fontesPadrao = [
      {
        id: 'ANVISA_PORTAL',
        nome: 'Portal ANVISA - Publicações',
        tipo: 'ANVISA',
        url: 'https://www.gov.br/anvisa/pt-br/assuntos/legislacao',
        seletores: {
          titulo: '.document-title',
          conteudo: '.document-content',
          data: '.document-date',
          link: '.document-link'
        },
        frequencia: 24,
        ativa: true
      },
      {
        id: 'DOU_ANVISA',
        nome: 'Diário Oficial - ANVISA',
        tipo: 'DIARIO_OFICIAL',
        url: 'https://www.in.gov.br/assuntos/saude',
        seletores: {
          titulo: '.result-title',
          conteudo: '.result-description',
          data: '.published-date',
          link: '.result-link'
        },
        cabecalhos: {
          'User-Agent': 'Mozilla/5.0 (compatible; VISADOCS-RAG/1.0)'
        },
        frequencia: 12,
        ativa: true
      },
      {
        id: 'ANVISA_RSS',
        nome: 'RSS ANVISA',
        tipo: 'RSS',
        url: 'https://www.gov.br/anvisa/pt-br/assuntos/noticias/rss',
        seletores: {
          titulo: 'item title',
          conteudo: 'item description',
          data: 'item pubDate',
          link: 'item link'
        },
        frequencia: 6,
        ativa: true
      },
      {
        id: 'MEMORIAL_ANVISA',
        nome: 'ANVISA Memorial Descritivo',
        tipo: 'ANVISA_MEMORIAL',
        url: 'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/banco-de-dados-de-medicamentos',
        seletores: {
          titulo: '.memorial-title',
          conteudo: '.memorial-content',
          data: '.memorial-date',
          link: '.memorial-link'
        },
        frequencia: 48,
        ativa: true
      }
    ];
  }

  /**
   * Configura agente RAG para tenant
   */
  async configurarAgente(config: RAGConfig): Promise<void> {
    try {
      // Validar configuração
      this.validarConfiguracao(config);

      // Salvar configuração
      this.configuracoes.set(config.tenantId, config);

      // Iniciar monitoramento se ativo
      if (config.ativo) {
        await this.iniciarMonitoramento(config.tenantId);
      }

      // Criar auditoria
      await createAuditLog({
        action: AUDIT_ACTIONS.POP_CREATED,
        entity: 'RAGAgent',
        entityId: config.tenantId,
        userId: 'system',
        userName: 'Sistema IA',
        tenantId: config.tenantId,
        details: {
          fontes: config.fontes.length,
          frequencia: config.frequenciaConsulta,
          categorias: config.categoriasInteresse.length
        }
      });

      console.log(`Agente RAG configurado para tenant ${config.tenantId}`);

    } catch (error) {
      console.error('Erro ao configurar agente RAG:', error);
      throw error;
    }
  }

  /**
   * Valida configuração do agente
   */
  private validarConfiguracao(config: RAGConfig): void {
    if (!config.tenantId || !config.fontes || config.fontes.length === 0) {
      throw new Error('Configuração inválida: tenantId e fontes são obrigatórios');
    }

    if (config.frequenciaConsulta < 1) {
      throw new Error('Frequência de consulta deve ser maior que 1 hora');
    }

    // Validar fontes
    config.fontes.forEach(fonte => {
      if (!fonte.url || !fonte.seletores.titulo || !fonte.seletores.conteudo) {
        throw new Error(`Fonte ${fonte.nome} incompleta: url e seletores são obrigatórios`);
      }
    });
  }

  /**
   * Inicia monitoramento automático
   */
  async iniciarMonitoramento(tenantId: string): Promise<void> {
    const config = this.configuracoes.get(tenantId);
    if (!config) {
      throw new Error(`Configuração não encontrada para tenant ${tenantId}`);
    }

    // Parar monitoramento anterior se existir
    this.pararMonitoramento(tenantId);

    // Configurar intervalo para cada fonte
    for (const fonte of config.fontes) {
      if (!fonte.ativa) continue;

      const intervalo = setInterval(
        () => this.consultarFonte(tenantId, fonte),
        fonte.frequencia * 60 * 60 * 1000 // converter para milissegundos
      );

      this.intervalos.set(`${tenantId}_${fonte.id}`, intervalo);

      // Executar consulta imediata
      this.consultarFonte(tenantId, fonte);
    }

    console.log(`Monitoramento RAG iniciado para tenant ${tenantId} com ${config.fontes.length} fontes`);
  }

  /**
   * Para monitoramento
   */
  pararMonitoramento(tenantId: string): void {
    const chavesIntervalo = Array.from(this.intervalos.keys()).filter(chave => 
      chave.startsWith(`${tenantId}_`)
    );

    chavesIntervalo.forEach(chave => {
      const intervalo = this.intervalos.get(chave);
      if (intervalo) {
        clearInterval(intervalo);
        this.intervalos.delete(chave);
      }
    });

    console.log(`Monitoramento RAG parado para tenant ${tenantId}`);
  }

  /**
   * Consulta fonte regulatória
   */
  private async consultarFonte(tenantId: string, fonte: FonteRAG): Promise<void> {
    const chaveProcessamento = `${tenantId}_${fonte.id}`;
    
    // Evitar processamento simultâneo
    if (this.processando.has(chaveProcessamento)) {
      console.log(`Fonte ${fonte.nome} já está sendo processada para tenant ${tenantId}`);
      return;
    }

    this.processando.add(chaveProcessamento);

    try {
      console.log(`Consultando fonte ${fonte.nome} para tenant ${tenantId}`);

      // 1. Buscar documentos da fonte
      const documentos = await this.buscarDocumentosFonte(fonte);

      // 2. Filtrar documentos relevantes
      const config = this.configuracoes.get(tenantId)!;
      const documentosRelevantes = await this.filtrarDocumentosRelevantes(documentos, config);

      // 3. Analisar impacto de cada documento
      const analises = await this.analisarDocumentos(documentosRelevantes, config);

      // 4. Gerar ações automáticas
      await this.gerarAcoesAutomaticas(analises, tenantId);

      // 5. Salvar documentos na biblioteca
      await this.salvarDocumentosBiblioteca(documentosRelevantes, tenantId);

      console.log(`Processamento concluído: ${documentosRelevantes.length} documentos relevantes encontrados`);

    } catch (error) {
      console.error(`Erro ao consultar fonte ${fonte.nome}:`, error);
    } finally {
      this.processando.delete(chaveProcessamento);
    }
  }

  /**
   * Busca documentos da fonte
   */
  private async buscarDocumentosFonte(fonte: FonteRAG): Promise<DocumentoRAG[]> {
    try {
      // Simulação de busca - em produção implementar web scraping real
      const documentosSimulados = await this.simularBuscaDocumentos(fonte);
      
      return documentosSimulados.map(doc => ({
        ...doc,
        fonteId: fonte.id,
        processado: false
      }));

    } catch (error) {
      console.error(`Erro ao buscar documentos da fonte ${fonte.nome}:`, error);
      return [];
    }
  }

  /**
   * Simula busca de documentos (substituir com scraping real)
   */
  private async simularBuscaDocumentos(fonte: FonteRAG): Promise<any[]> {
    // Simulação baseada no tipo de fonte
    switch (fonte.tipo) {
      case 'ANVISA':
        return [
          {
            titulo: 'RDC 999/2024 - Novos Requisitos de Manipulação',
            conteudo: 'Estabelece novos requisitos técnicos para manipulação de formulações magistrais, incluindo validação de processos e controles ambientais mais rigorosos...',
            dataPublicacao: new Date(),
            url: 'https://www.gov.br/anvisa/rdc-999-2024',
            categoria: 'Manipulação'
          },
          {
            titulo: 'IN 75/2024 - Atualização de Controle de Qualidade',
            conteudo: 'Atualiza procedimentos de controle de qualidade, incluindo novos métodos de validação e critérios de aceitação mais estritos...',
            dataPublicacao: new Date(Date.now() - 24 * 60 * 60 * 1000),
            url: 'https://www.gov.br/anvisa/in-75-2024',
            categoria: 'Qualidade'
          }
        ];

      case 'DIARIO_OFICIAL':
        return [
          {
            titulo: 'Portaria MS nº 1.234/2024 - Programa de Farmacovigilância',
            conteudo: 'Institui programa nacional de farmacovigilância para farmácias de manipulação com requisitos específicos de notificação...',
            dataPublicacao: new Date(Date.now() - 12 * 60 * 60 * 1000),
            url: 'https://www.in.gov.br/portaria-1234-2024',
            categoria: 'Farmacovigilância'
          }
        ];

      default:
        return [];
    }
  }

  /**
   * Filtra documentos relevantes baseado na configuração
   */
  private async filtrarDocumentosRelevantes(documentos: DocumentoRAG[], config: RAGConfig): Promise<DocumentoRAG[]> {
    const documentosRelevantes: DocumentoRAG[] = [];

    for (const documento of documentos) {
      // Verificar se já foi processado
      const jaProcessado = await this.verificarDocumentoProcessado(documento, config.tenantId);
      if (jaProcessado) continue;

      // Calcular relevância
      const relevancia = await this.calcularRelevancia(documento, config);
      
      if (relevancia >= 0.3) { // Limiar de relevância
        documento.relevancia = relevancia;
        documento.palavrasChave = await this.extrairPalavrasChave(documento);
        documento.resumo = await this.gerarResumo(documento);
        documentosRelevantes.push(documento);
      }
    }

    // Ordenar por relevância
    return documentosRelevantes.sort((a, b) => b.relevancia - a.relevancia);
  }

  /**
   * Verifica se documento já foi processado
   */
  private async verificarDocumentoProcessado(documento: DocumentoRAG, tenantId: string): Promise<boolean> {
    // Implementar verificação no banco
    // Por enquanto, retornar false
    return false;
  }

  /**
   * Calcula relevância do documento
   */
  private async calcularRelevancia(documento: DocumentoRAG, config: RAGConfig): Promise<number> {
    let relevancia = 0;
    const texto = `${documento.titulo} ${documento.conteudo}`.toLowerCase();

    // Relevância por palavras-chave
    config.palavrasChave.forEach(palavra => {
      if (texto.includes(palavra.toLowerCase())) {
        relevancia += 0.2;
      }
    });

    // Relevância por categorias
    if (config.categoriasInteresse.includes(documento.categoria)) {
      relevancia += 0.3;
    }

    // Relevância por termos regulatórios
    const termosRegulatorios = ['rdc', 'portaria', 'instrução normativa', 'resolução', 'anvisa'];
    termosRegulatorios.forEach(termo => {
      if (texto.includes(termo)) {
        relevancia += 0.15;
      }
    });

    // Relevância por recência (documentos mais recentes são mais relevantes)
    const diasDesdePublicacao = Math.floor(
      (Date.now() - documento.dataPublicacao.getTime()) / (24 * 60 * 60 * 1000)
    );
    
    if (diasDesdePublicacao <= 7) relevancia += 0.2;
    else if (diasDesdePublicacao <= 30) relevancia += 0.1;
    else if (diasDesdePublicacao <= 90) relevancia += 0.05;

    return Math.min(relevancia, 1.0);
  }

  /**
   * Extrai palavras-chave do documento
   */
  private async extrairPalavrasChave(documento: DocumentoRAG): Promise<string[]> {
    const texto = `${documento.titulo} ${documento.conteudo}`.toLowerCase();
    const palavrasChave: string[] = [];

    // Lista de termos relevantes
    const termosRelevantes = [
      'manipulação', 'farmácia', 'medicamento', 'controle de qualidade',
      'validação', 'pop', 'procedimento', 'segurança', 'hormônio',
      'antibiótico', 'substância controlada', 'especificação',
      'rdc', 'portaria', 'instrução normativa', 'anvisa'
    ];

    termosRelevantes.forEach(termo => {
      if (texto.includes(termo) && !palavrasChave.includes(termo)) {
        palavrasChave.push(termo);
      }
    });

    return palavrasChave;
  }

  /**
   * Gera resumo do documento
   */
  private async gerarResumo(documento: DocumentoRAG): Promise<string> {
    // Simulação de geração de resumo com IA
    const conteudo = documento.conteudo;
    
    if (conteudo.length <= 200) {
      return conteudo;
    }

    // Extrair primeiras frases importantes
    const frases = conteudo.split('.').filter(f => f.trim().length > 0);
    const resumo = frases.slice(0, 3).join('. ') + '.';
    
    return resumo.length > 300 ? resumo.substring(0, 300) + '...' : resumo;
  }

  /**
   * Analisa impacto dos documentos
   */
  private async analisarDocumentos(documentos: DocumentoRAG[], config: RAGConfig): Promise<AnaliseDocumento[]> {
    const analises: AnaliseDocumento[] = [];

    for (const documento of documentos) {
      const impacto = await this.analisarImpacto(documento);
      const acoesRecomendadas = await this.gerarAcoesRecomendadas(documento, impacto);
      const popsAfetados = await this.identificarPOPsAfetados(documento, config.tenantId);
      const prioridade = this.definirPrioridade(impacto);

      analises.push({
        documento,
        impacto,
        acoesRecomendadas,
        prioridade,
        popsAfetados
      });
    }

    return analises;
  }

  /**
   * Analisa impacto regulatório do documento
   */
  private async analisarImpacto(documento: DocumentoRAG): Promise<ImpactoRegulatorio> {
    const texto = `${documento.titulo} ${documento.conteudo}`.toLowerCase();
    
    // Determinar tipo de impacto
    let tipo: ImpactoRegulatorio['tipo'] = 'INFORMATIVO';
    if (texto.includes('exigência') || texto.includes('obrigatório')) tipo = 'NOVA_EXIGENCIA';
    else if (texto.includes('alteração') || texto.includes('atualização')) tipo = 'ALTERACAO';
    else if (texto.includes('revogação') || texto.includes('cancelamento')) tipo = 'REVOGACAO';
    else if (texto.includes('orientação') || texto.includes('recomendação')) tipo = 'ORIENTACAO';

    // Determinar nível de impacto (1-5)
    let nivel = 1;
    if (tipo === 'NOVA_EXIGENCIA') nivel += 2;
    if (texto.includes('crítico') || texto.includes('urgente')) nivel += 2;
    if (texto.includes('segurança') || texto.includes('risco')) nivel += 1;
    if (texto.includes('obrigatório') || texto.includes('deverá')) nivel += 1;

    // Identificar setores afetados
    const setoresAfetados: string[] = [];
    if (texto.includes('manipulação')) setoresAfetados.push('Manipulação');
    if (texto.includes('qualidade') || texto.includes('controle')) setoresAfetados.push('Controle de Qualidade');
    if (texto.includes('armazenamento') || texto.includes('estoque')) setoresAfetados.push('Armazenamento');
    if (texto.includes('treinamento') || texto.includes('capacitação')) setoresAfetados.push('Treinamento');

    // Calcular complexidade
    let complexidade = 1;
    if (texto.includes('validação') || texto.includes('método')) complexidade += 2;
    if (texto.includes('procedimento') || texto.includes('processo')) complexidade += 1;
    if (setoresAfetados.length > 1) complexidade += 1;

    // Definir prazo de implementação
    let prazoImplementacao: number | undefined;
    if (nivel >= 4) prazoImplementacao = 30; // 30 dias
    else if (nivel >= 3) prazoImplementacao = 60; // 60 dias
    else if (nivel >= 2) prazoImplementacao = 90; // 90 dias

    return {
      nivel: Math.min(nivel, 5) as ImpactoRegulatorio['nivel'],
      tipo,
      setoresAfetados,
      complexidade: Math.min(complexidade, 5),
      prazoImplementacao
    };
  }

  /**
   * Gera ações recomendadas
   */
  private async gerarAcoesRecomendadas(documento: DocumentoRAG, impacto: ImpactoRegulatorio): Promise<string[]> {
    const acoes: string[] = [];

    // Ações baseadas no tipo de impacto
    switch (impacto.tipo) {
      case 'NOVA_EXIGENCIA':
        acoes.push('Criar/Atualizar POPs para atender nova exigência');
        acoes.push('Treinar equipe sobre novos requisitos');
        acoes.push('Atualizar documentação do sistema de qualidade');
        break;

      case 'ALTERACAO':
        acoes.push('Revisar POPs existentes para incorporar alterações');
        acoes.push('Atualizar procedimentos operacionais');
        acoes.push('Comunicar mudanças à equipe');
        break;

      case 'REVOGACAO':
        acoes.push('Remover referências de normas revogadas');
        acoes.push('Atualizar literatura consultada dos POPs');
        acoes.push('Verificar conformidade com novas normas');
        break;

      case 'ORIENTACAO':
        acoes.push('Avaliar aplicabilidade das orientações');
        acoes.push('Implementar melhores práticas sugeridas');
        break;
    }

    // Ações baseadas nos setores afetados
    impacto.setoresAfetados.forEach(setor => {
      if (setor === 'Manipulação') {
        acoes.push('Revisar procedimentos de manipulação');
      } else if (setor === 'Controle de Qualidade') {
        acoes.push('Atualizar métodos de controle de qualidade');
      } else if (setor === 'Armazenamento') {
        acoes.push('Revisar condições de armazenamento');
      }
    });

    return [...new Set(acoes)]; // Remover duplicados
  }

  /**
   * Identifica POPs afetados
   */
  private async identificarPOPsAfetados(documento: DocumentoRAG, tenantId: string): Promise<string[]> {
    // Buscar POPs que possam ser afetados
    const pops = await prisma.pop.findMany({
      where: { tenantId },
      select: { codigo: true, titulo: true, setor: true }
    });

    const popsAfetados: string[] = [];
    const texto = `${documento.titulo} ${documento.conteudo}`.toLowerCase();

    for (const pop of pops) {
      // Verificar relevância por setor
      if (documento.setoresAfetados.includes(pop.setor)) {
        popsAfetados.push(pop.codigo);
        continue;
      }

      // Verificar relevância por conteúdo
      const popTexto = `${pop.titulo}`.toLowerCase();
      if (this.verificarRelevanciaConteudo(texto, popTexto)) {
        popsAfetados.push(pop.codigo);
      }
    }

    return popsAfetados;
  }

  /**
   * Verifica relevância de conteúdo
   */
  private verificarRelevanciaConteudo(textoDoc: string, textoPOP: string): boolean {
    const termosDoc = textoDoc.split(' ');
    const termosPOP = textoPOP.split(' ');

    // Contar termos em comum
    const termosComum = termosDoc.filter(termo => 
      termosPOP.includes(termo) && termo.length > 3
    );

    return termosComum.length >= 2; // Pelo menos 2 termos em comum
  }

  /**
   * Define prioridade da ação
   */
  private definirPrioridade(impacto: ImpactoRegulatorio): 'ALTA' | 'MEDIA' | 'BAIXA' {
    if (impacto.nivel >= 4 || impacto.tipo === 'NOVA_EXIGENCIA') {
      return 'ALTA';
    } else if (impacto.nivel >= 3 || impacto.tipo === 'ALTERACAO') {
      return 'MEDIA';
    } else {
      return 'BAIXA';
    }
  }

  /**
   * Gera ações automáticas de compliance
   */
  private async gerarAcoesAutomaticas(analises: AnaliseDocumento[], tenantId: string): Promise<void> {
    for (const analise of analises) {
      if (analise.prioridade === 'ALTA') {
        // Criar alerta de conformidade
        await this.criarAlertaConformidade(analise, tenantId);

        // Notificar responsáveis
        await this.notificarResponsaveis(analise, tenantId);

        // Agendar tarefas automáticas
        await this.agendarTarefas(analise, tenantId);
      }
    }
  }

  /**
   * Cria alerta de conformidade
   */
  private async criarAlertaConformidade(analise: AnaliseDocumento, tenantId: string): Promise<void> {
    // Implementar criação de alerta no sistema
    console.log(`Alerta de conformidade criado: ${analise.documento.titulo}`);
  }

  /**
   * Notifica responsáveis
   */
  private async notificarResponsaveis(analise: AnaliseDocumento, tenantId: string): Promise<void> {
    // Implementar sistema de notificações
    console.log(`Notificação enviada sobre: ${analise.documento.titulo}`);
  }

  /**
   * Agenda tarefas automáticas
   */
  private async agendarTarefas(analise: AnaliseDocumento, tenantId: string): Promise<void> {
    // Implementar agendamento de tarefas
    console.log(`Tarefas agendadas para: ${analise.documento.titulo}`);
  }

  /**
   * Salva documentos na biblioteca
   */
  private async salvarDocumentosBiblioteca(documentos: DocumentoRAG[], tenantId: string): Promise<void> {
    for (const documento of documentos) {
      try {
        // Marcar como processado
        documento.processado = true;
        documento.tenantId = tenantId;

        // Salvar no banco (implementar tabela específica)
        console.log(`Documento salvo na biblioteca: ${documento.titulo}`);

      } catch (error) {
        console.error(`Erro ao salvar documento ${documento.titulo}:`, error);
      }
    }
  }

  /**
   * Busca documentos na biblioteca
   */
  async buscarDocumentosBiblioteca(tenantId: string, filtros?: any): Promise<DocumentoRAG[]> {
    // Implementar busca no banco
    return [];
  }

  /**
   * Gera relatório de monitoramento
   */
  async gerarRelatorioMonitoramento(tenantId: string, periodo: { inicio: Date; fim: Date }): Promise<any> {
    // Implementar geração de relatório
    return {
      tenantId,
      periodo,
      totalDocumentos: 0,
      documentosRelevantes: 0,
      acoesGeradas: 0,
      fontesConsultadas: 0
    };
  }

  /**
   * Obtém status do agente
   */
  getStatus(tenantId: string): any {
    const config = this.configuracoes.get(tenantId);
    const estaProcessando = Array.from(this.processando.keys()).some(chave => 
      chave.startsWith(`${tenantId}_`)
    );
    const fontesAtivas = this.intervalos.size;

    return {
      configurado: !!config,
      ativo: config?.ativo || false,
      processando: estaProcessando,
      fontesAtivas,
      fontesConfiguradas: config?.fontes.length || 0,
      ultimaAtualizacao: new Date()
    };
  }
}

export const regulatoryRAGAgent = RegulatoryRAGAgent.getInstance();
