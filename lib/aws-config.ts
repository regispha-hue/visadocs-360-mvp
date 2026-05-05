/**
 * AWS Configuration
 * Configuração AWS SDK para S3 uploads
 */

import { S3Client } from "@aws-sdk/client-s3";

// AWS S3 Client Configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Bucket configuration
export const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "";
export const FOLDER_PREFIX = process.env.AWS_FOLDER_PREFIX || "visadocs";

// S3 upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "text/plain",
];

// Generate S3 key for file
export function generateS3Key(
  tenantId: string,
  entity: string,
  entityId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${FOLDER_PREFIX}/${tenantId}/${entity}/${entityId}/${timestamp}-${sanitizedFilename}`;
}

// Get public URL for S3 object
export function getS3PublicUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
