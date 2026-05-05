"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface LogoUploaderProps {
  currentLogoUrl?: string | null;
  onLogoUpdate: (url: string | null) => void;
  tenantName: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];

export function LogoUploader({
  currentLogoUrl,
  onLogoUpdate,
  tenantName,
}: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Tipo de arquivo não permitido. Use JPG, PNG, SVG ou WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Arquivo muito grande. Máximo 2MB.";
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Criar preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Obter presigned URL
      const presignedRes = await fetch("/api/upload/logo-presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignedRes.ok) {
        const error = await presignedRes.json();
        throw new Error(error.error || "Erro ao gerar URL de upload");
      }

      const { presignedUrl, fileUrl } = await presignedRes.json();

      // 2. Upload direto para S3
      setUploadProgress(50);

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Erro ao fazer upload para o S3");
      }

      setUploadProgress(80);

      // 3. Atualizar tenant com nova URL
      const updateRes = await fetch("/api/tenant/logo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: fileUrl }),
      });

      if (!updateRes.ok) {
        const error = await updateRes.json();
        throw new Error(error.error || "Erro ao atualizar logo");
      }

      setUploadProgress(100);

      // Limpar preview temporário e usar URL real
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(fileUrl);
      onLogoUpdate(fileUrl);

      toast.success("Logo atualizada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload");
      // Reverter preview
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [currentLogoUrl]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm("Remover a logo atual?")) return;

    try {
      const res = await fetch("/api/tenant/logo", {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao remover logo");
      }

      setPreviewUrl(null);
      onLogoUpdate(null);
      toast.success("Logo removida");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover logo");
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logo da Farmácia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative w-full h-32 bg-gray-50 rounded-lg flex items-center justify-center p-4">
              <img
                src={previewUrl}
                alt={`Logo ${tenantName}`}
                className="max-h-full max-w-full object-contain"
              />
              <button
                onClick={handleRemoveLogo}
                disabled={isUploading}
                className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                title="Remover logo"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={openFileDialog}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Enviando..." : "Alterar logo"}
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={openFileDialog}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${
                isDragging
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-300 hover:border-gray-400"
              }
            `}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Clique ou arraste uma imagem aqui
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, SVG ou WebP (máx. 2MB)
            </p>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-center text-gray-500">
              {uploadProgress < 50 && "Preparando upload..."}
              {uploadProgress >= 50 && uploadProgress < 80 && "Enviando para servidor..."}
              {uploadProgress >= 80 && "Finalizando..."}
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/svg+xml,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="text-xs text-gray-500">
          <p>Recomendações:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Use imagens com fundo transparente (PNG/SVG) para melhor resultado</li>
            <li>Dimensões recomendadas: 200x60 pixels</li>
            <li>A logo será exibida no sidebar e nos documentos PDF</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
