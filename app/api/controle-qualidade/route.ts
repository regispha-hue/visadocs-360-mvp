import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CQ_TRACKS, CQ_TRAIL_MODULES, CONTROLE_QUALIDADE_ROOT, shouldBelongToControleQualidade } from "@/lib/controle-qualidade";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["SUPER_ADMIN", "ADMIN", "RT", "OPERADOR"].includes(user.role)) return forbidden();

    const { searchParams } = new URL(request.url);
    const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
    if (response) return response;

    const [libraryItems, modulePops, quizzes, trainings] = await Promise.all([
      prisma.documentaryLibraryItem.findMany({
        where: {
          tenantId: tenantId!,
          status: "ACTIVE",
          OR: [
            { category: { startsWith: `${CONTROLE_QUALIDADE_ROOT}/` } },
            { title: { contains: "Controle de Qualidade", mode: "insensitive" } },
            { title: { contains: "Qualidade", mode: "insensitive" } },
            { code: { startsWith: "CQ-" } },
          ],
        },
        orderBy: [{ category: "asc" }, { title: "asc" }],
        select: {
          id: true,
          type: true,
          title: true,
          code: true,
          category: true,
          status: true,
          version: true,
          source: true,
          updatedAt: true,
        },
      }),
      prisma.pop.findMany({
        where: {
          tenantId: tenantId!,
          OR: [
            { codigo: { startsWith: "CQ-" } },
            { setor: "Controle de Qualidade" },
            { titulo: { contains: "Controle de Qualidade", mode: "insensitive" } },
          ],
        },
        orderBy: [{ codigo: "asc" }],
        select: {
          id: true,
          codigo: true,
          titulo: true,
          setor: true,
          status: true,
          versao: true,
        },
      }),
      prisma.quiz.findMany({
        where: {
          tenantId: tenantId!,
          OR: [
            { titulo: { contains: "Controle de Qualidade", mode: "insensitive" } },
            { pop: { codigo: { startsWith: "CQ-" } } },
          ],
        },
        include: {
          pop: { select: { id: true, codigo: true, titulo: true } },
          _count: { select: { questoes: true, tentativas: true } },
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.treinamento.findMany({
        where: {
          tenantId: tenantId!,
          OR: [
            { popCodigoSnapshot: { startsWith: "CQ-" } },
            { popTituloSnapshot: { contains: "Controle de Qualidade", mode: "insensitive" } },
            { pop: { codigo: { startsWith: "CQ-" } } },
          ],
        },
        include: {
          colaborador: { select: { id: true, nome: true, funcao: true } },
          pop: { select: { id: true, codigo: true, titulo: true } },
        },
        orderBy: [{ dataTreinamento: "desc" }],
        take: 100,
      }),
    ]);

    const reorganizar = libraryItems.filter((item) => !item.category?.startsWith(`${CONTROLE_QUALIDADE_ROOT}/`) && shouldBelongToControleQualidade(item));

    return NextResponse.json({
      root: CONTROLE_QUALIDADE_ROOT,
      modules: CQ_TRAIL_MODULES,
      tracks: CQ_TRACKS,
      libraryItems,
      modulePops,
      quizzes,
      trainings,
      compliance: {
        acervo: libraryItems.filter((item) => item.category?.startsWith(`${CONTROLE_QUALIDADE_ROOT}/`)).length,
        modulos: modulePops.length,
        quizzes: quizzes.length,
        treinamentos: trainings.length,
        pendenciasReorganizacao: reorganizar.length,
      },
      reorganizar,
    });
  } catch (error) {
    console.error("Error fetching controle qualidade:", error);
    return NextResponse.json({ error: "Erro ao buscar Controle de Qualidade" }, { status: 500 });
  }
}
