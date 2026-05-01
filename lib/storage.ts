// lib/storage.ts — Supabase Storage (substitui S3)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKETS = {
  public: 'visadocs-public',
  private: 'visadocs-private',
} as const;

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = false
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const bucket = isPublic ? BUCKETS.public : BUCKETS.private;
  const filePath = `uploads/${timestamp}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(filePath);

  if (error) {
    throw new Error(`Erro ao gerar URL de upload: ${error.message}`);
  }

  return {
    uploadUrl: data.signedUrl,
    cloud_storage_path: `${bucket}/${filePath}`,
  };
}

export async function getFileUrl(
  cloud_storage_path: string,
  isPublic: boolean = false
): Promise<string> {
  const [bucket, ...pathParts] = cloud_storage_path.split('/');
  const filePath = pathParts.join('/');

  if (isPublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 3600);

  if (error) {
    throw new Error(`Erro ao gerar URL: ${error.message}`);
  }

  return data.signedUrl;
}

export async function deleteFile(cloud_storage_path: string): Promise<void> {
  const [bucket, ...pathParts] = cloud_storage_path.split('/');
  const filePath = pathParts.join('/');

  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) {
    throw new Error(`Erro ao deletar: ${error.message}`);
  }
}

export async function uploadBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  isPublic: boolean = false
): Promise<string> {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const bucket = isPublic ? BUCKETS.public : BUCKETS.private;
  const filePath = `generated/${timestamp}-${safeName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, { contentType, upsert: false });

  if (error) throw new Error(`Upload falhou: ${error.message}`);
  return `${bucket}/${filePath}`;
}