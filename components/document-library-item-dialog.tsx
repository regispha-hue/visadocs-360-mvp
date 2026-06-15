"use client";

import { useState } from "react";
import { FilePlus2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type DocumentLibraryType = "POP" | "RQ" | "MANUAL" | "TREINAMENTO" | "EVIDENCIA" | "REFERENCIA";

interface DocumentLibraryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
}

const TYPE_OPTIONS: Array<{ value: DocumentLibraryType; label: string }> = [
  { value: "POP", label: "POP" },
  { value: "RQ", label: "RQ" },
  { value: "MANUAL", label: "Manual" },
  { value: "TREINAMENTO", label: "Treinamento" },
  { value: "EVIDENCIA", label: "Evidencia" },
  { value: "REFERENCIA", label: "Referencia" },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function DocumentLibraryItemDialog({ open, onOpenChange, onSuccess }: DocumentLibraryItemDialogProps) {
  const [type, setType] = useState<DocumentLibraryType>("REFERENCIA");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [version, setVersion] = useState("1.0");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setType("REFERENCIA");
    setTitle("");
    setCode("");
    setCategory("");
    setVersion("1.0");
    setContent("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Informe o titulo do item documental.");
      return;
    }

    if (!content.trim()) {
      toast.error("Informe o conteudo textual para preparar chunks canonicos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/document-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          code: code.trim(),
          category: category.trim(),
          version: version.trim() || "1.0",
          content: content.trim(),
          source: "manual-ui",
          status: "ACTIVE",
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao criar item documental");
      }

      toast.success("Item documental criado.");
      resetForm();
      onOpenChange(false);
      await onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao criar item documental"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus2 className="h-5 w-5 text-teal-600" />
            Novo item documental
          </DialogTitle>
          <DialogDescription>
            Crie uma fonte textual para envio posterior a Biblioteca Canonica e geracao de chunks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(value) => setType(value as DocumentLibraryType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="library-version">Versao</Label>
              <Input
                id="library-version"
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="1.0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="library-title">Titulo</Label>
            <Input
              id="library-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titulo do documento"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="library-code">Codigo</Label>
              <Input
                id="library-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div>
              <Label htmlFor="library-category">Categoria</Label>
              <Input
                id="library-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="library-content">Conteudo textual</Label>
            <Textarea
              id="library-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Cole aqui o texto da fonte documental que sera usado para gerar chunks canonicos."
              rows={10}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              O conteudo fica apenas no item documental do tenant e sera usado pelo endpoint de chunking existente.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar item"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
