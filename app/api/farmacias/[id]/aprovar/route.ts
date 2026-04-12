import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

function generatePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const tenantId = params.id;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Farmácia não encontrada" },
        { status: 404 }
      );
    }

    if (tenant.status !== "PENDENTE") {
      return NextResponse.json(
        { error: "Farmácia não está pendente de aprovação" },
        { status: 400 }
      );
    }

    // Generate password for admin user
    const tempPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update tenant status and create admin user
    const [updatedTenant, adminUser] = await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: { status: "ATIVO" },
      }),
      prisma.user.create({
        data: {
          email: tenant.email,
          name: tenant.responsavel,
          password: hashedPassword,
          role: "ADMIN_FARMACIA",
          tenantId: tenantId,
        },
      }),
    ]);

    // Create audit log
    await createAuditLog({
      action: AUDIT_ACTIONS.TENANT_APPROVED,
      entity: "Tenant",
      entityId: tenantId,
      userId: user.id,
      userName: user.name,
      details: { nome: tenant.nome, cnpj: tenant.cnpj },
    });

    // Send email notification
    try {
      const appUrl = process.env.NEXTAUTH_URL || "";
      const appName = "VISADOCS";

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #0D9488, #1E40AF); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">VISADOCS</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #0D9488;">Sua farmácia foi aprovada!</h2>
            <p>Olá ${tenant.responsavel},</p>
            <p>Temos o prazer de informar que sua farmácia <strong>${tenant.nome}</strong> foi aprovada no sistema VISADOCS.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0D9488;">
              <p style="margin: 5px 0;"><strong>Email de acesso:</strong> ${tenant.email}</p>
              <p style="margin: 5px 0;"><strong>Senha temporária:</strong> ${tempPassword}</p>
            </div>
            <p style="color: #666;">Recomendamos que você altere sua senha após o primeiro acesso.</p>
            <a href="${appUrl}/login" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Acessar Sistema</a>
          </div>
          <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>&copy; 2026 VISADOCS. Todos os direitos reservados.</p>
          </div>
        </div>
      `;

      await fetch("https://apps.abacus.ai/api/sendNotificationEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_FARMCIA_APROVADA,
          subject: `Sua farmácia foi aprovada - ${appName}`,
          body: htmlBody,
          is_html: true,
          recipient_email: tenant.email,
          sender_email: `noreply@${appUrl ? new URL(appUrl).hostname : "visadocs.com"}`,
          sender_alias: appName,
        }),
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Farmácia aprovada com sucesso",
      tenant: updatedTenant,
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        tempPassword: tempPassword, // Return for display in UI (only for super admin)
      },
    });
  } catch (error: any) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { error: "Erro ao aprovar farmácia" },
      { status: 500 }
    );
  }
}
