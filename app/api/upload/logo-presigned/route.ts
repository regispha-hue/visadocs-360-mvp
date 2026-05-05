/**
 * API Logo Upload Presigned URL
 * POST /api/upload/logo-presigned
 * Gera URL pré-assinada para upload de logo no S3
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Verificar permissões (apenas ADMIN_FARMACIA ou SUPER_ADMIN)
    const allowedRoles = ["SUPER_ADMIN", "ADMIN_FARMACIA"];
    if (!tenantId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Permissão negada" },
        { status: 403 }
      );
    }

    if (tenantId && !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Apenas administradores podem alterar a logo" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileType, fileSize } = body;

    // Validações
    if (!fileType || !ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use JPG, PNG, SVG ou WebP." },
        { status: 400 }
      );
    }

    if (!fileSize || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 2MB." },
        { status: 400 }
      );
    }

    // Gerar chave única para o arquivo
    const fileExtension = fileType.split("/")[1].replace("svg+xml", "svg");
    const key = `logos/${tenantId || user.id}/${randomUUID()}.${fileExtension}`;

    // Gerar URL pré-assinada
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutos
    });

    // URL final do arquivo
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      presignedUrl,
      fileUrl,
      key,
      expiresIn: 300,
    });
  } catch (error) {
    console.error("Erro ao gerar presigned URL:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
