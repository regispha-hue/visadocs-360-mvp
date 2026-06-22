import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
// @ts-ignore
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId || "default";
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const qrCode = searchParams.get("qr");
    const codigoAcesso = searchParams.get("codigo");

    switch (action) {
      case "gerar-qrcode":
        return await handleGerarQRCode(tenantId);
      case "acesso-auditoria":
        return await handleAcessoAuditoria(qrCode || codigoAcesso, tenantId);
      case "master-list":
        return await handleMasterList(tenantId);
      case "certificados":
        return await handleCertificados(tenantId);
      case "validades":
        return await handleValidades(tenantId);
      case "status":
        return await handleStatusAuditoria(tenantId);
      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in auditoria fiscalizacao API:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId || "default";
    
    const data = await request.json();
    const { action } = data;

    switch (action) {
      case "criar-auditoria":
        return await handleCriarAuditoria(data, tenantId, user);
      case "registrar-acesso":
        return await handleRegistrarAcesso(data, tenantId);
      case "atualizar-dados":
        return await handleAtualizarDados(data, tenantId);
      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in auditoria fiscalizacao POST:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

async function handleGerarQRCode(tenantId: string) {
  const auditoriaAtiva = await prisma.auditoriaFiscalizacao.findFirst({
    where: {
      tenantId,
      status: "ATIVO",
      dataExpiracao: {
        gt: new Date()
      }
    }
  });

  if (auditoriaAtiva) {
    return NextResponse.json({
      success: true,
      auditoria: auditoriaAtiva,
      qrCode: auditoriaAtiva.qrCode,
      codigoAcesso: auditoriaAtiva.codigoAcesso
    });
  }

  const qrCodeData = `VISADOCS-AUDITORIA-${tenantId}-${crypto.randomUUID()}`;
  const qrCodeBuffer = await QRCode.toBuffer(qrCodeData);
  const qrCodeBase64 = qrCodeBuffer.toString("base64");
  const codigoAcesso = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      nome: true,
      cnpj: true,
      responsavel: true
    }
  });

  const auditoria = await prisma.auditoriaFiscalizacao.create({
    data: {
      tenantId,
      qrCode: qrCodeData,
      codigoAcesso,
      status: "ATIVO",
      dataGeracao: new Date(),
      dataExpiracao: new Date(Date.now() + 2 * 60 * 60 * 1000),
      responsaveis: [
        tenant?.responsavel || "Responsável Técnico",
        "Farmacêutico Responsável"
      ],
      masterListPOPs: await gerarMasterListPOPs(tenantId),
      certificados: await gerarListaCertificados(tenantId),
      cronogramaValidades: await gerarCronogramaValidades(tenantId)
    }
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.POP_CREATED,
    entity: "AuditoriaFiscalizacao",
    entityId: auditoria.id,
    userId: "system",
    userName: "Sistema",
    tenantId,
    details: { qrCode: qrCodeData, codigoAcesso, validadeHoras: 2 }
  });

  return NextResponse.json({
    success: true,
    auditoria,
    qrCode: qrCodeData,
    qrCodeImage: `data:image/png;base64,${qrCodeBase64}`,
    codigoAcesso
  });
}

async function handleAcessoAuditoria(qrCodeOrCodigo: string | null, tenantId: string) {
  if (!qrCodeOrCodigo) {
    return NextResponse.json({ error: "QR Code ou código de acesso obrigatório" }, { status: 400 });
  }

  const auditoria = await prisma.auditoriaFiscalizacao.findFirst({
    where: {
      tenantId,
      OR: [
        { qrCode: qrCodeOrCodigo },
        { codigoAcesso: qrCodeOrCodigo }
      ],
      status: "ATIVO",
      dataExpiracao: {
        gt: new Date()
      }
    },
    include: {
      tenant: {
        select: { nome: true, cnpj: true, responsavel: true }
      }
    }
  });

  if (!auditoria) {
    return NextResponse.json({ error: "Auditoria não encontrada ou expirada" }, { status: 404 });
  }

  const acessos = parseJsonArray(auditoria.acessos);
  acessos.push({
    data: new Date().toISOString(),
    tipo: qrCodeOrCodigo.length > 10 ? "QR_CODE" : "CODIGO_ACESSO",
    ip: "FISCAL"
  });

  await prisma.auditoriaFiscalizacao.update({
    where: { id: auditoria.id },
    data: {
      acessos: JSON.stringify(acessos)
    }
  });

  return NextResponse.json({
    success: true,
    auditoria: {
      id: auditoria.id,
      tenant: auditoria.tenant,
      masterListPOPs: auditoria.masterListPOPs,
      certificados: auditoria.certificados,
      cronogramaValidades: auditoria.cronogramaValidades,
      dataGeracao: auditoria.dataGeracao,
      dataExpiracao: auditoria.dataExpiracao,
      acessos: acessos
    }
  });
}

