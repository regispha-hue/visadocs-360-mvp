import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      );
    }

    // Check tenant status for non-super-admin users
    if (user.role !== "SUPER_ADMIN" && user.tenant) {
      if (user.tenant.status === "PENDENTE") {
        return NextResponse.json(
          { error: "Aguardando aprovação do cadastro" },
          { status: 403 }
        );
      }
      if (user.tenant.status === "SUSPENSO") {
        return NextResponse.json(
          { error: "Acesso suspenso. Entre em contato com o suporte." },
          { status: 403 }
        );
      }
      if (user.tenant.status === "CANCELADO") {
        return NextResponse.json(
          { error: "Conta cancelada" },
          { status: 403 }
        );
      }
      if (user.tenant.subscriptionStatus === "SUSPENSO") {
        return NextResponse.json(
          { error: "Pagamento pendente. Entre em contato com o suporte." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.nome || null,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erro ao realizar login" },
      { status: 500 }
    );
  }
}
