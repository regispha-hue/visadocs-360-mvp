import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    if (!user.tenantId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const setor = searchParams.get("setor");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const tenantIdParam = searchParams.get("tenantId"); // For super admin

    const tenantId = user.role === "SUPER_ADMIN" ? tenantIdParam : user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não especificado" }, { status: 400 });
    }

    const where: any = { tenantId };
    if (setor) where.setor = setor;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: "insensitive" } },
        { titulo: { contains: search, mode: "insensitive" } },
        { objetivo: { contains: search, mode: "insensitive" } },
      ];
    }

    const pops = await prisma.pop.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pops });
  } catch (error: any) {
    console.error("Error fetching POPs:", error);
    return NextResponse.json({ error: "Erro ao buscar POPs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    // Check permissions
    if (!["SUPER_ADMIN", "ADMIN_FARMACIA", "RT"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!user.tenantId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
    }

    const data = await request.json();
    const { codigo, titulo, setor, versao, dataRevisao, responsavel, objetivo, descricao, arquivoUrl, arquivoNome, arquivoPublic, status: popStatus, equipeEnvolvida, glossario, literaturaConsultada, validadoPor, implantadoPor, implantadoEm, validadeAnos } = data;

    // Validate required fields
    if (!codigo || !titulo || !setor || !versao || !dataRevisao || !responsavel || !objetivo || !descricao) {
      return NextResponse.json({ error: "Todos os campos obrigatórios devem ser preenchidos" }, { status: 400 });
    }

    const tenantId = data.tenantId || user.tenantId;

    // Check if code already exists for this tenant
    const existingPop = await prisma.pop.findFirst({
      where: { tenantId, codigo },
    });

    if (existingPop) {
      return NextResponse.json({ error: "Já existe um POP com este código" }, { status: 400 });
    }

    const pop = await prisma.pop.create({
      data: {
        codigo,
        titulo,
        setor,
        versao,
        dataRevisao: new Date(dataRevisao),
        responsavel,
        objetivo,
        descricao,
        equipeEnvolvida: equipeEnvolvida || null,
        glossario: glossario || null,
        literaturaConsultada: literaturaConsultada || null,
        validadoPor: validadoPor || null,
        implantadoPor: implantadoPor || null,
        implantadoEm: implantadoEm ? new Date(implantadoEm) : null,
        validadeAnos: validadeAnos || 2,
        arquivoUrl: arquivoUrl || null,
        arquivoNome: arquivoNome || null,
        arquivoPublic: arquivoPublic || false,
        status: popStatus || "RASCUNHO",
        tenantId,
      },
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.POP_CREATED,
      entity: "Pop",
      entityId: pop.id,
      userId: user.id,
      userName: user.name,
      tenantId,
      details: { codigo, titulo, setor },
    });

    return NextResponse.json({ success: true, pop });
  } catch (error: any) {
    console.error("Error creating POP:", error);
    return NextResponse.json({ error: "Erro ao criar POP" }, { status: 500 });
  }
}
