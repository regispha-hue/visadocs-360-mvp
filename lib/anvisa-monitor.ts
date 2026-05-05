/**
 * Inteligência Regulatória Ativa - Vigia ANVISA
 * Worker para monitorar atualizações regulatórias e gerar alertas proativos
 */

import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

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
  tipo: "NOVA_NORMA" | "ALTERACAO" | "REVOGACAO" | "ORIENTACAO";
  norma: ANVISANorma;
  descricao: string;
  detalhes?: any;
  impactoPOPs: string[];
  acoesNecessarias: string[];
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

  /**
   * Inicia o monitoramento automático
   */
  async iniciarMonitoramento(intervaloMinutos: number = 60): Promise<void> {
    if (this.isRunning) {
      console.log("Monitor ANVISA já está em execução");
      return;
    }

    console.log(`Iniciando monitor ANVISA - Intervalo: ${intervaloMinutos} minutos`);
    this.isRunning = true;

    // Executa imediatamente na primeira vez
    await this.execututarMonitoramento();

    // Configura execução periódica
    this.intervalo = setInterval(
      () => this.execututarMonitoramento(),
      intervaloMinutos * 60 * 1000
    );
  }

  /**
   * Para o monitoramento
   */
  pararMonitoramento(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
    this.isRunning = false;
    console.log("Monitor ANVISA parado");
  }

  /**
   * Executa ciclo completo de monitoramento
   */
  private async execututarMonitoramento(): Promise<void> {
    try {
      console.log("Executando ciclo de monitoramento ANVISA...");
      
      // 1. Buscar atualizações recentes
      const atualizacoes = await this.buscarAtualizacoesRecentes();
      
      // 2. Analisar impacto nos POPs
      const impactos = await this.analisarImpactoPOPs(atualizacoes);
      
      // 3. Gerar alertas para tenants
      await this.gerarAlertasTenants(impactos);
      
      // 4. Atualizar base de normas
      await this.atualizarBaseNormas(atualizacoes);
      
      console.log(`Ciclo concluído: ${atualizacoes.length} atualizações processadas`);
      
    } catch (error) {
      console.error("Erro no ciclo de monitoramento:", error);
    }
  }

  /**
   * Busca atualizações recentes da ANVISA
   */
  private async buscarAtualizacoesRecentes(): Promise<AtualizacaoDetectada[]> {
    // Simulação de busca de dados da ANVISA
    // Em produção, integrar com API oficial ou web scraping
    const atualizacoes: AtualizacaoDetectada[] = [
      {
        tipo: "ALTERACAO",
        norma: {
          numero: "RDC 67/2007",
          titulo: "Boas Práticas de Manipulação",
          tipo: "RDC",
          orgao: "ANVISA",
          dataPublicacao: new Date("2007-10-08"),
          dataVigencia: new Date("2007-11-08"),
          ementa: "Dispõe sobre Boas Práticas de Manipulação",
          categorias: ["Manipulação", "Qualidade", "Segurança"],
          aplicabilidade: ["Farmácias", "Distribuidoras"]
        },
        descricao: "Nova exigência para manipulação de hormônios e substâncias controladas",
        detalhes: {
          secoesAlteradas: ["Art. 31", "Art. 33", "Art. 45"],
          novasExigencias: [
            "Paramentação específica para hormônios",
            "Controle ambiental rigoroso",
            "Registro de cadeia de custódia"
          ]
        },
        impactoPOPs: ["POP.012", "POP.013", "POP.014", "POP.015"],
        acoesNecessarias: [
          "Revisar POPs de manipulação",
          "Atualizar procedimentos de paramentação",
          "Implementar novos controles"
        ]
      },
      {
        tipo: "NOVA_NORMA",
        norma: {
          numero: "RDC 888/2024",
          titulo: "Validação de Métodos Analíticos",
          tipo: "RDC",
          orgao: "ANVISA",
          dataPublicacao: new Date("2024-04-15"),
          dataVigencia: new Date("2024-06-01"),
          ementa: "Estabelece requisitos para validação de métodos analíticos",
          categorias: ["Controle de Qualidade", "Validação"],
          aplicabilidade: ["Farmácias", "Laboratórios"]
        },
        descricao: "Nova norma sobre validação de métodos analíticos em farmácias de manipulação",
        detalhes: {
          requisitosPrincipais: [
            "Validação de todos os métodos",
            "Documentação completa",
            "Revalidação periódica"
          ]
        },
        impactoPOPs: ["POP.021", "POP.022", "POP.023", "POP.024"],
        acoesNecessarias: [
          "Criar POPs de validação",
          "Implementar protocolos",
          "Treinar equipe técnica"
        ]
      }
    ];

    return atualizacoes;
  }

  /**
   * Analisa impacto das atualizações nos POPs existentes
   */
  private async analisarImpactoPOPs(atualizacoes: AtualizacaoDetectada[]): Promise<any[]> {
    const impactos: any[] = [];

    for (const atualizacao of atualizacoes) {
      // Para cada tenant, verificar POPs afetados
      const tenants = await prisma.tenant.findMany({
        where: { status: "ATIVO" },
        select: { id: true, nome: true }
      });

      for (const tenant of tenants) {
        // Buscar POPs do tenant
        const pops = await prisma.pop.findMany({
          where: { 
            tenantId: tenant.id,
            codigo: { in: atualizacao.impactoPOPs }
          },
          select: { id: true, codigo: true, titulo: true, setor: true }
        });

        if (pops.length > 0) {
          impactos.push({
            tenantId: tenant.id,
            tenantNome: tenant.nome,
            atualizacao,
            popsAfetados: pops,
            severidade: this.calcularSeveridade(atualizacao, pops.length),
            prioridade: this.calcularPrioridade(atualizacao)
          });
        }
      }
    }

    return impactos;
  }

  /**
   * Gera alertas automáticos para os tenants
   */
  private async gerarAlertasTenants(impactos: any[]): Promise<void> {
    for (const impacto of impactos) {
      // Verificar se alerta já existe
      const alertaExistente = await prisma.alertaNorma.findFirst({
        where: {
          tenantId: impacto.tenantId,
      // @ts-ignore
          normaNumero: impacto.atualizacao.norma.numero,
          status: "NOVO"
        }
      });

      if (!alertaExistente) {
        // Criar nova norma se não existir
        let norma = await prisma.normaRegulatoria.findFirst({
          where: { numero: impacto.atualizacao.norma.numero }
        });

        if (!norma) {
          norma = await prisma.normaRegulatoria.create({
            data: {
              numero: impacto.atualizacao.norma.numero,
              titulo: impacto.atualizacao.norma.titulo,
              tipo: impacto.atualizacao.norma.tipo,
              orgao: impacto.atualizacao.norma.orgao,
              status: "ATIVA",
              dataPublicacao: impacto.atualizacao.norma.dataPublicacao,
              dataVigencia: impacto.atualizacao.norma.dataVigencia,
              ementa: impacto.atualizacao.norma.ementa,
              categorias: impacto.atualizacao.norma.categorias,
              aplicabilidade: impacto.atualizacao.norma.aplicabilidade,
              popsImpactados: impacto.atualizacao.impactoPOPs,
              nivelImpacto: impacto.severidade,
              complexidade: this.calcularComplexidade(impacto.atualizacao)
            }
          });
        }

        // Criar atualização
        const atualizacaoDB = await prisma.atualizacaoNorma.create({
          data: {
            normaId: norma.id,
            tipo: impacto.atualizacao.tipo,
            descricao: impacto.atualizacao.descricao,
            detalhes: impacto.atualizacao.detalhes,
            dataDeteccao: new Date(),
            dataPublicacao: impacto.atualizacao.norma.dataPublicacao,
            impactoPOPs: impacto.atualizacao.impactoPOPs,
            acoesNecessarias: impacto.atualizacao.acoesNecessarias,
            status: "COMUNICADA",
            detectadoPor: "Sistema IA"
          }
        });

        // Criar alerta
        await prisma.alertaNorma.create({
          data: {
            normaId: norma.id,
            atualizacaoId: atualizacaoDB.id,
            tenantId: impacto.tenantId,
            titulo: `ATUALIZAÇÃO CRÍTICA: ${impacto.atualizacao.norma.numero}`,
            mensagem: impacto.atualizacao.descricao,
            tipo: impacto.prioridade >= 4 ? "CRÍTICO" : "ALERTA",
            prioridade: impacto.prioridade,
            popsAfetados: impacto.atualizacao.impactoPOPs,
            setoresAfetados: impacto.popsAfetados.map((pop: any) => pop.setor),
            impactoOperacional: `${impacto.popsAfetados.length} POPs precisam de atualização`,
            acoesRecomendadas: impacto.atualizacao.acoesNecessarias,
            prazoAcao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            status: "NOVO",
            notificadoPor: "Sistema IA"
          }
        });

        // Criar auditoria log
        await createAuditLog({
          action: AUDIT_ACTIONS.POP_CREATED,
          entity: "AlertaNorma",
          entityId: atualizacaoDB.id,
          userId: "system",
          userName: "Sistema IA",
          tenantId: impacto.tenantId,
          details: {
            norma: impacto.atualizacao.norma.numero,
            tipo: impacto.atualizacao.tipo,
            popsAfetados: impacto.popsAfetados.length
          }
        });

        console.log(`Alerta gerado para tenant ${impacto.tenantNome}: ${impacto.atualizacao.norma.numero}`);
      }
    }
  }

  /**
   * Atualiza base de normas com novas informações
   */
  private async atualizarBaseNormas(atualizacoes: AtualizacaoDetectada[]): Promise<void> {
    for (const atualizacao of atualizacoes) {
      await prisma.normaRegulatoria.upsert({
    // @ts-ignore
        where: { numero: atualizacao.norma.numero },
        update: {
          titulo: atualizacao.norma.titulo,
          status: "ATUALIZADA",
          updatedAt: new Date()
        },
        create: {
          numero: atualizacao.norma.numero,
          titulo: atualizacao.norma.titulo,
          tipo: atualizacao.norma.tipo,
          orgao: atualizacao.norma.orgao,
          status: "ATIVA",
          dataPublicacao: atualizacao.norma.dataPublicacao,
          dataVigencia: atualizacao.norma.dataVigencia,
          ementa: atualizacao.norma.ementa,
          categorias: atualizacao.norma.categorias,
          aplicabilidade: atualizacao.norma.aplicabilidade,
          popsImpactados: atualizacao.impactoPOPs,
          nivelImpacto: this.calcularSeveridade(atualizacao, 5),
          complexidade: this.calcularComplexidade(atualizacao)
        }
      });
    }
  }

  /**
   * Calcula severidade do impacto
   */
  private calcularSeveridade(atualizacao: AtualizacaoDetectada, numPOPs: number): number {
    let base = 1;
    
    // Tipo de atualização
    if (atualizacao.tipo === "NOVA_NORMA") base += 2;
    if (atualizacao.tipo === "ALTERACAO") base += 1;
    if (atualizacao.tipo === "REVOGACAO") base += 3;
    
    // Número de POPs afetados
    base += Math.min(numPOPs, 3);
    
    // Categorias críticas
    if (atualizacao.norma.categorias.includes("Segurança")) base += 2;
    if (atualizacao.norma.categorias.includes("Qualidade")) base += 1;
    
    return Math.min(base, 5);
  }

  /**
   * Calcula prioridade de ação
   */
  private calcularPrioridade(atualizacao: AtualizacaoDetectada): number {
    let prioridade = 1;
    
    if (atualizacao.tipo === "NOVA_NORMA") prioridade += 3;
    if (atualizacao.tipo === "ALTERACAO") prioridade += 2;
    if (atualizacao.tipo === "REVOGACAO") prioridade += 4;
    
    // Prazo de vigência curto aumenta prioridade
    if (atualizacao.norma.dataVigencia) {
      const diasParaVigencia = Math.floor(
        (atualizacao.norma.dataVigencia.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      if (diasParaVigencia < 30) prioridade += 2;
      if (diasParaVigencia < 7) prioridade += 3;
    }
    
    return Math.min(prioridade, 5);
  }

  /**
   * Calcula complexidade de implementação
   */
  private calcularComplexidade(atualizacao: AtualizacaoDetectada): number {
    let complexidade = 1;
    
    // Número de POPs afetados
    complexidade += Math.min(atualizacao.impactoPOPs.length, 3);
    
    // Número de ações necessárias
    complexidade += Math.min(atualizacao.acoesNecessarias.length, 2);
    
    // Detalhes da atualização
    if (atualizacao.detalhes?.secoesAlteradas) {
      complexidade += Math.min(atualizacao.detalhes.secoesAlteradas.length, 2);
    }
    
    return Math.min(complexidade, 5);
  }

  /**
   * Verifica status do monitoramento
   */
  getStatus(): { isRunning: boolean; proximaExecucao?: Date } {
    return {
      isRunning: this.isRunning,
      proximaExecucao: this.intervalo ? new Date(Date.now() + 60 * 60 * 1000) : undefined
    };
  }
}

// Export singleton
export const anvisaMonitor = ANVISAMonitor.getInstance();

// Função para iniciar monitoramento (chamada pelo servidor)
export async function iniciarMonitoramentoANVISA(): Promise<void> {
  await anvisaMonitor.iniciarMonitoramento(60); // 60 minutos
}

// Função para parar monitoramento
export function pararMonitoramentoANVISA(): void {
  anvisaMonitor.pararMonitoramento();
}