async function handleMasterList(tenantId: string) {
  try {
    const masterList = await gerarMasterListPOPs(tenantId);
    return NextResponse.json({ masterList });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao gerar Master List" }, { status: 500 });
  }
}

async function handleCertificados(tenantId: string) {
  try {
    const certificados = await gerarListaCertificados(tenantId);
    return NextResponse.json({ certificados });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar registros internos de treinamento" }, { status: 500 });
  }
}

async function handleValidades(tenantId: string) {
  try {
    const validades = await gerarCronogramaValidades(tenantId);
    return NextResponse.json({ validades });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar validades" }, { status: 500 });
  }
}

async function handleStatusAuditoria(tenantId: string) {
  try {
    const auditoria = await prisma.auditoriaFiscalizacao.findFirst({
      where: {
        tenantId,
        status: "ATIVO",
        dataExpiracao: {
          gt: new Date()
        }
      }
    });

    return NextResponse.json({
      ativa: !!auditoria,
      auditoria: auditoria ? {
        id: auditoria.id,
        qrCode: auditoria.qrCode,
        codigoAcesso: auditoria.codigoAcesso,
        dataExpiracao: auditoria.dataExpiracao,
        acessos: parseJsonArray(auditoria.acessos)
      } : null
    });
  } catch (error) {
    return NextResponse.json({ ativa: false, auditoria: null });
  }
}

async function handleCriarAuditoria(data: any, tenantId: string, user: any) {
  const validadeHoras = Math.min(Math.max(Number(data.validadeHoras || 2), 1), 24);
  const { responsaveis } = data;

  try {
    // Verificar se já existe auditoria ativa
    const existente = await prisma.auditoriaFiscalizacao.findFirst({
      where: {
        tenantId,
        status: "ATIVO",
        dataExpiracao: {
          gt: new Date()
        }
      }
    });

    if (existente) {
      return NextResponse.json({ 
        error: "Já existe auditoria ativa", 
        auditoria: existente 
      }, { status: 400 });
    }

    // Gerar nova auditoria
    const qrCodeData = `VISADOCS-AUDITORIA-${tenantId}-${crypto.randomUUID()}`;
    const codigoAcesso = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

    const auditoria = await prisma.auditoriaFiscalizacao.create({
      data: {
        tenantId,
        qrCode: qrCodeData,
        codigoAcesso,
        status: "ATIVO",
        dataGeracao: new Date(),
        dataExpiracao: new Date(Date.now() + validadeHoras * 60 * 60 * 1000),
        responsaveis: responsaveis || ["Responsável Técnico"],
        masterListPOPs: await gerarMasterListPOPs(tenantId),
        certificados: await gerarListaCertificados(tenantId),
        cronogramaValidades: await gerarCronogramaValidades(tenantId)
      }
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_CREATED,
      entity: "AuditoriaFiscalizacao",
      entityId: auditoria.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { validadeHoras, responsaveis }
    });

    return NextResponse.json({ success: true, auditoria });

  } catch (error: any) {
    console.error("Error creating auditoria:", error);
    return NextResponse.json({ error: "Erro ao criar auditoria" }, { status: 500 });
  }
}

