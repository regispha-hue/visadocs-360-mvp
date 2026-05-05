import { prisma } from "./db";

interface AuditLogData {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  tenantId?: string;
  details?: Record<string, any>;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        userId: data.userId,
        userName: data.userName,
        tenantId: data.tenantId,
        details: data.details as any,
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
}

export const AUDIT_ACTIONS = {
  TENANT_CREATED: "TENANT_CREATED",
  TENANT_APPROVED: "TENANT_APPROVED",
  TENANT_SUSPENDED: "TENANT_SUSPENDED",
  TENANT_REACTIVATED: "TENANT_REACTIVATED",
  TENANT_CANCELLED: "TENANT_CANCELLED",
  TENANT_UPDATED: "TENANT_UPDATED",
  POP_CREATED: "POP_CREATED",
  POP_UPDATED: "POP_UPDATED",
  POP_ARCHIVED: "POP_ARCHIVED",
  POP_ACTIVATED: "POP_ACTIVATED",
  COLABORADOR_CREATED: "COLABORADOR_CREATED",
  COLABORADOR_UPDATED: "COLABORADOR_UPDATED",
  TREINAMENTO_CREATED: "TREINAMENTO_CREATED",
  TREINAMENTO_UPDATED: "TREINAMENTO_UPDATED",
  TREINAMENTO_COMPLETED: "TREINAMENTO_COMPLETED",
  USER_LOGIN: "USER_LOGIN",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  FORNECEDOR_CREATED: "FORNECEDOR_CREATED",
  FORNECEDOR_UPDATED: "FORNECEDOR_UPDATED",
  FORNECEDOR_DELETED: "FORNECEDOR_DELETED",
  MATERIA_PRIMA_CREATED: "MATERIA_PRIMA_CREATED",
  MATERIA_PRIMA_UPDATED: "MATERIA_PRIMA_UPDATED",
  MATERIA_PRIMA_DELETED: "MATERIA_PRIMA_DELETED",
  LOTE_CREATED: "LOTE_CREATED",
  LOTE_UPDATED: "LOTE_UPDATED",
  LOTE_STATUS_CHANGED: "LOTE_STATUS_CHANGED",
  LOTE_DELETED: "LOTE_DELETED",
  POP_MP_LINKED: "POP_MP_LINKED",
  POP_MP_UNLINKED: "POP_MP_UNLINKED",
  QUIZ_CREATED: "QUIZ_CREATED",
  QUIZ_UPDATED: "QUIZ_UPDATED",
  QUIZ_DELETED: "QUIZ_DELETED",
  QUIZ_ATTEMPTED: "QUIZ_ATTEMPTED",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_CANCELED: "subscription.canceled",
};
