import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateMpDocx } from "@/lib/docx-mp-generator";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "N\u00e3o autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    const mp = await prisma.materiaPrima.findFirst({
      where: {
        id: params.id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      },
      include: {
        fornecedor: { select: { nome: true } },
        tenant: { select: { nome: true } },
      },
    });

    if (!mp) {
      return NextResponse.json({ error: "Mat\u00e9ria-prima n\u00e3o encontrada" }, { status: 404 });
    }

    const buffer = await generateMpDocx(mp);

    const fileName = `FICHA MP - ${mp.codigo} - ${mp.nome}.docx`
      .replace(/[^a-zA-Z0-9\u00C0-\u024F .\-_()]/g, "_");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar DOCX da MP:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
