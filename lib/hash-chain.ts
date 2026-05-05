/**
 * SHA-256 Hash Chain - Integridade Temporal
 * Implementa prova de integridade blockchain-like para treinamentos
 */

import { createHash } from "crypto";

/**
 * Gera hash SHA-256 para um treinamento
 * @param data Dados do treinamento
 * @param hashAnterior Hash do treinamento anterior (opcional)
 * @returns Hash SHA-256 hex string
 */
export function generateTrainingHash(
  data: {
    id: string;
    popId: string;
    colaboradorId: string;
    dataTreinamento: Date;
    status: string;
    notaQuiz?: number | null;
    aprovadoQuiz?: boolean | null;
    tenantId: string;
  },
  hashAnterior?: string | null
): string {
  // Criar string normalizada dos dados
  const dataString = JSON.stringify({
    id: data.id,
    popId: data.popId,
    colaboradorId: data.colaboradorId,
    dataTreinamento: data.dataTreinamento.toISOString(),
    status: data.status,
    notaQuiz: data.notaQuiz,
    aprovadoQuiz: data.aprovadoQuiz,
    tenantId: data.tenantId,
    hashAnterior: hashAnterior || "0", // Genesis hash se não houver anterior
    timestamp: Date.now(), // Timestamp da geração do hash
  });

  // Gerar SHA-256
  return createHash("sha256").update(dataString).digest("hex");
}

/**
 * Verifica a integridade de um hash
 * @param data Dados do treinamento
 * @param hashAnterior Hash anterior registrado
 * @param hashAtual Hash atual a verificar
 * @returns boolean indicando se hash é válido
 */
export function verifyTrainingHash(
  data: {
    id: string;
    popId: string;
    colaboradorId: string;
    dataTreinamento: Date;
    status: string;
    notaQuiz?: number | null;
    aprovadoQuiz?: boolean | null;
    tenantId: string;
  },
  hashAnterior: string | null,
  hashAtual: string
): boolean {
  const calculatedHash = generateTrainingHash(data, hashAnterior);
  return calculatedHash === hashAtual;
}

/**
 * Verifica a integridade de toda a chain de um colaborador
 * @param treinamentos Lista de treinamentos ordenada por data
 * @returns Objeto com resultado da verificação
 */
export function verifyChainIntegrity(
  treinamentos: Array<{
    id: string;
    popId: string;
    colaboradorId: string;
    dataTreinamento: Date;
    status: string;
    notaQuiz?: number | null;
    aprovadoQuiz?: boolean | null;
    tenantId: string;
    hashAtual: string | null;
    hashAnterior: string | null;
  }>
): {
  valid: boolean;
  brokenAtIndex?: number;
  brokenId?: string;
  totalVerified: number;
  genesisHash: string | null;
} {
  if (treinamentos.length === 0) {
    return { valid: true, totalVerified: 0, genesisHash: null };
  }

  // Ordenar por data
  const sorted = [...treinamentos].sort(
    (a, b) =>
      new Date(a.dataTreinamento).getTime() - new Date(b.dataTreinamento).getTime()
  );

  let previousHash: string | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];

    // Verificar se hashAtual existe
    if (!t.hashAtual) {
      return {
        valid: false,
        brokenAtIndex: i,
        brokenId: t.id,
        totalVerified: i,
        genesisHash: sorted[0]?.hashAtual || null,
      };
    }

    // Verificar se hashAnterior corresponde ao anterior real
    if (i > 0) {
      // Se não é o primeiro, hashAnterior deve ser o hashAtual do anterior
      if (t.hashAnterior !== sorted[i - 1].hashAtual) {
        return {
          valid: false,
          brokenAtIndex: i,
          brokenId: t.id,
          totalVerified: i,
          genesisHash: sorted[0]?.hashAtual || null,
        };
      }
    } else {
      // Primeiro treinamento (genesis) não precisa de hashAnterior válido
      // ou pode ser null/"0"
    }

    // Verificar se o hash calculado corresponde ao armazenado
    const isValid = verifyTrainingHash(
      {
        id: t.id,
        popId: t.popId,
        colaboradorId: t.colaboradorId,
        dataTreinamento: new Date(t.dataTreinamento),
        status: t.status,
        notaQuiz: t.notaQuiz,
        aprovadoQuiz: t.aprovadoQuiz,
        tenantId: t.tenantId,
      },
      t.hashAnterior,
      t.hashAtual
    );

    if (!isValid) {
      return {
        valid: false,
        brokenAtIndex: i,
        brokenId: t.id,
        totalVerified: i,
        genesisHash: sorted[0]?.hashAtual || null,
      };
    }

    previousHash = t.hashAtual;
  }

  return {
    valid: true,
    totalVerified: sorted.length,
    genesisHash: sorted[0]?.hashAtual || null,
  };
}

/**
 * Formata hash para exibição curta
 * @param hash Hash completo
 * @returns Primeiros e últimos 8 caracteres
 */
export function formatHashShort(hash: string): string {
  if (!hash || hash.length < 16) return hash || "N/A";
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}

/**
 * Gera código de verificação para QR Code
 * @param treinamentoId ID do treinamento
 * @param hash Hash do treinamento
 * @returns Código curto de verificação
 */
export function generateVerificationCode(
  treinamentoId: string,
  hash: string
): string {
  const combined = `${treinamentoId}:${hash}`;
  const code = createHash("sha256").update(combined).digest("hex");
  return code.substring(0, 16).toUpperCase(); // 16 chars uppercase
}
