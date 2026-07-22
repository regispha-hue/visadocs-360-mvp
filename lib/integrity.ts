import { createHash } from "crypto";

export function sha256Hex(value: string | null | undefined) {
  if (!value) return null;
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function documentIntegrityMetadata(input: {
  content?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
}) {
  return {
    contentHash: sha256Hex(input.content?.trim() || null),
    fileReferenceHash: sha256Hex(input.fileUrl || null),
    fileName: input.fileName || null,
    algorithm: "sha256",
  };
}
