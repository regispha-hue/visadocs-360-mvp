"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Presentation,
  Video,
  Sparkles,
  FileCheck,
  Printer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface TrainingMaterialsDialogProps {
  popId: string;
  popCodigo: string;
  popTitulo: string;
}

interface GeneratedFile {
  type: string;
  name: string;
  url: string;
  description: string;
  icon: string;
}

export function TrainingMaterialsDialog({
  popId,
  popCodigo,
  popTitulo,
}: TrainingMaterialsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<GeneratedFile[]>([]);

  const generateMaterials = async (format: string) => {
    try {
      setLoading(true);
      setProgress(0);
      setFiles([]);

      // Simular progresso
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 300);

      const response = await fetch(`/api/pops/${popId}/training-materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      clearInterval(interval);
      setProgress(100);

      if (!response.ok) throw new Error("Erro ao gerar materiais");

      const data = await response.json();
      setFiles(data.files);
      toast.success("Materiais gerados com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar materiais");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "presentation":
        return <Presentation className="h-8 w-8 text-blue-600" />;
      case "image":
        return <ImageIcon className="h-8 w-8 text-green-600" />;
      case "file-text":
        return <FileText className="h-8 w-8 text-amber-600" />;
      case "video":
        return <Video className="h-8 w-8 text-purple-600" />;
      default:
        return <FileCheck className="h-8 w-8 text-gray-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Materiais de Treinamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            Gerar Materiais de Treinamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">{popCodigo}</p>
            <p className="text-sm text-muted-foreground">{popTitulo}</p>
          </div>

          {/* Opções de geração */}
          {files.length === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-teal-500 transition-colors">
                <CardContent
                  className="p-4 text-center"
                  onClick={() => !loading && generateMaterials("all")}
                >
                  <Sparkles className="h-10 w-10 mx-auto mb-2 text-teal-600" />
                  <p className="font-medium">Gerar Todos</p>
                  <p className="text-xs text-muted-foreground">
                    Slides + Poster + PDF + Roteiro
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-blue-500 transition-colors">
                <CardContent
                  className="p-4 text-center"
                  onClick={() => !loading && generateMaterials("slides")}
                >
                  <Presentation className="h-10 w-10 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">Apenas Slides</p>
                  <p className="text-xs text-muted-foreground">
                    Apresentação PowerPoint
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-green-500 transition-colors">
                <CardContent
                  className="p-4 text-center"
                  onClick={() => !loading && generateMaterials("poster")}
                >
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Poster A3</p>
                  <p className="text-xs text-muted-foreground">
                    Para impressão e fixação
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-amber-500 transition-colors">
                <CardContent
                  className="p-4 text-center"
                  onClick={() => !loading && generateMaterials("pdf")}
                >
                  <FileText className="h-10 w-10 mx-auto mb-2 text-amber-600" />
                  <p className="font-medium">Guia PDF</p>
                  <p className="text-xs text-muted-foreground">
                    Material impresso completo
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Progresso */}
          {loading && (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Gerando materiais com IA...
              </p>
              <Progress value={progress} />
            </div>
          )}

          {/* Arquivos gerados */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-green-600" />
                Arquivos Gerados
              </h3>

              <div className="space-y-3">
                {files.map((file) => (
                  <Card key={file.type}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {getIcon(file.icon)}
                        <div className="flex-1">
                          <p className="font-medium">{file.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.name}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(file.url, "_blank");
                            toast.success("Download iniciado!");
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFiles([]);
                    setProgress(0);
                  }}
                >
                  Gerar Outros Formatos
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Concluir
                </Button>
              </div>
            </div>
          )}

          {/* Instruções */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Dicas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Slides:</strong> Use em treinamentos presenciais ou envie
                aos colaboradores.
              </p>
              <p>
                <strong>Poster:</strong> Imprima em A3 e fixe em locais visíveis
                do setor.
              </p>
              <p>
                <strong>PDF:</strong> Material completo para treinamento e
                consulta.
              </p>
              <p>
                <strong>Roteiro:</strong> Use para produzir vídeos de treinamento.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
