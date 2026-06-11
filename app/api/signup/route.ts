import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Criacao publica de usuarios desabilitada. Use o fluxo de cadastro e aprovacao de farmacia.",
    },
    { status: 410 }
  );
}
