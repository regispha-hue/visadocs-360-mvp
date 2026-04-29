/**
 * Gerador Automático de Relatórios para Fiscalização
 * Sistema inteligente para gerar relatórios prontos para entrega em fiscalizações da VISA
 */

import { prisma } from '@/lib/db';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface RelatorioFiscalizacao {
  tenantId: string;
  tipo: 'COMPLETO' | 'RAPIDO' | 'ESPECIFICO';
  periodo: {
    inicio: Date;
    fim: Date;
  };
  setores?: string[];
  pops?: string[];
  incluirAnalises: boolean;
  formato: 'PDF' | 'DOCX' | 'HTML';
}

interface DadosRelatorio {
  tenant: any;
  pops: any[];
  treinamentos: any[];
  colaboradores: any[];
  materiasPrimas: any[];
  lotes: any[];
  documentos: any[];
  naoConformidades: any[];
  auditorias: any[];
  analiseGeral: any;
}

class RelatorioFiscalizacaoGenerator {
  private static instance: RelatorioFiscalizacaoGenerator;

  private constructor() {}

  static getInstance(): RelatorioFiscalizacaoGenerator {
    if (!RelatorioFiscalizacaoGenerator.instance) {
      RelatorioFiscalizacaoGenerator.instance = new RelatorioFiscalizacaoGenerator();
    }
    return RelatorioFiscalizacaoGenerator.instance;
  }

