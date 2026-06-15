export type KnownUserRole = "SUPER_ADMIN" | "ADMIN" | "RT" | "OPERADOR";
export type UserRole = KnownUserRole | string;

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
  ADMIN: "Administrador",
  RT: "Responsável Técnico",
  OPERADOR: "Operador",
};

export const STATUS_TENANT_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  CANCELADO: "Cancelado",
};

export const STATUS_SUBSCRIPTION_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  CANCELADO: "Cancelado",
};

export const STATUS_POP_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EM_REVISAO: "Em revisão pelo RT",
  REJEITADO: "Rejeitado pelo RT",
  APROVADO: "Aprovado pelo RT",
  VIGENTE: "Vigente para uso interno",
  OBSOLETO: "Obsoleto",
  ATIVO: "Ativo",
  ARQUIVADO: "Arquivado",
};

export const DOCUMENT_STATUSES = {
  DRAFT: "RASCUNHO",
  IN_REVIEW: "EM_REVISAO",
  REJECTED: "REJEITADO",
  APPROVED: "APROVADO",
  CURRENT: "VIGENTE",
  OBSOLETE: "OBSOLETO",
  ARCHIVED: "ARQUIVADO",
} as const;

export const LIBRARY_ITEM_TYPES = {
  POP: "POP",
  RQ: "RQ",
  MANUAL: "MANUAL",
  TRAINING: "TREINAMENTO",
  EVIDENCE: "EVIDENCIA",
  REFERENCE: "REFERENCIA",
} as const;

export const REGULATORY_NOTICE_COPY =
  "Artefatos assistidos permanecem como minuta ou registro operacional auxiliar ate revisao e aprovacao do Responsavel Tecnico.";

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
  ADMIN: [
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
    "pops:approve",
    "document-library:read",
    "document-library:create",
    "document-library:update",
    "treinamentos:read",
    "treinamentos:create",
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


