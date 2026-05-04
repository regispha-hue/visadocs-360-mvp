// app/api/compliance/qr/route.ts
// API para gerar QR Code de compliance da farmácia
// O QR Code dá acesso aos fiscais/auditores verificarem conformidade em tempo real

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import { 
  calculateComplianceStats, 
  generateComplianceToken, 
  QR_CODE_CONFIG 
} from "@/lib/compliance";

export const dynamic = "force-dynamic";

// GET - Gerar QR Code de compliance para a farmácia
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    const userRole = (session.user as any).role;

    // Verificar permissão (apenas admin da farmácia ou super admin)
    if (userRole !== "ADMIN_FARMACIA" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem gerar QR Code de compliance" },
        { status: 403 }
      );
    }

    // Buscar dados da farmácia
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        colaboradores: {
          include: {
            user: true,
            treinamentos: {
              include: {
                pop: true,
              },
            },
          },
        },
        pops: {
          where: { status: "ATIVO" },
        },
        _count: {
          select: {
            colaboradores: true,
            pops: true,
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

    // Gerar token único de compliance (válido por 30 dias)
    const complianceToken = generateComplianceToken(tenantId);
    
    // URL pública de verificação
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/compliance/verify/${tenantId}?token=${complianceToken}`;

    // Gerar QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, QR_CODE_CONFIG);

    // Salvar/Atualizar token no banco
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        complianceToken,
        complianceTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        complianceUrl: verificationUrl,
      },
    });

    // Estatísticas de compliance para retornar
    const stats = await calculateComplianceStats(tenantId);

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      url: verificationUrl,
      token: complianceToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      farmacia: {
        nome: tenant.nome,
        cnpj: maskCNPJ(tenant.cnpj),
        responsavel: tenant.responsavel,
        totalColaboradores: tenant._count.colaboradores,
        totalPOPs: tenant._count.pops,
      },
      compliance: stats,
      instructions: [
        "Imprima este QR Code e coloque no balcão da farmácia",
        "Fiscais/auditores podem escanear para verificar conformidade em tempo real",
        "O QR Code é válido por 30 dias",
        "Dados atualizados automaticamente a cada acesso",
      ],
    });

  } catch (error: any) {
    console.error("Erro ao gerar QR Code:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// POST - Atualizar/Regenerar QR Code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;

    // Invalidar token antigo e gerar novo
    const newToken = generateComplianceToken(tenantId);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const newUrl = `${baseUrl}/compliance/verify/${tenantId}?token=${newToken}`;

    const qrCodeDataUrl = await QRCode.toDataURL(newUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0d9488",
        light: "#ffffff",
      },
    });

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        complianceToken: newToken,
        complianceTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        complianceUrl: newUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: "QR Code regenerado com sucesso",
      qrCode: qrCodeDataUrl,
      url: newUrl,
      token: newToken,
    });

  } catch (error: any) {
    console.error("Erro ao regenerar QR Code:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// Importar função da lib/compliance.ts
import { maskCNPJ } from "@/lib/compliance";