async function handleRegistrarAcesso(data: any, tenantId: string) {
  const { auditoriaId, tipo, ip } = data;

  try {
    const auditoria = await prisma.auditoriaFiscalizacao.findFirst({
      where: {
        id: auditoriaId,
        tenantId,
        status: "ATIVO"
      }
    });

    if (!auditoria) {
      return NextResponse.json({ error: "Auditoria não encontrada" }, { status: 404 });
    }

    const acessos = parseJsonArray(auditoria.acessos);
    acessos.push({
      data: new Date().toISOString(),
      tipo: tipo || "MANUAL",
      ip: ip || "SISTEMA"
    });

    await prisma.auditoriaFiscalizacao.update({
      where: { id: auditoriaId },
      data: {
        acessos: JSON.stringify(acessos)
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Erro ao registrar acesso" }, { status: 500 });
  }
}

async function handleAtualizarDados(data: any, tenantId: string) {
  const { auditoriaId } = data;

  try {
    const auditoria = await prisma.auditoriaFiscalizacao.findFirst({
      where: {
        id: auditoriaId,
        tenantId,
        status: "ATIVO"
      }
    });

    if (!auditoria) {
      return NextResponse.json({ error: "Auditoria não encontrada" }, { status: 404 });
    }

    // Atualizar dados em tempo real
    const updatedAuditoria = await prisma.auditoriaFiscalizacao.update({
      where: { id: auditoriaId },
      data: {
        masterListPOPs: await gerarMasterListPOPs(tenantId),
        certificados: await gerarListaCertificados(tenantId),
        cronogramaValidades: await gerarCronogramaValidades(tenantId),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, auditoria: updatedAuditoria });

  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar dados" }, { status: 500 });
  }
}

// Funções auxiliares
async function gerarMasterListPOPs(tenantId: string): Promise<any> {
  const pops = await prisma.pop.findMany({
    where: {
      tenantId,
      status: "ATIVO"
    },
    select: {
      codigo: true,
      titulo: true,
      versao: true,
      status: true,
      validadeAnos: true,
      validadoEm: true,
      validadoPor: true,
      setor: true,
      implantadoEm: true,
      implantadoPor: true
    },
    orderBy: { codigo: "asc" }
  });

  return pops.map((pop: any) => ({
    codigo: pop.codigo,
    titulo: pop.titulo,
    versao: pop.versao,
    status: pop.status,
    dataValidade: pop.validadoEm ?
      new Date(pop.validadoEm.getTime() + (pop.validadeAnos || 2) * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] :
      null,
    responsavel: pop.validadoPor || "Não definido",
    setor: pop.setor,
    implantadoEm: pop.implantadoEm?.toISOString().split("T")[0],
    implantadoPor: pop.implantadoPor
  }));
}

async function gerarListaCertificados(tenantId: string): Promise<any> {
  const treinamentos = await prisma.treinamento.findMany({
    where: {
      tenantId,
      status: "CONCLUIDO"
    },
    include: {
      colaborador: {
        select: {
          nome: true,
          funcao: true
        }
      },
      pop: {
        select: {
          codigo: true,
          titulo: true
        }
      }
    },
    orderBy: { dataTreinamento: "desc" }
  });

  return treinamentos.map((treinamento: any) => ({
    colaborador: treinamento.colaborador.nome,
    funcao: treinamento.colaborador.funcao,
    pop: treinamento.pop.codigo,
    popTitulo: treinamento.pop.titulo,
    dataTreinamento: treinamento.dataTreinamento.toISOString().split("T")[0],
    status: treinamento.aprovadoQuiz ? "VALIDO" : "PENDENTE",
    validade: new Date(treinamento.dataTreinamento.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    instrutor: treinamento.instrutor,
    notaQuiz: treinamento.notaQuiz
  }));
}

async function gerarCronogramaValidades(tenantId: string): Promise<any> {
  const pops = await prisma.pop.findMany({
    where: { tenantId },
    select: {
      codigo: true,
      titulo: true,
      validadoEm: true,
      validadeAnos: true,
      status: true
    }
  });

  const treinamentos = await prisma.treinamento.findMany({
    where: { tenantId },
    include: {
      colaborador: {
        select: { nome: true }
      },
      pop: {
        select: { codigo: true }
      }
    }
  });

  const validades: any[] = [];

  pops.forEach((pop: any) => {
    if (pop.validadoEm) {
      const dataValidade = new Date(pop.validadoEm.getTime() + (pop.validadeAnos || 2) * 365 * 24 * 60 * 60 * 1000);
      const diasParaVencer = Math.floor((dataValidade.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

      validades.push({
        documento: pop.codigo,
        tipo: "POP",
        titulo: pop.titulo,
        dataValidade: dataValidade.toISOString().split("T")[0],
        diasParaVencer,
        status: diasParaVencer <= 0 ? "VENCIDO" : diasParaVencer <= 30 ? "VENCENDO" : "VALIDO"
      });
    }
  });

  treinamentos.forEach((treinamento: any) => {
    const dataValidade = new Date(treinamento.dataTreinamento.getTime() + 365 * 24 * 60 * 60 * 1000);
    const diasParaVencer = Math.floor((dataValidade.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

    validades.push({
      documento: `CERT-${treinamento.colaborador.nome}-${treinamento.pop.codigo}`,
      tipo: "REGISTRO_INTERNO",
      titulo: `Registro interno ${treinamento.pop.codigo}`,
      colaborador: treinamento.colaborador.nome,
      dataValidade: dataValidade.toISOString().split("T")[0],
      diasParaVencer,
      status: diasParaVencer <= 0 ? "VENCIDO" : diasParaVencer <= 30 ? "VENCENDO" : "VALIDO"
    });
  });

  return validades.sort((a: any, b: any) => a.diasParaVencer - b.diasParaVencer);
}

function parseJsonArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
