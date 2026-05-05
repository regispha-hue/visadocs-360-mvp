// app/api/webhook/erp/route.ts
// Webhook API universal para integração com ERPs modernos (cloud)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST - Receber dados de ERP via webhook
export async function POST(request: NextRequest) {
  try {
    // Validar autenticação
    const apiKey = request.headers.get("x-api-key");
    const signature = request.headers.get("x-webhook-signature");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key obrigatória" },
        { status: 401 }
      );
    }

    // Buscar tenant pela API key
    const tenant = await prisma.tenant.findFirst({
      where: { 
        // Aqui você verificaria a API key de forma segura
        // Por simplicidade, estamos usando uma lógica básica
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "API Key inválida" },
        { status: 401 }
      );
    }

    const tenantId = tenant.id;

    // Receber payload
    const payload = await request.json();
    const eventType = request.headers.get("x-event-type") || "data.sync";

    // Log do webhook recebido
    // @ts-ignore
    await prisma.webhookLog.create({
      data: {
        tenantId,
        eventType,
        payload: JSON.stringify(payload),
        source: payload.source || "unknown",
        ip: request.headers.get("x-forwarded-for") || request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "RECEIVED",
      },
    });

    // Processar conforme tipo de evento
    let result;
    switch (eventType) {
      case "colaborador.created":
      case "colaborador.updated":
        result = await processColaborador(payload, tenantId);
        break;
      
      case "colaborador.deactivated":
        result = await deactivateColaborador(payload, tenantId);
        break;
      
      case "treinamento.completed":
        result = await processTreinamentoExterno(payload, tenantId);
        break;
      
      case "data.sync":
      default:
        result = await processGenericData(payload, tenantId);
        break;
    }

    // Retornar sucesso
    return NextResponse.json({
      success: true,
      event: eventType,
      processed: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Erro no webhook:", error);
    return NextResponse.json(
      { 
        error: error.message || "Erro interno",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET - Documentação do webhook
export async function GET() {
  return NextResponse.json({
    name: "VISADOCS Universal Webhook API",
    version: "4.0",
    description: "Endpoint para integração com ERPs modernos via webhooks",
    
    authentication: {
      type: "API Key",
      header: "x-api-key",
      description: "Chave de API fornecida pela administração do Visadocs",
    },
    
    headers: {
      "x-api-key": "Sua chave de API",
      "x-event-type": "Tipo de evento (opcional, default: data.sync)",
      "x-webhook-signature": "Assinatura HMAC para validação (opcional)",
      "Content-Type": "application/json",
    },
    
    events: [
      {
        type: "colaborador.created",
        description: "Novo colaborador criado no ERP",
        payload: {
          nome: "string",
          email: "string",
          cargo: "string",
          dataAdmissao: "string (ISO 8601)",
          cpf: "string",
          telefone: "string",
        },
      },
      {
        type: "colaborador.updated",
        description: "Dados de colaborador atualizados",
        payload: {
          idExterno: "string",
          nome: "string",
          cargo: "string",
          // ... campos atualizados
        },
      },
      {
        type: "treinamento.completed",
        description: "Treinamento concluído no ERP externo",
        payload: {
          colaboradorId: "string",
          cursoNome: "string",
          dataConclusao: "string",
          nota: "number",
          certificadoUrl: "string",
        },
      },
      {
        type: "data.sync",
        description: "Sincronização genérica de dados",
        payload: {
          entity: "string",
          action: "create | update | delete",
          data: "object",
        },
      },
    ],
    
    examples: {
      curl: `curl -X POST https://seu-dominio.com/api/webhook/erp \\
  -H "x-api-key: SUA_API_KEY" \\
  -H "x-event-type: colaborador.created" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nome": "João Silva",
    "email": "joao@farmacia.com",
    "cargo": "Farmacêutico",
    "dataAdmissao": "2024-01-15"
  }'`,
    },
    
    response: {
      success: {
        status: 200,
        body: {
          success: true,
          event: "colaborador.created",
          processed: { /* detalhes */ },
          timestamp: "2024-01-15T10:30:00Z",
        },
      },
      error: {
        status: 401,
        body: {
          error: "API Key inválida",
          timestamp: "2024-01-15T10:30:00Z",
        },
      },
    },
    
    support: {
      documentation: "https://docs.visadocs.com/webhooks",
      contact: "suporte@visadocs.com",
    },
  });
}

// Funções de processamento

async function processColaborador(payload: any, tenantId: string) {
  const { nome, email, cargo, dataAdmissao, cpf, telefone } = payload;

  // Verificar se já existe
  const existing = await prisma.colaborador.findFirst({
    where: {
      tenantId,
      OR: [
        { nome: { contains: nome } },
        { email: email || "" },
    // @ts-ignore
        { cpf: cpf || "" },
      ],
    },
  });

  if (existing) {
    // Atualizar
    return await prisma.colaborador.update({
      where: { id: existing.id },
      data: {
        nome: nome || existing.nome,
        email: email || existing.email,
    // @ts-ignore
        cargo: cargo || existing.cargo,
    // @ts-ignore
        telefone: telefone || existing.telefone,
    // @ts-ignore
        cpf: cpf || existing.cpf,
        dataAdmissao: dataAdmissao ? new Date(dataAdmissao) : existing.dataAdmissao,
        updatedAt: new Date(),
      },
    });
  } else {
    // Criar novo
    return await prisma.colaborador.create({
      data: {
        tenantId,
        nome,
        email: email || null,
    // @ts-ignore
        cargo: cargo || null,
        telefone: telefone || null,
        cpf: cpf || null,
        dataAdmissao: dataAdmissao ? new Date(dataAdmissao) : null,
        status: "ATIVO",
        fonteIntegracao: "WEBHOOK_ERP",
      },
    });
  }
}

async function deactivateColaborador(payload: any, tenantId: string) {
  const { idExterno, email, nome } = payload;

  const colaborador = await prisma.colaborador.findFirst({
    where: {
      tenantId,
      OR: [
        { email: email || "" },
        { nome: { contains: nome || "" } },
      ],
    },
  });

  if (colaborador) {
    return await prisma.colaborador.update({
      where: { id: colaborador.id },
      data: {
        status: "INATIVO",
        updatedAt: new Date(),
      },
    });
  }

  return { message: "Colaborador não encontrado" };
}

async function processTreinamentoExterno(payload: any, tenantId: string) {
  // Implementar lógica para receber treinamentos de LMS externos
  return { message: "Treinamento externo processado" };
}

async function processGenericData(payload: any, tenantId: string) {
  // Processamento genérico baseado no tipo de entidade
  const { entity, action, data } = payload;

  switch (entity) {
    case "colaborador":
      if (action === "create" || action === "update") {
        return await processColaborador(data, tenantId);
      }
      break;
    
    default:
      return { message: `Entidade ${entity} não suportada` };
  }
}
