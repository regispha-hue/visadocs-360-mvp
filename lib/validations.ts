import { z } from "zod";

// CNPJ validation
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/[^\d]/g, "");
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weight[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleaned[12]) !== digit) return false;

  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weight[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cleaned[13]) === digit;
}

// CPF validation
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/[^\d]/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (parseInt(cleaned[9]) !== digit) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return parseInt(cleaned[10]) === digit;
}

export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/[^\d]/g, "");
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/[^\d]/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function maskCPF(cpf: string): string {
  const cleaned = cpf.replace(/[^\d]/g, "");
  if (cleaned.length !== 11) return "***.***.***-**";
  return `${cleaned.slice(0, 3)}.***.**$-${cleaned.slice(-2)}`;
}

// Zod schemas
export const cadastroFarmaciaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cnpj: z.string().refine(validateCNPJ, "CNPJ inválido"),
  responsavel: z.string().min(3, "Nome do responsável é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  endereco: z.object({
    logradouro: z.string().min(1, "Logradouro é obrigatório"),
    numero: z.string().min(1, "Número é obrigatório"),
    complemento: z.string().optional(),
    bairro: z.string().min(1, "Bairro é obrigatório"),
    cidade: z.string().min(1, "Cidade é obrigatória"),
    estado: z.string().length(2, "Estado deve ter 2 caracteres"),
    cep: z.string().length(8, "CEP deve ter 8 dígitos"),
  }),
  aceitaTermos: z.boolean().refine((val) => val === true, "Aceite os termos"),
});

export const popSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  setor: z.string().min(1, "Setor é obrigatório"),
  versao: z.string().min(1, "Versão é obrigatória"),
  dataRevisao: z.string().min(1, "Data de revisão é obrigatória"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  objetivo: z.string().min(10, "Objetivo deve ter pelo menos 10 caracteres"),
  descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  status: z.enum(["RASCUNHO", "ATIVO", "ARQUIVADO"]).optional(),
});

export const colaboradorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().refine(validateCPF, "CPF inválido"),
  funcao: z.string().min(1, "Função é obrigatória"),
  setor: z.string().min(1, "Setor é obrigatório"),
  dataAdmissao: z.string().min(1, "Data de admissão é obrigatória"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export const treinamentoSchema = z.object({
  popId: z.string().min(1, "POP é obrigatório"),
  colaboradorId: z.string().min(1, "Colaborador é obrigatório"),
  dataTreinamento: z.string().min(1, "Data do treinamento é obrigatória"),
  instrutor: z.string().min(1, "Instrutor é obrigatório"),
  duracao: z.number().positive("Duração deve ser positiva").optional(),
  observacoes: z.string().optional(),
  status: z.enum(["PENDENTE", "CONCLUIDO"]).optional(),
});
