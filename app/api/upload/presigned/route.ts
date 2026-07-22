import { NextResponse } from "next/server";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/auth-guards";
import { generatePresignedUploadUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

const UPLOAD_ROLES = ["SUPER_ADMIN", "ADMIN", "RT", "ANALISTA_CQ"];
const PUBLIC_UPLOAD_ROLES = ["SUPER_ADMIN", "ADMIN", "RT"];
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
]);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) return unauthorized();
    if (!UPLOAD_ROLES.includes(user.role)) return forbidden();

    const { fileName, contentType, isPublic, size } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName e contentType são obrigatórios" }, { status: 400 });
    }

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
    }

    if (typeof size === "number" && size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Arquivo acima do limite de 25 MB" }, { status: 400 });
    }

    if (isPublic && !PUBLIC_UPLOAD_ROLES.includes(user.role)) {
      return forbidden("Sem permissão para gerar upload público");
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
