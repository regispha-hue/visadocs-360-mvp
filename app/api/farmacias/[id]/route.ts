import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

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
    const tenantId = params.id;

    // Only super admin can view any tenant, others can only view their own
    if (user.role !== "SUPER_ADMIN" && user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            pops: true,
            colaboradores: true,
            treinamentos: true,
            users: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Farmácia não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant });
  } catch (error: any) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json(
      { error: "Erro ao buscar farmácia" },
      { status: 500 }
    );
  }
}
