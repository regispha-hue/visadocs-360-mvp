"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { SETORES } from "@/lib/types";

const popSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  setor: z.string().min(1, "Setor é obrigatório"),
  versao: z.string().min(1, "Versão é obrigatória"),
  dataRevisao: z.string().min(1, "Data de revisão é obrigatória"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  objetivo: z.string().min(10, "Objetivo deve ter pelo menos 10 caracteres"),
  descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  equipeEnvolvida: z.string().optional(),
  glossario: z.string().optional(),
  literaturaConsultada: z.string().optional(),
  validadoPor: z.string().optional(),
  implantadoPor: z.string().optional(),
  implantadoEm: z.string().optional(),
  validadeAnos: z.number().optional(),
  status: z.string().optional(),
});

type PopForm = z.infer<typeof popSchema>;

interface PopFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pop?: any;
  onSuccess: () => void;
}

export function PopFormDialog({ open, onOpenChange, pop, onSuccess }: PopFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const isEditing = !!pop;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PopForm>({
    resolver: zodResolver(popSchema),
    defaultValues: {
      codigo: "",
      titulo: "",
      setor: "",
      versao: "Rev00",
      dataRevisao: new Date().toISOString().split("T")[0],
      responsavel: "",
      objetivo: "",
      descricao: "",
      equipeEnvolvida: "",
      glossario: "",
      literaturaConsultada: "",
      validadoPor: "",
      implantadoPor: "",
      implantadoEm: "",
      validadeAnos: 2,
      status: "RASCUNHO",
    },
  });

  const setor = watch("setor");
  const status = watch("status");

  useEffect(() => {
    if (pop) {
      reset({
        codigo: pop.codigo || "",
        titulo: pop.titulo || "",
        setor: pop.setor || "",
        versao: pop.versao || "Rev00",
        dataRevisao: pop.dataRevisao ? new Date(pop.dataRevisao).toISOString().split("T")[0] : "",
        responsavel: pop.responsavel || "",
        objetivo: pop.objetivo || "",
        descricao: pop.descricao || "",
        equipeEnvolvida: pop.equipeEnvolvida || "",
        glossario: pop.glossario || "",
        literaturaConsultada: pop.literaturaConsultada || "",
        validadoPor: pop.validadoPor || "",
        implantadoPor: pop.implantadoPor || "",
        implantadoEm: pop.implantadoEm ? new Date(pop.implantadoEm).toISOString().split("T")[0] : "",
        validadeAnos: pop.validadeAnos || 2,
        status: pop.status || "RASCUNHO",
      });
    } else {
      reset({
        codigo: "",
        titulo: "",
        setor: "",
        versao: "Rev00",
        dataRevisao: new Date().toISOString().split("T")[0],
        responsavel: "",
        objetivo: "",
        descricao: "",
        equipeEnvolvida: "",
        glossario: "",
        literaturaConsultada: "",
        validadoPor: "",
        implantadoPor: "",
        implantadoEm: "",
        validadeAnos: 2,
        status: "RASCUNHO",
      });
    }
  }, [pop, reset]);

  const uploadFile = async (): Promise<{ arquivoUrl: string; arquivoNome: string; arquivoPublic: boolean } | null> => {
    if (!file) return null;

    try {
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic: false,
        }),
      });

      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      return {
        arquivoUrl: cloud_storage_path,
        arquivoNome: file.name,
        arquivoPublic: false,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error("Erro ao fazer upload do arquivo");
    }
  };

  const onSubmit = async (data: PopForm) => {
    setLoading(true);
    try {
      let fileData = null;
      if (file) {
        fileData = await uploadFile();
      }

      const payload = {
        ...data,
        ...(fileData && fileData),
      };

      const url = isEditing ? `/api/pops/${pop.id}` : "/api/pops";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Erro ao salvar POP");
      }

      toast.success(isEditing ? "POP atualizado!" : "POP criado com sucesso!");
      setFile(null);
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar POP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar POP" : "Novo POP"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                {...register("codigo")}
                placeholder="POP.001"
                disabled={isEditing}
              />
              {errors.codigo && (
                <p className="text-sm text-red-500 mt-1">{errors.codigo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="versao">Versão</Label>
              <Input
                id="versao"
                {...register("versao")}
                placeholder="Rev00"
              />
              {errors.versao && (
                <p className="text-sm text-red-500 mt-1">{errors.versao.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              {...register("titulo")}
              placeholder="Título do POP"
            />
            {errors.titulo && (
              <p className="text-sm text-red-500 mt-1">{errors.titulo.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Setor</Label>
              <Select value={setor} onValueChange={(v) => setValue("setor", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {SETORES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.setor && (
                <p className="text-sm text-red-500 mt-1">{errors.setor.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dataRevisao">Data de Revisão</Label>
              <Input
                id="dataRevisao"
                type="date"
                {...register("dataRevisao")}
              />
              {errors.dataRevisao && (
                <p className="text-sm text-red-500 mt-1">{errors.dataRevisao.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                {...register("responsavel")}
                placeholder="Nome do responsável"
              />
              {errors.responsavel && (
                <p className="text-sm text-red-500 mt-1">{errors.responsavel.message}</p>
              )}
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="objetivo">Objetivo</Label>
            <Textarea
              id="objetivo"
              {...register("objetivo")}
              placeholder="Descreva o objetivo deste POP"
              rows={2}
            />
            {errors.objetivo && (
              <p className="text-sm text-red-500 mt-1">{errors.objetivo.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição das Atividades</Label>
            <Textarea
              id="descricao"
              {...register("descricao")}
              placeholder="Descreva o procedimento detalhado"
              rows={6}
            />
            {errors.descricao && (
              <p className="text-sm text-red-500 mt-1">{errors.descricao.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="equipeEnvolvida">Setor e Equipe Técnica Envolvida</Label>
            <Textarea
              id="equipeEnvolvida"
              {...register("equipeEnvolvida")}
              placeholder="Ex: Responsável técnico e colaboradores do laboratório de controle de qualidade"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="glossario">Glossário</Label>
            <Textarea
              id="glossario"
              {...register("glossario")}
              placeholder="Definições e termos técnicos utilizados"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="literaturaConsultada">Literatura Consultada</Label>
            <Textarea
              id="literaturaConsultada"
              {...register("literaturaConsultada")}
              placeholder="Referências bibliográficas e normativas (ANVISA, RDCs, etc.)"
              rows={3}
            />
          </div>

          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Validação do Procedimento</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="validadoPor">Aprovado por</Label>
                <Input id="validadoPor" {...register("validadoPor")} placeholder="Nome do aprovador" />
              </div>
              <div>
                <Label htmlFor="implantadoPor">Implantado por</Label>
                <Input id="implantadoPor" {...register("implantadoPor")} placeholder="Nome do implantador" />
              </div>
              <div>
                <Label htmlFor="implantadoEm">Data de Implantação</Label>
                <Input id="implantadoEm" type="date" {...register("implantadoEm")} />
              </div>
              <div>
                <Label htmlFor="validadeAnos">Validade (Anos)</Label>
                <Input
                  id="validadeAnos"
                  type="number"
                  min={1}
                  max={10}
                  {...register("validadeAnos", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Arquivo Anexo (opcional)</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-teal-500 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "Clique para selecionar um arquivo"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? "Salvar Alterações" : "Criar POP"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
