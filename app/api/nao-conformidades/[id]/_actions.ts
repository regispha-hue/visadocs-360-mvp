import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  NC_ACTION_AUDIT,
  NC_STATUS,
  appendTimeline,
  auditNcTransition,
  isNcManager,
  isRt,
  normalizeText,
  requiresRtApproval,
} from "@/lib/nao-conformidades";
import type { GuardUser } from "@/lib/auth-guards";
import { badRequest, forbidden, requireTenantId } from "@/lib/auth-guards";

type ActionContext = {
  request: Request;
  params: { id: string };
  user: GuardUser;
};

async function loadNc(user: GuardUser, request: Request, id: string) {
  const { searchParams } = new URL(request.url);
  const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
  if (response) return { response };

  const item = await prisma.naoConformidade.findFirst({
    where: { id, tenantId: tenantId! },
  });

  if (!item) return { response: NextResponse.json({ error: "Não conformidade não encontrada" }, { status: 404 }) };
  return { item, tenantId: tenantId! };
}

function ensureManager(user: GuardUser) {
  return isNcManager(user) ? null : forbidden();
}

function transitionError(current: string, expected: string) {
  return badRequest(`Transição inválida: esperado ${expected}, status atual ${current}`);
}

export async function investigateNc({ request, params, user }: ActionContext) {
  const permission = ensureManager(user);
  if (permission) return permission;

  const loaded = await loadNc(user, request, params.id);
  if (loaded.response) return loaded.response;
  const { item, tenantId } = loaded;
  if (item.status !== NC_STATUS.ABERTA) return transitionError(item.status, NC_STATUS.ABERTA);

  const body = await request.json();
  const causaRaiz = normalizeText(body.causaRaiz);
  if (!causaRaiz) return badRequest("Informe a causa raiz investigada");

  const userName = user.name || user.email || "Usuário";
  const updated = await prisma.naoConformidade.update({
    where: { id: item.id },
    data: {
      status: NC_STATUS.EM_INVESTIGACAO,
      causaRaiz,
      investigadoPorId: user.id,
      investigadoPorNome: userName,
      dataInvestigacao: new Date(),
      historico: appendTimeline(item.historico, {
        action: "INVESTIGACAO",
        statusFrom: item.status,
        statusTo: NC_STATUS.EM_INVESTIGACAO,
        userId: user.id,
        userName,
      }),
    },
  });

  await auditNcTransition({
    tenantId,
    entityId: item.id,
    action: NC_ACTION_AUDIT.investigated,
    statusFrom: item.status,
    statusTo: updated.status,
    user,
    details: { causaRaiz },
  });

  return NextResponse.json({ success: true, item: updated });
}

export async function planCapa({ request, params, user }: ActionContext) {
  const permission = ensureManager(user);
  if (permission) return permission;

  const loaded = await loadNc(user, request, params.id);
  if (loaded.response) return loaded.response;
  const { item, tenantId } = loaded;
  if (item.status !== NC_STATUS.EM_INVESTIGACAO) return transitionError(item.status, NC_STATUS.EM_INVESTIGACAO);
  if (!item.causaRaiz) return badRequest("Investigue a causa raiz antes de planejar CAPA");

  const body = await request.json();
  const planoAcao = normalizeText(body.planoAcao);
  if (!planoAcao) return badRequest("Informe o plano de ação CAPA");

  const prazoImplementacao = body.prazoImplementacao ? new Date(body.prazoImplementacao) : null;
  if (!prazoImplementacao || Number.isNaN(prazoImplementacao.getTime())) {
    return badRequest("Informe um prazo de implementação válido");
  }

  const userName = user.name || user.email || "Usuário";
  const updated = await prisma.naoConformidade.update({
    where: { id: item.id },
    data: {
      status: NC_STATUS.CAPA_PLANEJADA,
      planoAcao,
      acoesCorretivas: planoAcao,
      prazoImplementacao,
      responsavelCapaId: normalizeText(body.responsavelCapaId),
      responsavelCapaNome: normalizeText(body.responsavelCapaNome) || userName,
      historico: appendTimeline(item.historico, {
        action: "PLANEJAMENTO_CAPA",
        statusFrom: item.status,
        statusTo: NC_STATUS.CAPA_PLANEJADA,
        userId: user.id,
        userName,
      }),
    },
  });

  await auditNcTransition({
    tenantId,
    entityId: item.id,
    action: NC_ACTION_AUDIT.planned,
    statusFrom: item.status,
    statusTo: updated.status,
    user,
    details: { prazoImplementacao: prazoImplementacao.toISOString() },
  });

  return NextResponse.json({ success: true, item: updated });
}

