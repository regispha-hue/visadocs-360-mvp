import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const farmacias = await prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            pops: true,
            colaboradores: true,
            treinamentos: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json({ farmacias });
  } catch (error: any) {
    console.error("Error fetching farmacias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar farmácias" },
      { status: 500 }
    );
  }
}
