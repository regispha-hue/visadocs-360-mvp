import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const isOwn = id === user.id || id === "me";
  if (!isOwn && !["SUPER_ADMIN", "ADMIN", "RT"].includes(user.role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const now = new Date();

  const certificados = await prisma.certificado.findMany({
    where: {
      ...(user.role !== "SUPER_ADMIN" && { tenantId: user.tenantId || "__none__" }),
      ...(isOwn ? { usuarioId: user.id } : { OR: [{ usuarioId: id }, { colaboradorId: id }] }),
      ...(from || to
        ? { dataEmissao: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } }
        : {}),
      ...(status === "vencido" ? { validade: { lt: now } } : {}),
      ...(status === "valido" ? { OR: [{ validade: null }, { validade: { gte: now } }] } : {}),
    },
    orderBy: { dataEmissao: "desc" },
    take: 300,
  });

  return NextResponse.json({ certificados, now: now.toISOString() });
}
