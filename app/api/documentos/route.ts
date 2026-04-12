import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    if (!user.tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");

    const where: any = { tenantId: user.tenantId };
    if (tipo) {
      where.tipo = tipo;
    }

    const documentos = await prisma.documento.findMany({
      where,
      include: {
        pop: {
          select: { id: true, codigo: true, titulo: true },
        },
      },
      orderBy: { codigo: "asc" },
    });

    return NextResponse.json({ documentos });
  } catch (error: any) {
    console.error("GET /api/documentos error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
