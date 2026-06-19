import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isNcManager } from "@/lib/nao-conformidades";
import { forbidden, getCurrentUser, requireTenantId, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!isNcManager(user)) return forbidden();

    const { searchParams } = new URL(request.url);
    const { tenantId, response } = requireTenantId(user, searchParams.get("tenantId"));
    if (response) return response;

    const { id } = await params;
    const item = await prisma.naoConformidade.findFirst({
      where: { id, tenantId: tenantId! },
      include: {
        pop: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            setor: true,
            versao: true,
            status: true,
          },
        },
        risco: {
          select: {
            id: true,
            descricao: true,
            severidade: true,
          },
        },
      },
    });

    if (!item) return NextResponse.json({ error: "Não conformidade não encontrada" }, { status: 404 });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error fetching nonconformity:", error);
    return NextResponse.json({ error: "Erro ao buscar não conformidade" }, { status: 500 });
  }
}
