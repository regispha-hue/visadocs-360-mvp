/**
 * Sistema de Integração com ERPs
 * Conecta VISADOCS com os principais ERPs do nicho farmacêutico
 */

import { prisma } from '@/lib/db';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';

interface ERPConfig {
  nome: string;
  tipo: 'OUROFORMULAS' | 'FARMACIAS' | 'SMARTPHARMA' | 'DATASUS' | 'CUSTOM';
  url: string;
  apiKey?: string;
  usuario?: string;
  senha?: string;
  token?: string;
  ativo: boolean;
  configuracoesAdicionais?: any;
}

interface MapeamentoCampo {
  campoOrigem: string;
  campoDestino: string;
  transformacao?: (valor: any) => any;
  obrigatorio: boolean;
}

interface DadosSincronizacao {
  tenantId: string;
  erpConfig: ERPConfig;
  dados: any;
  ultimaSincronizacao?: Date;
}

class ERPIntegration {
  private static instance: ERPIntegration;
  private configuracoes: Map<string, ERPConfig> = new Map();
  private mapeamentos: Map<string, MapeamentoCampo[]> = new Map();

  private constructor() {
    this.inicializarMapeamentos();
  }

  static getInstance(): ERPIntegration {
    if (!ERPIntegration.instance) {
      ERPIntegration.instance = new ERPIntegration();
    }
    return ERPIntegration.instance;
  }

  /**
   * Inicializa mapeamentos de campos para cada ERP
   */
  private inicializarMapeamentos(): void {
    // Mapeamento para OuroFórmulas
    this.mapeamentos.set('OUROFORMULAS', [
      { campoOrigem: 'id_produto', campoDestino: 'codigo', obrigatorio: true },
      { campoOrigem: 'descricao', campoDestino: 'nome', obrigatorio: true },
      { campoOrigem: 'principio_ativo', campoDestino: 'dci', obrigatorio: false },
      { campoOrigem: 'categoria', campoDestino: 'categoria', obrigatorio: true },
      { campoOrigem: 'unidade', campoDestino: 'unidadeMedida', obrigatorio: true },
      { campoOrigem: 'estoque_minimo', campoDestino: 'estoqueMinimo', obrigatorio: false },
      { campoOrigem: 'fornecedor_id', campoDestino: 'fornecedorId', obrigatorio: false },
      { campoOrigem: 'controlado', campoDestino: 'controlado', transformacao: (v) => v === 'S', obrigatorio: false }
    ]);

    // Mapeamento para Farmácias ERP
    this.mapeamentos.set('FARMACIAS', [
      { campoOrigem: 'produto_codigo', campoDestino: 'codigo', obrigatorio: true },
      { campoOrigem: 'produto_nome', campoDestino: 'nome', obrigatorio: true },
      { campoOrigem: 'produto_descricao', campoDestino: 'descricao', obrigatorio: false },
      { campoOrigem: 'produto_categoria', campoDestino: 'categoria', obrigatorio: true },
      { campoOrigem: 'produto_unidade', campoDestino: 'unidadeMedida', obrigatorio: true },
      { campoOrigem: 'produto_estoque_min', campoDestino: 'estoqueMinimo', obrigatorio: false }
    ]);

    // Mapeamento para SmartPharma
    this.mapeamentos.set('SMARTPHARMA', [
      { campoOrigem: 'cod_produto', campoDestino: 'codigo', obrigatorio: true },
      { campoOrigem: 'nome_produto', campoDestino: 'nome', obrigatorio: true },
      { campoOrigem: 'desc_produto', campoDestino: 'descricao', obrigatorio: false },
      { campoOrigem: 'categoria_produto', campoDestino: 'categoria', obrigatorio: true },
      { campoOrigem: 'un_medida', campoDestino: 'unidadeMedida', obrigatorio: true }
    ]);
  }