export async function implementCapa({ request, params, user }: ActionContext) {
  const permission = ensureManager(user);
  if (permission) return permission;

  const loaded = await loadNc(user, request, params.id);
  if (loaded.response) return loaded.response;
  const { item, tenantId } = loaded;
  if (item.status !== NC_STATUS.CAPA_PLANEJADA) return transitionError(item.status, NC_STATUS.CAPA_PLANEJADA);

  if (requiresRtApproval(item.severidade) && !isRt(user)) {
    return forbidden("NC crítica ou alta exige aprovação do RT antes da implementação");
  }

  const body = await request.json().catch(() => ({}));
  const userName = user.name || user.email || "Usuário";
  const updated = await prisma.naoConformidade.update({
    where: { id: item.id },
    data: {
      status: NC_STATUS.EM_IMPLEMENTACAO,
      dataImplementacao: new Date(),
      implementadoPorId: user.id,
      implementadoPorNome: userName,
      aprovadoPorRtId: requiresRtApproval(item.severidade) ? user.id : item.aprovadoPorRtId,
      aprovadoPorRtNome: requiresRtApproval(item.severidade) ? userName : item.aprovadoPorRtNome,
      dataAprovacaoRt: requiresRtApproval(item.severidade) ? new Date() : item.dataAprovacaoRt,
      observacaoFechamento: normalizeText(body.observacao) || item.observacaoFechamento,
      historico: appendTimeline(item.historico, {
        action: "IMPLEMENTACAO_CAPA",
        statusFrom: item.status,
        statusTo: NC_STATUS.EM_IMPLEMENTACAO,
        userId: user.id,
        userName,
      }),
    },
  });

  await auditNcTransition({
    tenantId,
    entityId: item.id,
    action: NC_ACTION_AUDIT.implemented,
    statusFrom: item.status,
    statusTo: updated.status,
    user,
    details: { rtApproval: requiresRtApproval(item.severidade) },
  });

  return NextResponse.json({ success: true, item: updated });
}

export async function verifyCapa({ request, params, user }: ActionContext) {
  const permission = ensureManager(user);
  if (permission) return permission;

  const loaded = await loadNc(user, request, params.id);
  if (loaded.response) return loaded.response;
  const { item, tenantId } = loaded;
  if (item.status !== NC_STATUS.EM_IMPLEMENTACAO) return transitionError(item.status, NC_STATUS.EM_IMPLEMENTACAO);

  const body = await request.json();
  const verificacaoEfetividade = normalizeText(body.verificacaoEfetividade);
  if (!verificacaoEfetividade) return badRequest("Informe a verificação de efetividade");

  const userName = user.name || user.email || "Usuário";
  const updated = await prisma.naoConformidade.update({
    where: { id: item.id },
    data: {
      verificacaoEfetividade,
      dataVerificacao: new Date(),
      verificadoPorId: user.id,
      verificadoPorNome: userName,
      historico: appendTimeline(item.historico, {
        action: "VERIFICACAO_EFETIVIDADE",
        statusFrom: item.status,
        statusTo: item.status,
        userId: user.id,
        userName,
      }),
    },
  });

  await auditNcTransition({
    tenantId,
    entityId: item.id,
    action: NC_ACTION_AUDIT.verified,
    statusFrom: item.status,
    statusTo: updated.status,
    user,
    details: { verified: true },
  });

  return NextResponse.json({ success: true, item: updated });
}

