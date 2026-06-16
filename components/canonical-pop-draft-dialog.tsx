"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

export interface CanonicalDraftChunkSummary {
  id: string;
  chunkIndex: number;
  documentTitle: string;
  documentCode?: string | null;
  heading?: string | null;
  text: string;
  retrievalLogId?: string | null;
}

interface CanonicalPopDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chunks: CanonicalDraftChunkSummary[];
  retrievalLogId?: string | null;
  onSubmit: (values: {
    title: string;
    code: string;
    objective?: string;
    chunkIds: string[];
    retrievalLogId?: string | null;
  }) => Promise<{ popId?: string | null; draftId?: string | null }>;
}

interface DraftSuccessState {
  popId: string | null;
  draftId: string | null;
  title: string;
  code: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function abbreviateId(id: string) {
  return id.length > 10 ? `${id.slice(0, 8)}...` : id;
}

export function CanonicalPopDraftDialog({
  open,
  onOpenChange,
  chunks,
  retrievalLogId,
  onSubmit,
}: CanonicalPopDraftDialogProps) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [objective, setObjective] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<DraftSuccessState | null>(null);

  const resetForm = () => {
    setTitle("");
    setCode("");
    setObjective("");
    setSuccess(null);
  };

  const handleContinue = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (title.trim().length < 3) {
      toast.error("Informe um título com pelo menos 3 caracteres.");
      return;
    }

    if (!code.trim()) {
      toast.error("Informe o código da minuta POP.");
      return;
    }

    if (chunks.length === 0) {
      toast.error("Selecione ao menos um trecho de documento.");
      return;
    }

    setLoading(true);
    try {
      const draftTitle = title.trim();
      const draftCode = code.trim();
      const result = await onSubmit({
        title: draftTitle,
        code: draftCode,
        objective: objective.trim() || undefined,
        chunkIds: chunks.map((chunk) => chunk.id),
        retrievalLogId,
      });
      setSuccess({
        popId: result.popId || null,
        draftId: result.draftId || null,
        title: draftTitle,
        code: draftCode,
      });
      toast.success("Minuta POP criada em rascunho.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao criar minuta POP."));
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
            <FileText className="h-5 w-5 text-teal-600" />
            Criar minuta POP
          </DialogTitle>
          <DialogDescription>
            Crie uma minuta auxiliar rastreável a partir dos trechos selecionados. Nada será aprovado
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-teal-50 p-4 text-sm text-teal-900">
              <p className="font-semibold">Minuta criada em rascunho</p>
              <p className="mt-2">
                A minuta foi criada com fontes de referência vinculadas. Ela ainda precisa de revisão do Responsável Técnico.
              </p>
              <p className="mt-3 text-xs text-teal-800">
                {success.code} - {success.title}
              </p>
              <p className="mt-2 text-xs text-teal-800">
                Nenhuma versão vigente foi publicada automaticamente.
              </p>
              {success.draftId && (
                <p className="mt-3 font-mono text-xs text-teal-700">
                  Minuta: {abbreviateId(success.draftId)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {success.popId && (
                <Button asChild>
                  <Link href={`/dashboard/pops/${success.popId}`}>Abrir minuta</Link>
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleContinue}>
                Continuar na biblioteca
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-md border bg-amber-50 p-3 text-sm text-amber-900">
              Esta ação cria apenas uma minuta em RASCUNHO. Nenhuma versão vigente será publicada.
            </div>
            <div>
              <Label htmlFor="canonical-draft-title">Título</Label>
              <Input
                id="canonical-draft-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Título da minuta POP"
                required
              />
            </div>

            <div>
              <Label htmlFor="canonical-draft-code">Código</Label>
              <Input
                id="canonical-draft-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="POP-QA-001"
                required
              />
            </div>

            <div>
              <Label htmlFor="canonical-draft-objective">Objetivo</Label>
              <Textarea
                id="canonical-draft-objective"
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                placeholder="Objetivo operacional da minuta"
                rows={3}
              />
            </div>

            <div className="rounded-md border bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-800">
                {chunks.length} trecho{chunks.length === 1 ? "" : "s"} selecionado{chunks.length === 1 ? "" : "s"}
              </p>
              {retrievalLogId && (
                <p className="mt-1 font-mono text-xs text-gray-500">Registro da busca: {retrievalLogId}</p>
              )}
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {chunks.slice(0, 8).map((chunk) => (
                  <div key={chunk.id} className="rounded border bg-white p-2 text-xs text-gray-600">
                    <p className="font-medium text-gray-800">
                      {chunk.documentCode ? `${chunk.documentCode} - ` : ""}
                      {chunk.documentTitle} · Trecho {chunk.chunkIndex + 1}
                    </p>
                    {chunk.heading && <p className="mt-1 text-gray-700">{chunk.heading}</p>}
                    <p className="mt-1 line-clamp-2">{chunk.text}</p>
                  </div>
                ))}
                {chunks.length > 8 && (
                  <p className="text-xs text-gray-500">+ {chunks.length - 8} trechos adicionais selecionados.</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || chunks.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando minuta...
                  </>
                ) : (
                  "Criar minuta em rascunho"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
