/**
 * lib/compliance.ts
 * Funções compartilhadas para cálculo e manipulação de dados de compliance
 * Centraliza lógica usada por múltiplos módulos para garantir consistência
 */

import { prisma } from "./prisma";

/**
 * Interface para dados de compliance calculados
 */
export interface ComplianceStats {
  overallScore: number;
  status: "EXCELENTE" | "ADEQUADO" | "ATENÇÃO" | "CRÍTICO";
  color: "green" | "blue" | "orange" | "red";
  totalColaboradores: number;
  colaboradoresTreinados: number;
  treinamentosPendentes: number;
  treinamentosConcluidos: number;
  treinamentosAprovados: number;
  popsAtivos: number;
  percentualTreinados: number;
  percentualAprovados: number;
  lastUpdated: string;
}

/**
 * Calcula estatísticas de compliance para um tenant
 * @param tenantId - ID do tenant (farmácia)
 * @returns Estatísticas calculadas de compliance
 */
export async function calculateComplianceStats(
  tenantId: string
): Promise<ComplianceStats> {
  // Queries independentes para otimização com Promise.all
  const [
    totalColaboradores,
    colaboradoresComTreinamentos,
    treinamentosPendentes,
    treinamentosConcluidos,
    treinamentosAprovados,
    popsAtivos,
    totalTreinamentos,
  ] = await Promise.all([
    // Total de colaboradores ativos
    prisma.colaborador.count({
      where: {
        tenantId,
        status: "ATIVO",
      },
    }),

    // Colaboradores com pelo menos um treinamento
    prisma.colaborador.count({
      where: {
        tenantId,
        status: "ATIVO",
    // @ts-ignore
        Treinamento: {
          some: {},
        },
      },
    }),

    // Treinamentos pendentes
    prisma.treinamento.count({
      where: {
        tenantId,
        status: "PENDENTE",
      },
    }),

    // Treinamentos concluídos
    prisma.treinamento.count({
      where: {
        tenantId,
        status: "CONCLUIDO",
      },
    }),

    // Treinamentos com aprovação no quiz
    prisma.treinamento.count({
      where: {
        tenantId,
        status: "CONCLUIDO",
        aprovadoQuiz: true,
      },
    }),

    // POPs ativos
    prisma.pop.count({
      where: {
        tenantId,
        status: "ATIVO",
      },
    }),

    // Total de treinamentos
    prisma.treinamento.count({
      where: {
        tenantId,
      },
    }),
  ]);

  // Calcular scores
  let treinamentoScore = 0;
  let aprovacaoScore = 100;

  if (totalColaboradores > 0) {
    treinamentoScore = Math.round(
      (colaboradoresComTreinamentos / totalColaboradores) * 100
    );
  }

  if (totalTreinamentos > 0) {
    aprovacaoScore = Math.round(
      (treinamentosAprovados / totalTreinamentos) * 100
    );
  }

  // Score ponderado (60% treinamento + 40% aprovação)
  const overallScore = Math.round(
    treinamentoScore * 0.6 + aprovacaoScore * 0.4
  );

  // Determinar status e cor
  let status: ComplianceStats["status"] = "CRÍTICO";
  let color: ComplianceStats["color"] = "red";

  if (overallScore >= 90) {
    status = "EXCELENTE";
    color = "green";
  } else if (overallScore >= 70) {
    status = "ADEQUADO";
    color = "blue";
  } else if (overallScore >= 50) {
    status = "ATENÇÃO";
    color = "orange";
  }

  return {
    overallScore,
    status,
    color,
    totalColaboradores,
    colaboradoresTreinados: colaboradoresComTreinamentos,
    treinamentosPendentes,
    treinamentosConcluidos,
    treinamentosAprovados,
    popsAtivos,
    percentualTreinados: treinamentoScore,
    percentualAprovados: aprovacaoScore,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Mascara um CNPJ para exibição pública
 * Formato: XX.XXX.XXX/XXXX-XX com máscara parcial
 */
export function maskCNPJ(cnpj: string): string {
  if (!cnpj) return "N/A";
  
  // Remove formatação existente
  const cleanCNPJ = cnpj.replace(/\D/g, "");
  
  if (cleanCNPJ.length !== 14) {
    return "CNPJ inválido";
  }
  
  // Aplica máscara com ocultação: XX.***.***/XXXX-XX
  return cleanCNPJ.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.***.***/$4-$5"
  );
}

/**
 * Formata endereço para exibição
 */
export function formatEndereco(endereco: any): string {
  if (!endereco) return "N/A";
  
  // Se for string JSON, fazer parse
  if (typeof endereco === "string") {
    try {
      endereco = JSON.parse(endereco);
    } catch {
      return endereco;
    }
  }

  const parts = [
    endereco.logradouro,
    endereco.numero,
    endereco.bairro,
    endereco.cidade,
    endereco.estado,
  ].filter(Boolean);

  return parts.join(", ") || "N/A";
}

/**
 * Gera token único de compliance
 */
export function generateComplianceToken(tenantId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const tenantPrefix = tenantId.substring(0, 8).toUpperCase();
  return `CMP-${tenantPrefix}-${timestamp}-${random}`.toUpperCase();
}

/**
 * Configuração padrão para geração de QR Code
 */
export const QR_CODE_CONFIG = {
  width: 400,
  margin: 2,
  color: {
    dark: "#0d9488", // teal-600
    light: "#ffffff",
  },
};

/**
 * Interface para dados do QR Code
 * Usada tanto no backend quanto no frontend
 */
export interface QRCodeData {
  qrCode: string;
  url: string;
  token: string;
  expiresAt: string;
  farmacia: {
    nome: string;
    cnpj: string;
    responsavel: string;
    totalColaboradores: number;
    totalPOPs: number;
  };
  compliance: Pick<ComplianceStats, "overallScore" | "status" | "color">;
  instructions: string[];
}

/**
 * Valida formato básico de token de compliance
 */
export function isValidComplianceTokenFormat(token: string): boolean {
  if (!token) return false;
  
  // Formato esperado: CMP-XXXXXXXX-XXXXXXXX-XXXXXX
  const tokenRegex = /^CMP-[A-Z0-9]{8}-[A-Z0-9]{8,}-[A-Z0-9]{6}$/;
  return tokenRegex.test(token);
}

/**
 * Hash de IP para anonimização (LGPD)
 */
export function hashIP(ip: string | null): string | null {
  if (!ip) return null;
  
  // Simplificado: retorna primeiros e últimos octetos
  const parts = ip.split(".");
  if (parts.length === 4) {
    // IPv4: XXX.***.***.XXX
    return `${parts[0]}.***.***.${parts[3]}`;
  }
  
  // IPv6 ou inválido: hash completo
  return "***hash***";
}

/**
 * Extrai informação básica de browser a partir de user agent
 */
export function extractBrowserInfo(userAgent: string | null): {
  browser: string;
  os: string;
} {
  if (!userAgent) {
    return { browser: "Unknown", os: "Unknown" };
  }

  // Detecção simplificada
  let browser = "Unknown";
  let os = "Unknown";

  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";

  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS")) os = "iOS";

  return { browser, os };
}
