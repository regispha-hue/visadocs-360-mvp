import { prisma } from "@/lib/db";

export function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

export async function ensureCertificadoForTreinamento(params: {
  treinamentoId: string;
  tenantId: string;
  usuarioId: string;
  usuarioNome?: string | null;
  tentativaId?: string | null;
}) {
  const treinamento = await prisma.treinamento.findFirst({
    where: { id: params.treinamentoId, tenantId: params.tenantId },
    include: {
      colaborador: true,
      pop: true,
      tentativas: { where: { aprovado: true }, orderBy: { completadoEm: "desc" }, take: 1 },
    },
  });

  if (!treinamento) throw new Error("Treinamento não encontrado");

  const tentativaId = params.tentativaId || treinamento.tentativas[0]?.id || null;
  const codigoValidacao = treinamento.tentativas[0]?.codigoValidacao || tentativaId || treinamento.id;
  const validade = addYears(treinamento.dataTreinamento || new Date(), treinamento.pop.validadeAnos || 2);
  const arquivoUrl = tentativaId
    ? `/api/certificados/${tentativaId}`
    : `/api/certificados/${treinamento.id}/download`;

  return prisma.certificado.upsert({
    where: { tenantId_treinamentoId: { tenantId: params.tenantId, treinamentoId: treinamento.id } },
    create: {
      tenantId: params.tenantId,
      treinamentoId: treinamento.id,
      tentativaId,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome || null,
      colaboradorId: treinamento.colaboradorId,
      colaboradorNome: treinamento.colaborador.nome,
      arquivoUrl,
      codigoValidacao: String(codigoValidacao).slice(0, 40),
      validade,
    },
    update: {
      tentativaId,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome || null,
      colaboradorId: treinamento.colaboradorId,
      colaboradorNome: treinamento.colaborador.nome,
      arquivoUrl,
      codigoValidacao: String(codigoValidacao).slice(0, 40),
      validade,
    },
  });
}