  /**
   * Gera relatório completo para fiscalização
   */
  async gerarRelatorio(config: RelatorioFiscalizacao): Promise<any> {
    try {
      console.log(`Gerando relatório de fiscalização para tenant ${config.tenantId}`);

      // 1. Coletar dados
      const dados = await this.coletarDadosRelatorio(config);

      // 2. Analisar dados
      const analise = await this.analisarDados(dados, config);

      // 3. Gerar relatório
      let relatorio: any;

      switch (config.formato) {
        case 'PDF':
          relatorio = await this.gerarPDF(dados, analise, config);
          break;
        case 'DOCX':
          relatorio = await this.gerarDOCX(dados, analise, config);
          break;
        case 'HTML':
          relatorio = await this.gerarHTML(dados, analise, config);
          break;
        default:
          relatorio = await this.gerarPDF(dados, analise, config);
      }

      // 4. Salvar registro
      await this.salvarRelatorioGerado(config, dados, analise);

      console.log(`Relatório gerado com sucesso: ${relatorio.nomeArquivo}`);
      return relatorio;

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Coleta todos os dados necessários para o relatório
   */
  private async coletarDadosRelatorio(config: RelatorioFiscalizacao): Promise<DadosRelatorio> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: config.tenantId },
      include: {
        users: {
          where: { role: 'ADMIN_FARMACIA' },
          select: { name: true, email: true }
        }
      }
    });

    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    // POPs ativos
    const pops = await prisma.pop.findMany({
      where: {
        tenantId: config.tenantId,
        status: 'ATIVO',
        ...(config.pops && config.pops.length > 0 && { codigo: { in: config.pops } })
      },
      include: {
        treinamentos: {
          where: {
            dataTreinamento: {
              gte: config.periodo.inicio,
              lte: config.periodo.fim
            }
          }
        }
      }
    });

    // Treinamentos no período
    const treinamentos = await prisma.treinamento.findMany({
      where: {
        tenantId: config.tenantId,
        dataTreinamento: {
          gte: config.periodo.inicio,
          lte: config.periodo.fim
        }
      },
      include: {
        colaborador: true,
        pop: true,
        tentativasQuiz: true
      }
    });

    // Colaboradores ativos
    const colaboradores = await prisma.colaborador.findMany({
      where: {
        tenantId: config.tenantId,
        status: 'ATIVO'
      },
      include: {
        treinamentos: {
          where: {
            dataTreinamento: {
              gte: config.periodo.inicio,
              lte: config.periodo.fim
            }
          }
        }
      }
    });

    // Matérias-primas
    const materiasPrimas = await prisma.materiaPrima.findMany({
      where: {
        tenantId: config.tenantId,
        status: 'ATIVO'
      },
      include: {
        fornecedor: true,
        lotes: {
          where: {
            dataRecebimento: {
              gte: config.periodo.inicio,
              lte: config.periodo.fim
            }
          }
        }
      }
    });

    // Lotes recebidos no período
    const lotes = await prisma.lote.findMany({
      where: {
        tenantId: config.tenantId,
        dataRecebimento: {
          gte: config.periodo.inicio,
          lte: config.periodo.fim
        }
      },
      include: {
        materiaPrima: true,
        fornecedor: true
      }
    });

    // Documentos
    const documentos = await prisma.documento.findMany({
      where: {
        tenantId: config.tenantId
      },
      orderBy: { createdAt: 'desc' }
    });

    // Não conformidades
    const naoConformidades = await prisma.naoConformidade.findMany({
      where: {
        tenantId: config.tenantId,
        dataOcorrencia: {
          gte: config.periodo.inicio,
          lte: config.periodo.fim
        }
      },
      include: {
        risco: true,
        pop: true
      }
    });

    // Auditorias
    const auditorias = await prisma.auditoriaRisco.findMany({
      where: {
        tenantId: config.tenantId,
        dataInicio: {
          gte: config.periodo.inicio,
          lte: config.periodo.fim
        }
      }
    });

    return {
      tenant,
      pops,
      treinamentos,
      colaboradores,
      materiasPrimas,
      lotes,
      documentos,
      naoConformidades,
      auditorias,
      analiseGeral: null
    };
  }

  /**
   * Analisa os dados e gera insights
   */
  private async analisarDados(dados: DadosRelatorio, config: RelatorioFiscalizacao): Promise<any> {
    const analise = {
      resumoExecutivo: this.gerarResumoExecutivo(dados),
      conformidade: this.analisarConformidade(dados),
      treinamentos: this.analisarTreinamentos(dados),
      qualidade: this.analisarQualidade(dados),
      riscos: this.analisarRiscos(dados),
      recomendacoes: this.gerarRecomendacoes(dados),
      pontuacaoGeral: this.calcularPontuacaoGeral(dados)
    };

    return analise;
  }

  /**
   * Gera resumo executivo
   */
  private gerarResumoExecutivo(dados: DadosRelatorio): any {
    const totalPOPs = dados.pops.length;
    const popsComTreinamento = dados.pops.filter(pop => 
      pop.treinamentos && pop.treinamentos.length > 0
    ).length;
    
    const totalColaboradores = dados.colaboradores.length;
    const colaboradoresTreinados = dados.colaboradores.filter(col => 
      col.treinamentos && col.treinamentos.length > 0
    ).length;

    const totalNaoConformidades = dados.naoConformidades.length;
    const ncAbertas = dados.naoConformidades.filter(nc => 
      ['ABERTA', 'EM_ANALISE', 'CORRECAO_PENDENTE'].includes(nc.status)
    ).length;

    return {
      periodoAnalise: `${new Date().toLocaleDateString('pt-BR')}`,
      totalPOPs,
      popsComTreinamento,
      percentualPOPsTreinados: totalPOPs > 0 ? (popsComTreinamento / totalPOPs * 100).toFixed(1) : 0,
      totalColaboradores,
      colaboradoresTreinados,
      percentualColaboradoresTreinados: totalColaboradores > 0 ? (colaboradoresTreinados / totalColaboradores * 100).toFixed(1) : 0,
      totalNaoConformidades,
      ncAbertas,
      taxaNaoConformidade: totalNaoConformidades > 0 ? (ncAbertas / totalNaoConformidades * 100).toFixed(1) : 0,
      statusGeral: this.classificarStatusGeral(totalPOPs, popsComTreinamento, ncAbertas)
    };
  }

  /**
   * Classifica status geral da farmácia
   */
  private classificarStatusGeral(totalPOPs: number, popsComTreinamento: number, ncAbertas: number): string {
    const percentualTreinamento = totalPOPs > 0 ? popsComTreinamento / totalPOPs : 0;
    
    if (percentualTreinamento >= 0.95 && ncAbertas === 0) return 'EXCELLENTE';
    if (percentualTreinamento >= 0.85 && ncAbertas <= 2) return 'BOM';
    if (percentualTreinamento >= 0.70 && ncAbertas <= 5) return 'REGULAR';
    return 'NECESSITA_MELHORIAS';
  }

  /**
   * Analisa conformidade geral
   */
  private analisarConformidade(dados: DadosRelatorio): any {
    const analise = {
      pops: {
        total: dados.pops.length,
        ativos: dados.pops.filter(pop => pop.status === 'ATIVO').length,
        validados: dados.pops.filter(pop => pop.validadoEm).length,
        implantados: dados.pops.filter(pop => pop.implantadoEm).length
      },
      treinamentos: {
        total: dados.treinamentos.length,
        concluidos: dados.treinamentos.filter(t => t.status === 'CONCLUIDO').length,
        comAprovacao: dados.treinamentos.filter(t => t.aprovadoQuiz === true).length
      },
      documentos: {
        total: dados.documentos.length,
        porTipo: this.agruparPorTipo(dados.documentos, 'tipo')
      },
      validades: {
        popsVencidos: 0, // Implementar lógica de validade
        documentosVencidos: 0 // Implementar lógica de validade
      }
    };

    return analise;
  }

  /**
   * Analisa situação dos treinamentos
   */
  private analisarTreinamentos(dados: DadosRelatorio): any {
    const treinamentosPorSetor = this.agruparPorSetor(dados.treinamentos, 'colaborador');
    const eficaciaQuiz = dados.treinamentos.filter(t => t.notaQuiz !== null);
    const mediaQuiz = eficaciaQuiz.length > 0 ? 
      eficaciaQuiz.reduce((sum, t) => sum + (t.notaQuiz || 0), 0) / eficaciaQuiz.length : 0;

    return {
      total: dados.treinamentos.length,
      porSetor: treinamentosPorSetor,
      mediaQuiz: mediaQuiz.toFixed(1),
      taxaAprovacao: eficaciaQuiz.length > 0 ? 
        (eficaciaQuiz.filter(t => t.aprovadoQuiz === true).length / eficaciaQuiz.length * 100).toFixed(1) : 0,
      necessidadesRetreinamento: dados.treinamentos.filter(t => 
        t.aprovadoQuiz === false
      ).length
    };
  }

  /**
   * Analisa controle de qualidade
   */
  private analisarQualidade(dados: DadosRelatorio): any {
    const lotesAnalise = dados.lotes.length;
    const lotesAprovados = dados.lotes.filter(l => l.status === 'APROVADO').length;
    const lotesReprovados = dados.lotes.filter(l => l.status === 'REPROVADO').length;
    const lotesQuarentena = dados.lotes.filter(l => l.status === 'QUARENTENA').length;

    return {
      materiasPrimas: {
        total: dados.materiasPrimas.length,
        ativos: dados.materiasPrimas.filter(mp => mp.status === 'ATIVO').length,
        comFornecedor: dados.materiasPrimas.filter(mp => mp.fornecedorId).length
      },
      lotes: {
        totalRecebidos: lotesAnalise,
        aprovados: lotesAprovados,
        reprovados: lotesReprovados,
        quarentena: lotesQuarentena,
        taxaAprovacao: lotesAnalise > 0 ? (lotesAprovados / lotesAnalise * 100).toFixed(1) : 0
      }
    };
  }

  /**
   * Analisa riscos e não conformidades
   */
  private analisarRiscos(dados: DadosRelatorio): any {
    const ncPorSeveridade = this.agruparPorSeveridade(dados.naoConformidades);
    const ncPorSetor = this.agruparPorSetor(dados.naoConformidades, 'setor');

    return {
      naoConformidades: {
        total: dados.naoConformidades.length,
        abertas: dados.naoConformidades.filter(nc => 
          ['ABERTA', 'EM_ANALISE', 'CORRECAO_PENDENTE'].includes(nc.status)
        ).length,
        resolvidas: dados.naoConformidades.filter(nc => nc.status === 'FECHADA').length,
        porSeveridade: ncPorSeveridade,
        porSetor: ncPorSetor
      },
      auditorias: {
        total: dados.auditorias.length,
        concluidas: dados.auditorias.filter(a => a.status === 'CONCLUIDA').length,
        pontuacaoMedia: dados.auditorias.length > 0 ? 
          dados.auditorias.reduce((sum, a) => sum + (a.pontuacao || 0), 0) / dados.auditorias.length : 0
      }
    };
  }

  /**
   * Gera recomendações baseadas na análise
   */
  private gerarRecomendacoes(dados: DadosRelatorio): string[] {
    const recomendacoes: string[] = [];

    // Análise de treinamentos
    const percentualTreinamento = dados.colaboradores.length > 0 ? 
      dados.colaboradores.filter(c => c.treinamentos && c.treinamentos.length > 0).length / dados.colaboradores.length : 0;

    if (percentualTreinamento < 0.8) {
      recomendacoes.push('Priorizar treinamentos dos colaboradores não treinados');
    }

    // Análise de não conformidades
    if (dados.naoConformidades.filter(nc => nc.status === 'ABERTA').length > 3) {
      recomendacoes.push('Estabelecer plano de ação para reduzir não conformidades abertas');
    }

    // Análise de qualidade
    const taxaAprovacaoLotes = dados.lotes.length > 0 ? 
      dados.lotes.filter(l => l.status === 'APROVADO').length / dados.lotes.length : 0;

    if (taxaAprovacaoLotes < 0.95) {
      recomendacoes.push('Revisar procedimentos de controle de qualidade');
    }

    // Análise de POPs
    const popsNaoImplantados = dados.pops.filter(pop => !pop.implantadoEm).length;
    if (popsNaoImplantados > 0) {
      recomendacoes.push(`Implantar ${popsNaoImplantados} POPs pendentes`);
    }

    return recomendacoes;
  }

  /**
   * Calcula pontuação geral de conformidade
   */
  private calcularPontuacaoGeral(dados: DadosRelatorio): number {
    let pontuacao = 0;
    let pesoTotal = 0;

    // POPs (30%)
    const pesoPOPs = 0.3;
    const pontosPOPs = dados.pops.length > 0 ? 
      dados.pops.filter(pop => pop.status === 'ATIVO' && pop.implantadoEm).length / dados.pops.length : 0;
    pontuacao += pontosPOPs * pesoPOPs * 100;
    pesoTotal += pesoPOPs * 100;

    // Treinamentos (25%)
    const pesoTreinamentos = 0.25;
    const pontosTreinamentos = dados.colaboradores.length > 0 ? 
      dados.colaboradores.filter(c => c.treinamentos && c.treinamentos.length > 0).length / dados.colaboradores.length : 0;
    pontuacao += pontosTreinamentos * pesoTreinamentos * 100;
    pesoTotal += pesoTreinamentos * 100;

    // Qualidade (25%)
    const pesoQualidade = 0.25;
    const pontosQualidade = dados.lotes.length > 0 ? 
      dados.lotes.filter(l => l.status === 'APROVADO').length / dados.lotes.length : 0;
    pontuacao += pontosQualidade * pesoQualidade * 100;
    pesoTotal += pesoQualidade * 100;

    // Não conformidades (20%)
    const pesoNC = 0.2;
    const pontosNC = dados.naoConformidades.length > 0 ? 
      (dados.naoConformidades.length - dados.naoConformidades.filter(nc => 
        ['ABERTA', 'EM_ANALISE', 'CORRECAO_PENDENTE'].includes(nc.status)
      ).length) / dados.naoConformidades.length : 1;
    pontuacao += pontosNC * pesoNC * 100;
    pesoTotal += pesoNC * 100;

    return pesoTotal > 0 ? Math.round(pontuacao / pesoTotal) : 0;
  }

  /**
   * Gera relatório em PDF
   */
  private async gerarPDF(dados: DadosRelatorio, analise: any, config: RelatorioFiscalizacao): Promise<any> {
    const doc = new jsPDF();
    
    // Configurações iniciais
    doc.setFontSize(20);
    doc.text('RELATÓRIO DE FISCALIZAÇÃO', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Farmácia: ${dados.tenant.nome}`, 20, 40);
    doc.text(`CNPJ: ${dados.tenant.cnpj}`, 20, 50);
    doc.text(`Período: ${config.periodo.inicio.toLocaleDateString('pt-BR')} a ${config.periodo.fim.toLocaleDateString('pt-BR')}`, 20, 60);
    doc.text(`Data Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, 70);

    // Resumo Executivo
    doc.setFontSize(16);
    doc.text('RESUMO EXECUTIVO', 20, 90);
    
    doc.setFontSize(10);
    let y = 100;
    doc.text(`Status Geral: ${analise.resumoExecutivo.statusGeral}`, 20, y);
    y += 10;
    doc.text(`Pontuação Geral: ${analise.pontuacaoGeral}/100`, 20, y);
    y += 10;
    doc.text(`POPs Ativos: ${analise.resumoExecutivo.totalPOPs}`, 20, y);
    y += 10;
    doc.text(`Colaboradores Treinados: ${analise.resumoExecutivo.percentualColaboradoresTreinados}%`, 20, y);
    y += 10;
    doc.text(`Não Conformidades Abertas: ${analise.resumoExecutivo.ncAbertas}`, 20, y);

    // Conformidade
    y += 20;
    doc.setFontSize(16);
    doc.text('ANÁLISE DE CONFORMIDADE', 20, y);
    
    doc.setFontSize(10);
    y += 10;
    doc.text(`POPs Validados: ${analise.conformidade.pops.validados}/${analise.conformidade.pops.total}`, 20, y);
    y += 10;
    doc.text(`POPs Implantados: ${analise.conformidade.pops.implantados}/${analise.conformidade.pops.total}`, 20, y);
    y += 10;
    doc.text(`Taxa de Aprovação em Quiz: ${analise.treinamentos.taxaAprovacao}%`, 20, y);

    // Recomendações
    y += 20;
    doc.setFontSize(16);
    doc.text('RECOMENDAÇÕES', 20, y);
    
    doc.setFontSize(10);
    y += 10;
    analise.recomendacoes.forEach((rec: string, index: number) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${index + 1}. ${rec}`, 20, y);
      y += 10;
    });

    // Salvar PDF
    const nomeArquivo = `relatorio_fiscalizacao_${dados.tenant.cnpj.replace(/\D/g, '')}_${new Date().getTime()}.pdf`;
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    return {
      nomeArquivo,
      formato: 'PDF',
      tamanho: pdfBase64.length,
      data: pdfBase64,
      url: `data:application/pdf;base64,${pdfBase64}`
    };
  }

  /**
   * Gera relatório em DOCX (simplificado)
   */
  private async gerarDOCX(dados: DadosRelatorio, analise: any, config: RelatorioFiscalizacao): Promise<any> {
    // Implementar geração DOCX usando biblioteca docx
    const conteudo = this.gerarHTML(dados, analise, config);
    
    return {
      nomeArquivo: `relatorio_fiscalizacao_${dados.tenant.cnpj.replace(/\D/g, '')}_${new Date().getTime()}.html`,
      formato: 'HTML',
      conteudo,
      observacao: 'Formato DOCX implementado como HTML - converter usando ferramenta externa'
    };
  }

  /**
   * Gera relatório em HTML
   */
  private async gerarHTML(dados: DadosRelatorio, analise: any, config: RelatorioFiscalizacao): Promise<any> {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Fiscalização - ${dados.tenant.nome}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .status-excelente { color: #28a745; }
        .status-bom { color: #ffc107; }
        .status-regular { color: #fd7e14; }
        .status-ruim { color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RELATÓRIO DE FISCALIZAÇÃO</h1>
        <h2>${dados.tenant.nome}</h2>
        <p>CNPJ: ${dados.tenant.cnpj}</p>
        <p>Período: ${config.periodo.inicio.toLocaleDateString('pt-BR')} a ${config.periodo.fim.toLocaleDateString('pt-BR')}</p>
        <p>Data Geração: ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>

    <div class="section">
        <h3>RESUMO EXECUTIVO</h3>
        <div class="metric">
            <strong>Status Geral:</strong> 
            <span class="status-${analise.resumoExecutivo.statusGeral.toLowerCase()}">${analise.resumoExecutivo.statusGeral}</span>
        </div>
        <div class="metric">
            <strong>Pontuação Geral:</strong> ${analise.pontuacaoGeral}/100
        </div>
        <div class="metric">
            <strong>POPs Ativos:</strong> ${analise.resumoExecutivo.totalPOPs}
        </div>
        <div class="metric">
            <strong>Colaboradores Treinados:</strong> ${analise.resumoExecutivo.percentualColaboradoresTreinados}%
        </div>
        <div class="metric">
            <strong>NC Abertas:</strong> ${analise.resumoExecutivo.ncAbertas}
        </div>
    </div>

    <div class="section">
        <h3>ANÁLISE DE CONFORMIDADE</h3>
        <table>
            <tr>
                <th>Item</th>
                <th>Total</th>
                <th>Conforme</th>
                <th>Percentual</th>
            </tr>
            <tr>
                <td>POPs Validados</td>
                <td>${analise.conformidade.pops.total}</td>
                <td>${analise.conformidade.pops.validados}</td>
                <td>${analise.conformidade.pops.total > 0 ? (analise.conformidade.pops.validados / analise.conformidade.pops.total * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
                <td>POPs Implantados</td>
                <td>${analise.conformidade.pops.total}</td>
                <td>${analise.conformidade.pops.implantados}</td>
                <td>${analise.conformidade.pops.total > 0 ? (analise.conformidade.pops.implantados / analise.conformidade.pops.total * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
                <td>Treinamentos Concluídos</td>
                <td>${analise.conformidade.treinamentos.total}</td>
                <td>${analise.conformidade.treinamentos.concluidos}</td>
                <td>${analise.conformidade.treinamentos.total > 0 ? (analise.conformidade.treinamentos.concluidos / analise.conformidade.treinamentos.total * 100).toFixed(1) : 0}%</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h3>NÃO CONFORMIDADES</h3>
        <table>
            <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Severidade</th>
                <th>Status</th>
                <th>Data</th>
            </tr>
            ${dados.naoConformidades.map(nc => `
            <tr>
                <td>${nc.codigo}</td>
                <td>${nc.titulo}</td>
                <td>${nc.severidade}</td>
                <td>${nc.status}</td>
                <td>${new Date(nc.dataOcorrencia).toLocaleDateString('pt-BR')}</td>
            </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h3>RECOMENDAÇÕES</h3>
        <ol>
            ${analise.recomendacoes.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ol>
    </div>
</body>
</html>`;

    return {
      nomeArquivo: `relatorio_fiscalizacao_${dados.tenant.cnpj.replace(/\D/g, '')}_${new Date().getTime()}.html`,
      formato: 'HTML',
      conteudo: html,
      tamanho: html.length
    };
  }

  /**
   * Salva registro do relatório gerado
   */
  private async salvarRelatorioGerado(config: RelatorioFiscalizacao, dados: DadosRelatorio, analise: any): Promise<void> {
    await createAuditLog({
      action: AUDIT_ACTIONS.POP_CREATED,
      entity: 'RelatorioFiscalizacao',
      entityId: `${config.tenantId}_${Date.now()}`,
      userId: 'system',
      userName: 'Sistema IA',
      tenantId: config.tenantId,
      details: {
        tipo: config.tipo,
        periodo: config.periodo,
        pontuacao: analise.pontuacaoGeral,
        status: analise.resumoExecutivo.statusGeral,
        pops: dados.pops.length,
        treinamentos: dados.treinamentos.length,
        naoConformidades: dados.naoConformidades.length
      }
    });
  }

  /**
   * Funções utilitárias
   */
  private agruparPorTipo(items: any[], campo: string): any {
    return items.reduce((acc, item) => {
      const tipo = item[campo];
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
  }

  private agruparPorSetor(items: any[], campo: string): any {
    return items.reduce((acc, item) => {
      const setor = item[campo]?.setor || 'Não definido';
      acc[setor] = (acc[setor] || 0) + 1;
      return acc;
    }, {});
  }

  private agruparPorSeveridade(items: any[]): any {
    return items.reduce((acc, item) => {
      const severidade = item.severidade || 'Não definida';
      acc[severidade] = (acc[severidade] || 0) + 1;
      return acc;
    }, {});
  }
}

export const relatorioFiscalizacaoGenerator = RelatorioFiscalizacaoGenerator.getInstance();
