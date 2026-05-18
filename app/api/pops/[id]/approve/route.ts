import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, createAuditLog, createDocumentLifecycleEvent } from "@/lib/audit";
import { rtApprovalSchema } from "@/lib/validations";
import { canApproveAsRT, forbidden, getCurrentUser, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canApproveAsRT(user)) return forbidden("Apenas Responsável Técnico pode decidir aprovação documental");

    const body = await request.json();
    const parsed = rtApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
    }

    const pop = await prisma.pop.findFirst({
      where: {
        id: params.id,
        ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }),
      },
      include: {
        assistedDrafts: { orderBy: { createdAt: "desc" }, take: 1 },
        approvedVersions: { where: { status: "CURRENT" }, orderBy: { approvedAt: "desc" } },
      },
    });

    if (!pop) {
      return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });
    }

    const decision = parsed.data.decision;
    const version = parsed.data.version || pop.versao || "1.0";
    const statusTo = decision === "APPROVED" ? "VIGENTE" : decision === "REJECTED" ? "REJEITADO" : "EM_REVISAO";
    const draft = pop.assistedDrafts[0];

    const result = await prisma.$transaction(async (tx) => {
      let approvedVersion = null;
      let obsoleteVersions: Array<{ id: string; version: string; status: string }> = [];

      if (decision === "APPROVED") {
        obsoleteVersions = await tx.approvedPopVersion.findMany({
          where: { tenantId: pop.tenantId, popId: pop.id, status: "CURRENT" },
          select: { id: true, version: true, status: true },
        });

        await tx.approvedPopVersion.updateMany({
          where: { tenantId: pop.tenantId, popId: pop.id, status: "CURRENT" },
          data: { status: "OBSOLETE", obsoleteAt: new Date() },
        });

        approvedVersion = await tx.approvedPopVersion.create({
          data: {
            tenantId: pop.tenantId,
            popId: pop.id,
            draftId: draft?.id || null,
            code: pop.codigo,
            title: pop.titulo,
            version,
            status: "CURRENT",
            contentSnapshot: pop.conteudo || pop.descricao || null,
            approvedByUserId: user.id,
            approvedByUserName: user.name || user.email || null,
          },
        });
      }

      const updatedPop = await tx.pop.update({
        where: { id: pop.id },
        data: {
          status: statusTo,
          versao: version,
          validadoEm: decision === "APPROVED" ? new Date() : pop.validadoEm,
          validadoPor: decision === "APPROVED" ? user.name || user.email || null : pop.validadoPor,
        },
      });

      if (draft) {
        await tx.assistedPopDraft.update({
          where: { id: draft.id },
          data: {
            status: statusTo,
            version,
            submittedAt: draft.submittedAt || new Date(),
            submittedByUserId: draft.submittedByUserId || user.id,
            submittedByUserName: draft.submittedByUserName || user.name || user.email || null,
          },
        });
      }

      const approvalEvent = await tx.rTApprovalEvent.create({
        data: {
          tenantId: pop.tenantId,
          popId: pop.id,
          draftId: draft?.id || null,
          approvedPopVersionId: approvedVersion?.id || null,
          decision,
          statusFrom: pop.status,
          statusTo,
          version,
          comment: parsed.data.comment || null,
          userId: user.id,
          userName: user.name || user.email || null,
        },
      });

      return { updatedPop, approvedVersion, approvalEvent, obsoleteVersions };
    });

    await createAuditLog({
      action:
        decision === "APPROVED"
          ? AUDIT_ACTIONS.POP_RT_APPROVED
          : decision === "REJECTED"
            ? AUDIT_ACTIONS.POP_RT_REJECTED
            : AUDIT_ACTIONS.POP_CHANGES_REQUESTED,
      entity: "Pop",
      entityId: pop.id,
      userId: user.id,
      userName: user.name || undefined,
      tenantId: pop.tenantId,
      details: { decision, statusFrom: pop.status, statusTo, version, approvedPopVersionId: result.approvedVersion?.id },
    });

    await createDocumentLifecycleEvent({
      tenantId: pop.tenantId,
      entityType: "Pop",
      entityId: pop.id,
      relatedEntityType: result.approvedVersion ? "ApprovedPopVersion" : "RTApprovalEvent",
      relatedEntityId: result.approvedVersion?.id || result.approvalEvent.id,
      action: decision,
      statusFrom: pop.status,
      statusTo,
      version,
      userId: user.id,
      userName: user.name || undefined,
      metadata: { comment: parsed.data.comment || null },
    });

    for (const obsoleteVersion of result.obsoleteVersions) {
      await createDocumentLifecycleEvent({
        tenantId: pop.tenantId,
        entityType: "ApprovedPopVersion",
        entityId: obsoleteVersion.id,
        relatedEntityType: "Pop",
        relatedEntityId: pop.id,
        action: "VERSION_OBSOLETED",
        statusFrom: obsoleteVersion.status,
        statusTo: "OBSOLETE",
        version: obsoleteVersion.version,
        userId: user.id,
        userName: user.name || undefined,
        metadata: {
          popId: pop.id,
          oldVersion: obsoleteVersion.version,
          newVersion: version,
          newApprovedPopVersionId: result.approvedVersion?.id,
        },
      });
    }

    return NextResponse.json({ success: true, pop: result.updatedPop, approvedVersion: result.approvedVersion });
  } catch (error: any) {
    console.error("Error approving POP:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Esta versão já foi aprovada para este POP" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao registrar decisão do RT" }, { status: 500 });
  }
}
