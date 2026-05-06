// app/api/compliance/verify/[tenantId]/route.ts
// API pÃºblica para verificaÃ§Ã£o de compliance via QR Code
// Acessada por fiscais/auditores ao escanear o QR no balcÃ£o da farmÃ¡cia

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateComplianceStats,
  maskCNPJ,
  formatEndereco,
  isValidComplianceTokenFormat,
  hashIP,
  extractBrowserInfo,
} from "@/lib/compliance";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Validar token
    if (!token || !isValidComplianceTokenFormat(token)) {
      return NextResponse.json(
        { error: "Token de acesso invÃ¡lido ou ausente" },
        { status: 400 }
      );
    }

    // Buscar tenant com validaÃ§Ã£o de token
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
    // @ts-ignore
        complianceToken: token,
        complianceTokenExpiresAt: {
          gt: new Date(), // Token nÃ£o expirado
        },
        status: "ATIVO", // FarmÃ¡cia ativa
      },
      include: {
        colaboradores: {
          include: {
            user: true,
            cargo: true,
            treinamentos: {
              include: {
                pop: true,
    // @ts-ignore
                certificado: true,
              },
              orderBy: {
    // @ts-ignore
                dataConclusao: "desc",
              },
            },
          },
        },
        pops: {
          where: { status: "ATIVO" },
          orderBy: { codigo: "asc" },
        },
        _count: {
          select: {
            colaboradores: true,
            pops: true,
            treinamentos: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Acesso invÃ¡lido ou expirado. QR Code pode ter sido regenerado ou a farmÃ¡cia estÃ¡ inativa." },
        { status: 403 }
      );
    }

    // Registrar acesso de fiscalizaÃ§Ã£o (com anonimizaÃ§Ã£o LGPD)
    const clientIP = request.headers.get("x-forwarded-for") || request.ip;
    const userAgent = request.headers.get("user-agent");
    const browserInfo = extractBrowserInfo(userAgent);
    const hashedIP = hashIP(clientIP);

    await prisma.securityLog.create({
      data: {
        action: "COMPLIANCE_VERIFICATION",
        severity: "LOW",
        tenantId,
        details: {
          action: "QR_CODE_SCAN",
          ipHash: hashedIP, // IP anonimizado para LGPD
          browser: browserInfo.browser,
          os: browserInfo.os,
          timestamp: new Date().toISOString(),
        },
        ip: hashedIP || "unknown", // IP anonimizado
        userAgent: browserInfo.browser || "unknown", // Browser apenas, nÃ£o full UA
      },
    });

    // Calcular estatÃ­sticas de compliance
    const stats = await calculateComplianceStats(tenantId);

    // Formatar dados dos colaboradores
    // @ts-ignore
    const colaboradoresFormatados = tenant.colaboradores.map((colab) => {
      const treinamentosConcluidos = colab.treinamentos.filter(
        (t) => t.status === "CONCLUIDO"
      ).length;
      
      const treinamentosPendentes = colab.treinamentos.filter(
        (t) => t.status === "PENDENTE"
      ).length;

      const certificadosAtivos = colab.treinamentos.filter(
        (t) =>
          t.status === "CONCLUIDO" &&
          t.certificado &&
          t.certificado.dataValidade > new Date()
      ).length;

      const ultimoTreinamento = colab.treinamentos[0]?.dataConclusao;

      return {
        id: colab.id,
        nome: colab.user?.name || "N/A",
        cargo: colab.cargo?.nome || "N/A",
        status: colab.status,
        treinamentosConcluidos,
        treinamentosPendentes,
        certificadosAtivos,
        ultimoTreinamento: ultimoTreinamento?.toISOString(),
      };
    });

    // Formatar dados dos POPs
    // @ts-ignore
    const popsFormatados = tenant.pops.map((pop) => ({
      id: pop.id,
      codigo: pop.codigo,
      titulo: pop.titulo,
      categoria: pop.categoria,
      status: pop.status,
      version: pop.version,
      updatedAt: pop.updatedAt.toISOString(),
    }));

    // Buscar Ãºltima fiscalizaÃ§Ã£o registrada
    const ultimaFiscalizacao = await prisma.auditoriaFiscalizacao.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    // Montar resposta
    const response = {
      success: true,
      data: {
        farmacia: {
          nome: tenant.nome,
          cnpj: maskCNPJ(tenant.cnpj),
          responsavel: tenant.responsavel,
          endereco: formatEndereco(tenant.endereco),
          telefone: tenant.telefone,
    // @ts-ignore
          logoUrl: tenant.logoUrl,
        },
        compliance: stats,
        colaboradores: colaboradoresFormatados,
        pops: popsFormatados,
        ultimaFiscalizacao: ultimaFiscalizacao
          ? {
              data: ultimaFiscalizacao.createdAt.toISOString(),
    // @ts-ignore
              resultado: ultimaFiscalizacao.resultado,
    // @ts-ignore
              observacoes: ultimaFiscalizacao.observacoes,
            }
          : undefined,
      },
      meta: {
        accessedAt: new Date().toISOString(),
        tokenValid: true,
    // @ts-ignore
        expiresAt: tenant.complianceTokenExpiresAt?.toISOString(),
      },
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Erro na verificaÃ§Ã£o de compliance:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor" },
      { status: 500 }
    );
  }
}