export async function closeNc({ request, params, user }: ActionContext) {
  if (!isRt(user)) return forbidden("Somente RT pode fechar não conformidades");

  const loaded = await loadNc(user, request, params.id);
  if (loaded.response) return loaded.response;
  const { item, tenantId } = loaded;
  if (item.status !== NC_STATUS.EM_IMPLEMENTACAO) return transitionError(item.status, NC_STATUS.EM_IMPLEMENTACAO);
  if (!item.verificacaoEfetividade) return badRequest("Verifique a efetividade antes de fechar");

  const body = await request.json().catch(() => ({}));
  const userName = user.name || user.email || "Usuário";
  const updated = await prisma.naoConformidade.update({
    where: { id: item.id },
    data: {
      status: NC_STATUS.FECHADA,
      fechadoPorId: user.id,
      fechadoPorNome: userName,
      dataFechamento: new Date(),
      observacaoFechamento: normalizeText(body.observacaoFechamento) || item.observacaoFechamento,
      sugestaoTreinamento: Boolean(body.sugestaoTreinamento),
      sugestaoRevisaoPop: Boolean(body.sugestaoRevisaoPop),
      historico: appendTimeline(item.historico, {
        action: "FECHAMENTO",
        statusFrom: item.status,
        statusTo: NC_STATUS.FECHADA,
        userId: user.id,
        userName,
      }),
    },
  });

  await auditNcTransition({
    tenantId,
    entityId: item.id,
    action: NC_ACTION_AUDIT.closed,
    statusFrom: item.status,
    statusTo: updated.status,
    user,
    details: {
      sugestaoTreinamento: updated.sugestaoTreinamento,
      sugestaoRevisaoPop: updated.sugestaoRevisaoPop,
    },
  });

  return NextResponse.json({ success: true, item: updated });
}

export async function cancelNc({ request, params, user }: ActionContext) {
  if (!isRt(user)) return forbidden("Somente RT pode cancelar não conformidades");

  const loaded = await loadNc(user, request, params.id);
  if (loaded.response) return loaded.response;
  const { item, tenantId } = loaded;
  if (item.status === NC_STATUS.FECHADA) return badRequest("Não é possível cancelar NC fechada");

  const body = await request.json().catch(() => ({}));
  const motivo = normalizeText(body.motivo);
  if (!motivo) return badRequest("Informe o motivo do cancelamento");

  const userName = user.name || user.email || "Usuário";
  const updated = await prisma.naoConformidade.update({
    where: { id: item.id },
    data: {
      status: NC_STATUS.CANCELADA,
      observacaoFechamento: motivo,
      historico: appendTimeline(item.historico, {
        action: "CANCELAMENTO",
        statusFrom: item.status,
        statusTo: NC_STATUS.CANCELADA,
        userId: user.id,
        userName,
      }),
    },
  });

  await auditNcTransition({
    tenantId,
    entityId: item.id,
    action: NC_ACTION_AUDIT.cancelled,
    statusFrom: item.status,
    statusTo: updated.status,
    user,
    details: { motivo },
  });

  return NextResponse.json({ success: true, item: updated });
}

export async function addNcComment({ request, params, user }: ActionContext) {
  const permission = ensureManager(user);
  if (permission) return permission;

  const loaded = await loadNc(user, request, params.id);
  if (loaded.response) return loaded.response;
  const { item, tenantId } = loaded;

  const body = await request.json();
  const texto = normalizeText(body.texto);
  if (!texto) return badRequest("Informe o comentário");

  const userName = user.name || user.email || "Usuário";
  const comentarios = Array.isArray(item.comentarios) ? item.comentarios : [];
  const updated = await prisma.naoConformidade.update({
    where: { id: item.id },
    data: {
      comentarios: [
        ...comentarios,
        {
          id: crypto.randomUUID(),
          texto,
          userId: user.id,
          userName,
          createdAt: new Date().toISOString(),
        },
      ],
      historico: appendTimeline(item.historico, {
        action: "COMENTARIO",
        statusFrom: item.status,
        statusTo: item.status,
        userId: user.id,
        userName,
      }),
    },
  });

  await auditNcTransition({
    tenantId,
    entityId: item.id,
    action: NC_ACTION_AUDIT.commented,
    statusFrom: item.status,
    statusTo: item.status,
    user,
  });

  return NextResponse.json({ success: true, item: updated });
}
