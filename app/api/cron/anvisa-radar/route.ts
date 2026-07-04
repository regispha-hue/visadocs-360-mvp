import { NextResponse } from "next/server";
import { executarRadarANVISA } from "@/lib/anvisa-monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== "production") return true;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const result = await executarRadarANVISA();

  return NextResponse.json({
    success: true,
    executedAt: new Date().toISOString(),
    ...result,
  });
}