  /**
   * Configura integração com ERP
   */
  async configurarERP(tenantId: string, config: ERPConfig): Promise<void> {
    try {
      // Validar configuração
      await this.validarConfiguracaoERP(config);

      // Salvar configuração no banco
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          // Adicionar campo para configurações ERP (se não existir, criar)
          // Por enquanto, usar um campo JSON existente ou criar nova tabela
        }
      });

      // Armazenar em memória
      this.configuracoes.set(`${tenantId}_${config.tipo}`, config);

      // Criar auditoria
      await createAuditLog({
        action: AUDIT_ACTIONS.POP_CREATED,
        entity: 'ERPIntegration',
        entityId: `${tenantId}_${config.tipo}`,
        userId: 'system',
        userName: 'Sistema',
        tenantId,
        details: {
          tipo: config.tipo,
          nome: config.nome,
          ativo: config.ativo
        }
      });

      console.log(`ERP ${config.nome} configurado para tenant ${tenantId}`);

    } catch (error) {
      console.error('Erro ao configurar ERP:', error);
      throw error;
    }
  }

  /**
   * Valida configuração do ERP
   */
  private async validarConfiguracaoERP(config: ERPConfig): Promise<void> {
    if (!config.nome || !config.tipo || !config.url) {
      throw new Error('Configuração incompleta: nome, tipo e url são obrigatórios');
    }

    // Testar conexão
    try {
      const response = await this.testarConexaoERP(config);
      if (!response.ok) {
        throw new Error(`Falha na conexão com ${config.nome}: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Erro de conexão com ${config.nome}: ${error}`);
    }
  }

  /**
   * Testa conexão com ERP
   */
  private async testarConexaoERP(config: ERPConfig): Promise<Response> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.token) {
      headers['Authorization'] = `Token ${config.token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${config.url}/api/health`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      throw new Error(`Falha ao conectar: ${error}`);
    }
  }

  /**
   * Sincroniza matérias-primas do ERP
   */
  async sincronizarMateriasPrimas(tenantId: string, tipoERP: string): Promise<any> {
    try {
      const config = this.configuracoes.get(`${tenantId}_${tipoERP}`);
      if (!config || !config.ativo) {
        throw new Error(`ERP ${tipoERP} não configurado ou inativo`);
      }

      console.log(`Iniciando sincronização de matérias-primas do ${config.nome}`);

      // 1. Buscar dados do ERP
      const dadosERP = await this.buscarDadosERP(config, 'materias_primas');

      // 2. Mapear dados
      const dadosMapeados = this.mapearDados(dadosERP, tipoERP);

      // 3. Sincronizar com banco
      const resultado = await this.sincronizarMateriasPrimasBanco(tenantId, dadosMapeados);

      // 4. Criar auditoria
      await createAuditLog({
        action: 'SINCRONIZACAO_ERP',
        entity: 'MateriaPrima',
        entityId: `${tenantId}_${tipoERP}`,
        userId: 'system',
        userName: 'Sistema IA',
        tenantId,
        details: {
          tipo: tipoERP,
          processados: dadosMapeados.length,
          criados: resultado.criados,
          atualizados: resultado.atualizados,
          erros: resultado.erros
        }
      });

      console.log(`Sincronização concluída: ${resultado.criados} criados, ${resultado.atualizados} atualizados`);
      return resultado;

    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }

  /**
   * Busca dados do ERP
   */
  private async buscarDadosERP(config: ERPConfig, endpoint: string): Promise<any[]> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.token) {
      headers['Authorization'] = `Token ${config.token}`;
    }

    const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${config.url}/api/${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.statusText}`);
    }

    const dados = await response.json();
    return Array.isArray(dados) ? dados : [dados];
  }

  /**
   * Mapeia dados do ERP para formato VISADOCS
   */
  private mapearDados(dadosOrigem: any[], tipoERP: string): any[] {
    const mapeamento = this.mapeamentos.get(tipoERP);
    if (!mapeamento) {
      throw new Error(`Mapeamento não encontrado para ERP ${tipoERP}`);
    }

    return dadosOrigem.map(itemOrigem => {
      const itemDestino: any = {};

      mapeamento.forEach(campo => {
        const valor = itemOrigem[campo.campoOrigem];
        
        if (valor !== undefined && valor !== null) {
          if (campo.transformacao) {
            itemDestino[campo.campoDestino] = campo.transformacao(valor);
          } else {
            itemDestino[campo.campoDestino] = valor;
          }
        } else if (campo.obrigatorio) {
          throw new Error(`Campo obrigatório ${campo.campoOrigem} não encontrado em: ${JSON.stringify(itemOrigem)}`);
        }
      });

      return itemDestino;
    });
  }

  /**
   * Sincroniza matérias-primas com banco de dados
   */
  private async sincronizarMateriasPrimasBanco(tenantId: string, dados: any[]): Promise<any> {
    const resultado = {
      criados: 0,
      atualizados: 0,
      erros: 0,
      detalhes: [] as any[]
    };

    for (const dado of dados) {
      try {
        // Verificar se já existe
        const existente = await prisma.materiaPrima.findFirst({
          where: {
            tenantId,
            codigo: dado.codigo
          }
        });

        if (existente) {
          // Atualizar
          await prisma.materiaPrima.update({
            where: { id: existente.id },
            data: {
              nome: dado.nome,
              descricao: dado.descricao,
              categoria: dado.categoria,
              unidadeMedida: dado.unidadeMedida,
              estoqueMinimo: dado.estoqueMinimo,
              updatedAt: new Date()
            }
          });
          resultado.atualizados++;
          resultado.detalhes.push({ acao: 'atualizado', codigo: dado.codigo, nome: dado.nome });
        } else {
          // Criar
          await prisma.materiaPrima.create({
            data: {
              tenantId,
              codigo: dado.codigo,
              nome: dado.nome,
              descricao: dado.descricao,
              categoria: dado.categoria,
              unidadeMedida: dado.unidadeMedida,
              estoqueMinimo: dado.estoqueMinimo,
              status: 'ATIVO'
            }
          });
          resultado.criados++;
          resultado.detalhes.push({ acao: 'criado', codigo: dado.codigo, nome: dado.nome });
        }
      } catch (error) {
        resultado.erros++;
        resultado.detalhes.push({ 
          acao: 'erro', 
          codigo: dado.codigo, 
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return resultado;
  }

  /**
   * Sincroniza fornecedores do ERP
   */
  async sincronizarFornecedores(tenantId: string, tipoERP: string): Promise<any> {
    try {
      const config = this.configuracoes.get(`${tenantId}_${tipoERP}`);
      if (!config || !config.ativo) {
        throw new Error(`ERP ${tipoERP} não configurado ou inativo`);
      }

      console.log(`Iniciando sincronização de fornecedores do ${config.nome}`);

      // 1. Buscar dados do ERP
      const dadosERP = await this.buscarDadosERP(config, 'fornecedores');

      // 2. Mapear dados
      const dadosMapeados = this.mapearFornecedores(dadosERP, tipoERP);

      // 3. Sincronizar com banco
      const resultado = await this.sincronizarFornecedoresBanco(tenantId, dadosMapeados);

      // 4. Criar auditoria
      await createAuditLog({
        action: 'SINCRONIZACAO_ERP',
        entity: 'Fornecedor',
        entityId: `${tenantId}_${tipoERP}`,
        userId: 'system',
        userName: 'Sistema IA',
        tenantId,
        details: {
          tipo: tipoERP,
          processados: dadosMapeados.length,
          criados: resultado.criados,
          atualizados: resultado.atualizados,
          erros: resultado.erros
        }
      });

      console.log(`Sincronização de fornecedores concluída: ${resultado.criados} criados, ${resultado.atualizados} atualizados`);
      return resultado;

    } catch (error) {
      console.error('Erro na sincronização de fornecedores:', error);
      throw error;
    }
  }

  /**
   * Mapeia fornecedores do ERP
   */
  private mapearFornecedores(dadosOrigem: any[], tipoERP: string): any[] {
    return dadosOrigem.map(item => ({
      nome: item.nome_fornecedor || item.nome || item.razao_social,
      cnpj: item.cnpj || item.cnpj_fornecedor,
      email: item.email || item.email_contato,
      telefone: item.telefone || item.fone,
      endereco: item.endereco || item.endereco_completo,
      contato: item.contato || item.responsavel,
      ativo: item.ativo !== 'N' && item.ativo !== false
    }));
  }

  /**
   * Sincroniza fornecedores com banco
   */
  private async sincronizarFornecedoresBanco(tenantId: string, dados: any[]): Promise<any> {
    const resultado = {
      criados: 0,
      atualizados: 0,
      erros: 0,
      detalhes: [] as any[]
    };

    for (const dado of dados) {
      try {
        // Verificar se já existe pelo CNPJ
        const existente = await prisma.fornecedor.findFirst({
          where: {
            tenantId,
            cnpj: dado.cnpj
          }
        });

        if (existente) {
          // Atualizar
          await prisma.fornecedor.update({
            where: { id: existente.id },
            data: {
              nome: dado.nome,
              email: dado.email,
              telefone: dado.telefone,
              endereco: dado.endereco,
              contato: dado.contato,
              ativo: dado.ativo,
              updatedAt: new Date()
            }
          });
          resultado.atualizados++;
          resultado.detalhes.push({ acao: 'atualizado', nome: dado.nome, cnpj: dado.cnpj });
        } else {
          // Criar
          await prisma.fornecedor.create({
            data: {
              tenantId,
              nome: dado.nome,
              cnpj: dado.cnpj,
              email: dado.email,
              telefone: dado.telefone,
              endereco: dado.endereco,
              contato: dado.contato,
              ativo: dado.ativo
            }
          });
          resultado.criados++;
          resultado.detalhes.push({ acao: 'criado', nome: dado.nome, cnpj: dado.cnpj });
        }
      } catch (error) {
        resultado.erros++;
        resultado.detalhes.push({ 
          acao: 'erro', 
          nome: dado.nome, 
          cnpj: dado.cnpj,
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return resultado;
  }

  /**
   * Sincroniza lotes do ERP
   */
  async sincronizarLotes(tenantId: string, tipoERP: string): Promise<any> {
    try {
      const config = this.configuracoes.get(`${tenantId}_${tipoERP}`);
      if (!config || !config.ativo) {
        throw new Error(`ERP ${tipoERP} não configurado ou inativo`);
      }

      console.log(`Iniciando sincronização de lotes do ${config.nome}`);

      // 1. Buscar dados do ERP
      const dadosERP = await this.buscarDadosERP(config, 'lotes');

      // 2. Mapear dados
      const dadosMapeados = this.mapearLotes(dadosERP, tipoERP);

      // 3. Sincronizar com banco
      const resultado = await this.sincronizarLotesBanco(tenantId, dadosMapeados);

      // 4. Criar auditoria
      await createAuditLog({
        action: 'SINCRONIZACAO_ERP',
        entity: 'Lote',
        entityId: `${tenantId}_${tipoERP}`,
        userId: 'system',
        userName: 'Sistema IA',
        tenantId,
        details: {
          tipo: tipoERP,
          processados: dadosMapeados.length,
          criados: resultado.criados,
          atualizados: resultado.atualizados,
          erros: resultado.erros
        }
      });

      console.log(`Sincronização de lotes concluída: ${resultado.criados} criados, ${resultado.atualizados} atualizados`);
      return resultado;

    } catch (error) {
      console.error('Erro na sincronização de lotes:', error);
      throw error;
    }
  }

  /**
   * Mapeia lotes do ERP
   */
  private mapearLotes(dadosOrigem: any[], tipoERP: string): any[] {
    return dadosOrigem.map(item => ({
      numeroLote: item.lote || item.numero_lote || item.lote_numero,
      loteInterno: item.lote_interno,
      dataFabricacao: item.data_fabricacao ? new Date(item.data_fabricacao) : undefined,
      dataValidade: item.data_validade ? new Date(item.data_validade) : new Date(),
      dataRecebimento: item.data_recebimento ? new Date(item.data_recebimento) : new Date(),
      quantidade: parseFloat(item.quantidade || item.qtd || 0),
      quantidadeAtual: parseFloat(item.quantidade_atual || item.qtd_atual || item.quantidade),
      precoUnitario: parseFloat(item.preco_unitario || item.preco || 0),
      notaFiscal: item.nota_fiscal || item.nf,
      codigoMateriaPrima: item.codigo_produto || item.produto_codigo || item.id_produto
    }));
  }

  /**
   * Sincroniza lotes com banco
   */
  private async sincronizarLotesBanco(tenantId: string, dados: any[]): Promise<any> {
    const resultado = {
      criados: 0,
      atualizados: 0,
      erros: 0,
      detalhes: [] as any[]
    };

    for (const dado of dados) {
      try {
        // Buscar matéria-prima correspondente
        const materiaPrima = await prisma.materiaPrima.findFirst({
          where: {
            tenantId,
            codigo: dado.codigoMateriaPrima
          }
        });

        if (!materiaPrima) {
          resultado.erros++;
          resultado.detalhes.push({ 
            acao: 'erro', 
            lote: dado.numeroLote,
            erro: 'Matéria-prima não encontrada'
          });
          continue;
        }

        // Verificar se lote já existe
        const existente = await prisma.lote.findFirst({
          where: {
            tenantId,
            numeroLote: dado.numeroLote,
            materiaPrimaId: materiaPrima.id
          }
        });

        if (existente) {
          // Atualizar
          await prisma.lote.update({
            where: { id: existente.id },
            data: {
              dataValidade: dado.dataValidade,
              dataRecebimento: dado.dataRecebimento,
              quantidade: dado.quantidade,
              quantidadeAtual: dado.quantidadeAtual,
              precoUnitario: dado.precoUnitario,
              notaFiscal: dado.notaFiscal,
              updatedAt: new Date()
            }
          });
          resultado.atualizados++;
          resultado.detalhes.push({ acao: 'atualizado', lote: dado.numeroLote, materia: materiaPrima.nome });
        } else {
          // Criar
          await prisma.lote.create({
            data: {
              tenantId,
              numeroLote: dado.numeroLote,
              loteInterno: dado.loteInterno,
              dataFabricacao: dado.dataFabricacao,
              dataValidade: dado.dataValidade,
              dataRecebimento: dado.dataRecebimento,
              quantidade: dado.quantidade,
              quantidadeAtual: dado.quantidadeAtual,
              precoUnitario: dado.precoUnitario,
              notaFiscal: dado.notaFiscal,
              materiaPrimaId: materiaPrima.id,
              status: 'QUARENTENA'
            }
          });
          resultado.criados++;
          resultado.detalhes.push({ acao: 'criado', lote: dado.numeroLote, materia: materiaPrima.nome });
        }
      } catch (error) {
        resultado.erros++;
        resultado.detalhes.push({ 
          acao: 'erro', 
          lote: dado.numeroLote,
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return resultado;
  }

  /**
   * Executa sincronização completa
   */
  async sincronizacaoCompleta(tenantId: string, tipoERP: string): Promise<any> {
    try {
      console.log(`Iniciando sincronização completa do ERP ${tipoERP}`);

      const resultados = {
        materiasPrimas: await this.sincronizarMateriasPrimas(tenantId, tipoERP),
        fornecedores: await this.sincronizarFornecedores(tenantId, tipoERP),
        lotes: await this.sincronizarLotes(tenantId, tipoERP),
        resumo: {
          totalCriados: 0,
          totalAtualizados: 0,
          totalErros: 0
        }
      };

      // Calcular resumo
      resultados.resumo.totalCriados = 
        resultados.materiasPrimas.criados + 
        resultados.fornecedores.criados + 
        resultados.lotes.criados;
      
      resultados.resumo.totalAtualizados = 
        resultados.materiasPrimas.atualizados + 
        resultados.fornecedores.atualizados + 
        resultados.lotes.atualizados;
      
      resultados.resumo.totalErros = 
        resultados.materiasPrimas.erros + 
        resultados.fornecedores.erros + 
        resultados.lotes.erros;

      console.log(`Sincronização completa concluída: ${resultados.resumo.totalCriados} criados, ${resultados.resumo.totalAtualizados} atualizados, ${resultados.resumo.totalErros} erros`);
      
      return resultados;

    } catch (error) {
      console.error('Erro na sincronização completa:', error);
      throw error;
    }
  }

  /**
   * Lista ERPs configurados para um tenant
   */
  async listarERPsConfigurados(tenantId: string): Promise<ERPConfig[]> {
    const erps: ERPConfig[] = [];
    
    for (const [chave, config] of this.configuracoes.entries()) {
      if (chave.startsWith(`${tenantId}_`)) {
        erps.push(config);
      }
    }
    
    return erps;
  }

  /**
   * Remove configuração de ERP
   */
  async removerConfiguracaoERP(tenantId: string, tipoERP: string): Promise<void> {
    const chave = `${tenantId}_${tipoERP}`;
    this.configuracoes.delete(chave);
    
    await createAuditLog({
      action: 'REMOCAO_ERP',
      entity: 'ERPIntegration',
      entityId: chave,
      userId: 'system',
      userName: 'Sistema IA',
      tenantId,
      details: {
        tipo: tipoERP
      }
    });
    
    console.log(`Configuração ERP ${tipoERP} removida para tenant ${tenantId}`);
  }
}

export const erpIntegration = ERPIntegration.getInstance();
