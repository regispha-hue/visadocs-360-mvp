import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().trim().email("Email inválido"),
  role: z.enum(["ADMIN", "RT", "OPERADOR"]),
  tenantId: z.string().trim().min(1).optional(),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").optional(),
});

function generateTemporaryPassword() {
  return `Visadocs-${randomBytes(12).toString("base64url")}!`;
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return unauthorized();

    if (!["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
      return forbidden();
    }

    const body = await request.json().catch(() => null);
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
    }

    if (currentUser.role === "ADMIN" && parsed.data.role === "ADMIN") {
      return forbidden("ADMIN pode criar apenas RT ou OPERADOR");
    }

    const tenantId = currentUser.role === "SUPER_ADMIN" ? parsed.data.tenantId : currentUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant é obrigatório" }, { status: 400 });
    }

    if (currentUser.role === "ADMIN" && parsed.data.tenantId && parsed.data.tenantId !== currentUser.tenantId) {
      return forbidden("ADMIN não pode criar usuário em outro tenant");
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, nome: true, status: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
    }

    if (tenant.status !== "ATIVO") {
      return NextResponse.json({ error: "Tenant precisa estar ATIVO para criar usuários" }, { status: 409 });
    }

    const email = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Já existe usuário com este email" }, { status: 409 });
    }

    const generatedPassword = parsed.data.password ? null : generateTemporaryPassword();
    const plainPassword = parsed.data.password || generatedPassword!;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        password: hashedPassword,
        role: parsed.data.role,
        tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.USER_CREATED,
      entity: "User",
      entityId: user.id,
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email || undefined,
      tenantId,
      details: {
        createdUserEmail: user.email,
        createdUserRole: user.role,
        tenantName: tenant.nome,
        passwordGenerated: Boolean(generatedPassword),
      },
    });

    return NextResponse.json(
      {
        success: true,
        user,
        ...(generatedPassword ? { tempPassword: generatedPassword } : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tenant user:", error);
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}
