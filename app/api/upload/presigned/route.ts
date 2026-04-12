import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generatePresignedUploadUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { fileName, contentType, isPublic } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName e contentType são obrigatórios" }, { status: 400 });
    }

    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      isPublic ?? false
    );

    return NextResponse.json({ uploadUrl, cloud_storage_path });
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Erro ao gerar URL de upload" }, { status: 500 });
  }
}
