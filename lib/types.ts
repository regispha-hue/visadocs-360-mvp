// @ts-ignore
import { UserRole } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
  tenantName: string | null;
}

export interface EnhancedSession {
  user: SessionUser;
  expires: string;
}

export const SETORES = [
  "Gestão da Qualidade e Documentação",
  "Recursos Humanos e Pessoal",
  "Qualificação de Fornecedores e Prestadores",
  "Infraestrutura e Segurança",
  "Equipamentos e Calibração",
  "Limpeza e Higienização",
  "Atendimento e Dispensação",
  "Escrituração e Rastreabilidade",
  "Controle de Qualidade",
  "Almoxarifado e Estoque",
  "Área de Manipulação",
  "Água Purificada",
] as const;

export const FUNCOES = [
  "RT",
  "ANALISTA_CQ",
  "MANIPULADOR",
  "OPERADOR",
  "AUXILIAR",
] as const;

export const FUNCOES_LABELS: Record<string, string> = {
  RT: "Responsável Técnico",
  ANALISTA_CQ: "Analista de CQ",
  MANIPULADOR: "Manipulador",
  OPERADOR: "Operador",
  AUXILIAR: "Auxiliar",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN_FARMACIA: "Admin Farmácia",
  RT: "Responsável Técnico",
  ANALISTA_CQ: "Analista CQ",
  OPERADOR: "Operador",
};

export const STATUS_TENANT_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  CANCELADO: "Cancelado",
};

export const STATUS_SUBSCRIPTION_LABELS: Record<string, string> = {
  TRIAL: "Trial",
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  CANCELADO: "Cancelado",
};

export const STATUS_POP_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ATIVO: "Ativo",
  ARQUIVADO: "Arquivado",
};

export const STATUS_COLABORADOR_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
};

export const STATUS_TREINAMENTO_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_AVALIACAO: "Em Avaliação",
  CONCLUIDO: "Concluído",
};

export const STATUS_MATERIA_PRIMA_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  DESCONTINUADO: "Descontinuado",
};

export const STATUS_LOTE_LABELS: Record<string, string> = {
  QUARENTENA: "Quarentena",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
  VENCIDO: "Vencido",
  EM_USO: "Em Uso",
  ESGOTADO: "Esgotado",
};

export const CATEGORIAS_MP = [
  "Princípio Ativo",
  "Excipiente",
  "Adjuvante",
  "Veículo",
  "Conservante",
  "Corante",
  "Aromatizante",
  "Embalagem",
  "Outro",
] as const;

export const UNIDADES_MEDIDA = [
  "g",
  "mg",
  "kg",
  "mL",
  "L",
  "unidade",
  "frasco",
  "ampola",
  "sachê",
] as const;

// Role permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN_FARMACIA: [
    "pops:read",
    "pops:create",
    "pops:update",
    "pops:delete",
    "colaboradores:read",
    "colaboradores:create",
    "colaboradores:update",
    "colaboradores:delete",
    "treinamentos:read",
    "treinamentos:create",
    "treinamentos:update",
    "treinamentos:delete",
    "users:read",
    "users:create",
    "users:update",
    "reports:read",
  ],
  RT: [
    "pops:read",
    "pops:create",
    "pops:update",
    "colaboradores:read",
    "treinamentos:read",
    "treinamentos:create",
    "treinamentos:update",
    "reports:read",
  ],
  ANALISTA_CQ: [
    "pops:read",
    "colaboradores:read",
    "treinamentos:read",
    "reports:read",
  ],
  OPERADOR: [
    "pops:read",
    "treinamentos:read",
    "treinamentos:create:self",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}
