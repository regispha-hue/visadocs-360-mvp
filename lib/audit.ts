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

interface DocumentLifecycleEventData {
  tenantId: string;
  entityType: string;
  entityId: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  action: string;
  statusFrom?: string;
  statusTo?: string;
  version?: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
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

export async function createDocumentLifecycleEvent(data: DocumentLifecycleEventData) {
  try {
    await prisma.documentLifecycleEvent.create({
      data: {
        tenantId: data.tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        action: data.action,
        statusFrom: data.statusFrom,
        statusTo: data.statusTo,
        version: data.version,
        userId: data.userId,
        userName: data.userName,
        metadata: data.metadata as any,
      },
    });
  } catch (error) {
    console.error("Error creating document lifecycle event:", error);
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
  POP_DRAFT_GENERATED: "POP_DRAFT_GENERATED",
  POP_SUBMITTED_FOR_REVIEW: "POP_SUBMITTED_FOR_REVIEW",
  POP_RT_APPROVED: "POP_RT_APPROVED",
  POP_RT_REJECTED: "POP_RT_REJECTED",
  POP_CHANGES_REQUESTED: "POP_CHANGES_REQUESTED",
  POP_VERSION_CREATED: "POP_VERSION_CREATED",
  COLABORADOR_CREATED: "COLABORADOR_CREATED",
  COLABORADOR_UPDATED: "COLABORADOR_UPDATED",
  TREINAMENTO_CREATED: "TREINAMENTO_CREATED",
  TREINAMENTO_UPDATED: "TREINAMENTO_UPDATED",
  TREINAMENTO_COMPLETED: "TREINAMENTO_COMPLETED",
  TREINAMENTO_LINKED_TO_VERSION: "TREINAMENTO_LINKED_TO_VERSION",
  EVIDENCE_CREATED: "EVIDENCE_CREATED",
  LIBRARY_ITEM_CREATED: "LIBRARY_ITEM_CREATED",
  LIBRARY_ITEM_UPDATED: "LIBRARY_ITEM_UPDATED",
  LIBRARY_ITEM_STATUS_CHANGED: "LIBRARY_ITEM_STATUS_CHANGED",
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
  CANONICAL_INGESTION_JOB_CREATED: "CANONICAL_INGESTION_JOB_CREATED",
  CANONICAL_DOCUMENT_CHUNKED: "CANONICAL_DOCUMENT_CHUNKED",
  NAO_CONFORMIDADE_CREATED: "NAO_CONFORMIDADE_CREATED",
  NAO_CONFORMIDADE_INVESTIGATED: "NAO_CONFORMIDADE_INVESTIGATED",
  NAO_CONFORMIDADE_CAPA_PLANNED: "NAO_CONFORMIDADE_CAPA_PLANNED",
  NAO_CONFORMIDADE_IMPLEMENTED: "NAO_CONFORMIDADE_IMPLEMENTED",
  NAO_CONFORMIDADE_EFFECTIVENESS_CHECKED: "NAO_CONFORMIDADE_EFFECTIVENESS_CHECKED",
  NAO_CONFORMIDADE_CLOSED: "NAO_CONFORMIDADE_CLOSED",
  NAO_CONFORMIDADE_CANCELLED: "NAO_CONFORMIDADE_CANCELLED",
  NAO_CONFORMIDADE_COMMENTED: "NAO_CONFORMIDADE_COMMENTED",
};

