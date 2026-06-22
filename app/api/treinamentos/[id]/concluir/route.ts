import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/auth-guards";
import { ensureCertificadoForTreinamento } from "@/lib/certificados";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) return forbidden();

  const treinamento = await prisma.treinamento.findFirst({
    where: {
      id,
      ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }),
    },
    include: {
      pop: { include: { quizzes: { where: { ativo: true }, take: 1 } } },
      tentativas: { where: { aprovado: true }, orderBy: { completadoEm: "desc" }, take: 1 },
    },
  });

  if (!treinamento) return NextResponse.json({ error: "Treinamento não encontrado" }, { status: 404 });
  const requiresQuiz = treinamento.pop.quizzes.length > 0;
  const approvedAttempt = treinamento.tentativas[0];
  if (requiresQuiz && !approvedAttempt) {
    return NextResponse.json({ error: "Certificado só pode ser gerado após aprovação no quiz" }, { status: 400 });
  }

  const updated = await prisma.treinamento.update({
    where: { id },
    data: {
      status: "CONCLUIDO",
      aprovadoQuiz: requiresQuiz ? true : treinamento.aprovadoQuiz,
      notaQuiz: approvedAttempt?.nota ?? treinamento.notaQuiz,
    },
  });

  const certificado = await ensureCertificadoForTreinamento({
    treinamentoId: treinamento.id,
    tenantId: treinamento.tenantId,
    usuarioId: user.id,
    usuarioNome: user.name || user.email || null,
    tentativaId: approvedAttempt?.id || null,
  });

  return NextResponse.json({ success: true, treinamento: updated, certificado });
}
