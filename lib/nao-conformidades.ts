import { AUDIT_ACTIONS, createAuditLog, createDocumentLifecycleEvent } from "@/lib/audit";
import type { GuardUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const NC_STATUS = {
  ABERTA: "ABERTA",
  EM_INVESTIGACAO: "EM_INVESTIGACAO",
  CAPA_PLANEJADA: "CAPA_PLANEJADA",
  EM_IMPLEMENTACAO: "EM_IMPLEMENTACAO",
  FECHADA: "FECHADA",
  CANCELADA: "CANCELADA",
} as const;

export const NC_GRAVIDADE = {
  CRITICA: "CRITICA",
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BAIXA: "BAIXA",
} as const;

export type NcStatus = (typeof NC_STATUS)[keyof typeof NC_STATUS];
export type NcGravidade = (typeof NC_GRAVIDADE)[keyof typeof NC_GRAVIDADE];

export const GRAVIDADE_PRAZO_DIAS: Record<NcGravidade, number> = {
  CRITICA: 7,
  ALTA: 15,
  MEDIA: 30,
  BAIXA: 60,
};

export const NC_ORIGENS = [
  "AUDITORIA_INTERNA",
  "AUTOINSPECAO",
  "RECLAMACAO",
  "DESVIO_PROCESSO",
  "FISCALIZACAO",
  "TREINAMENTO",
  "OUTRA",
] as const;

export function isNcManager(user: GuardUser) {
  return ["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role);
}

export function isRt(user: GuardUser) {
  return user.role === "RT";
}

export function requiresRtApproval(gravidade?: string | null) {
  return gravidade === NC_GRAVIDADE.CRITICA || gravidade === NC_GRAVIDADE.ALTA;
}

export function calculateDueDate(gravidade: NcGravidade, from = new Date()) {
  const dueDate = new Date(from);
  dueDate.setDate(dueDate.getDate() + GRAVIDADE_PRAZO_DIAS[gravidade]);
  return dueDate;
}

export function validateGravidade(value: unknown): NcGravidade | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return Object.values(NC_GRAVIDADE).includes(normalized as NcGravidade)
    ? (normalized as NcGravidade)
    : null;
}

export function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function validateRequiredLinkage(body: Record<string, unknown>) {
  return Boolean(
    normalizeText(body.popId) ||
      normalizeText(body.loteId) ||
      normalizeText(body.equipamentoId) ||
      normalizeText(body.colaboradorId) ||
      normalizeText(body.reclamacaoId)
  );
}

export function appendTimeline(history: unknown, event: Record<string, unknown>) {
  const current = Array.isArray(history) ? history : [];
  return [
    ...current,
    {
      ...event,
      at: new Date().toISOString(),
    },
  ];
}

export async function nextNcCode(tenantId: string) {
  const year = new Date().getFullYear();
  const prefix = `NC-${year}-`;
  const count = await prisma.naoConformidade.count({
    where: {
      tenantId,
      codigo: {
        startsWith: prefix,
      },
    },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export async function auditNcTransition(params: {
  tenantId: string;
  entityId: string;
  action: string;
  statusFrom?: string | null;
  statusTo?: string | null;
  user: GuardUser;
  details?: Record<string, unknown>;
}) {
  await createAuditLog({
    action: params.action,
    entity: "NaoConformidade",
    entityId: params.entityId,
    userId: params.user.id,
    userName: params.user.name || params.user.email || undefined,
    tenantId: params.tenantId,
    details: {
      statusFrom: params.statusFrom,
      statusTo: params.statusTo,
      ...params.details,
    },
  });

  await createDocumentLifecycleEvent({
    tenantId: params.tenantId,
    entityType: "NaoConformidade",
    entityId: params.entityId,
    action: params.action,
    statusFrom: params.statusFrom || undefined,
    statusTo: params.statusTo || undefined,
    userId: params.user.id,
    userName: params.user.name || params.user.email || undefined,
    metadata: params.details,
  });
}

export const NC_ACTION_AUDIT: Record<string, string> = {
  created: AUDIT_ACTIONS.NAO_CONFORMIDADE_CREATED,
  investigated: AUDIT_ACTIONS.NAO_CONFORMIDADE_INVESTIGATED,
  planned: AUDIT_ACTIONS.NAO_CONFORMIDADE_CAPA_PLANNED,
  implemented: AUDIT_ACTIONS.NAO_CONFORMIDADE_IMPLEMENTED,
  verified: AUDIT_ACTIONS.NAO_CONFORMIDADE_EFFECTIVENESS_CHECKED,
  closed: AUDIT_ACTIONS.NAO_CONFORMIDADE_CLOSED,
  cancelled: AUDIT_ACTIONS.NAO_CONFORMIDADE_CANCELLED,
  commented: AUDIT_ACTIONS.NAO_CONFORMIDADE_COMMENTED,
};
