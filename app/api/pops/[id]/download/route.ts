import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getFileUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const pop = await prisma.pop.findUnique({
      where: { id: params.id },
    });

    if (!pop) {
      return NextResponse.json({ error: "POP não encontrado" }, { status: 404 });
    }

    // Check tenant access
    if (user.role !== "SUPER_ADMIN" && pop.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (!pop.arquivoUrl) {
      return NextResponse.json({ error: "Arquivo não disponível" }, { status: 404 });
    }

    const url = await getFileUrl(pop.arquivoUrl, pop.arquivoPublic ?? false);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Error getting download URL:", error);
    return NextResponse.json({ error: "Erro ao gerar URL de download" }, { status: 500 });
  }
}
