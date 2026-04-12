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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { SETORES, FUNCOES, FUNCOES_LABELS } from "@/lib/types";
import { validateCPF } from "@/lib/validations";

const colaboradorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().optional(),
  funcao: z.string().min(1, "Função é obrigatória"),
  setor: z.string().min(1, "Setor é obrigatório"),
  dataAdmissao: z.string().min(1, "Data de admissão é obrigatória"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  status: z.string().optional(),
});

type ColaboradorForm = z.infer<typeof colaboradorSchema>;

interface ColaboradorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador?: any;
  onSuccess: () => void;
}

export function ColaboradorFormDialog({ open, onOpenChange, colaborador, onSuccess }: ColaboradorFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!colaborador;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ColaboradorForm>({
    resolver: zodResolver(colaboradorSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      funcao: "",
      setor: "",
      dataAdmissao: new Date().toISOString().split("T")[0],
      email: "",
      status: "ATIVO",
    },
  });

  const funcao = watch("funcao");
  const setor = watch("setor");
  const status = watch("status");

  useEffect(() => {
    if (colaborador) {
      reset({
        nome: colaborador.nome || "",
        cpf: "", // Don't show CPF for security
        funcao: colaborador.funcao || "",
        setor: colaborador.setor || "",
        dataAdmissao: colaborador.dataAdmissao
          ? new Date(colaborador.dataAdmissao).toISOString().split("T")[0]
          : "",
        email: colaborador.email || "",
        status: colaborador.status || "ATIVO",
      });
    } else {
      reset({
        nome: "",
        cpf: "",
        funcao: "",
        setor: "",
        dataAdmissao: new Date().toISOString().split("T")[0],
        email: "",
        status: "ATIVO",
      });
    }
  }, [colaborador, reset]);

  const onSubmit = async (data: ColaboradorForm) => {
    // Validate CPF for new colaboradores
    if (!isEditing && (!data.cpf || !validateCPF(data.cpf))) {
      toast.error("CPF inválido");
      return;
    }

    setLoading(true);
    try {
      const payload = isEditing
        ? {
            nome: data.nome,
            funcao: data.funcao,
            setor: data.setor,
            dataAdmissao: data.dataAdmissao,
            email: data.email || null,
            status: data.status,
          }
        : data;

      const url = isEditing ? `/api/colaboradores/${colaborador.id}` : "/api/colaboradores";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Erro ao salvar colaborador");
      }

      toast.success(isEditing ? "Colaborador atualizado!" : "Colaborador criado com sucesso!");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar colaborador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              {...register("nome")}
              placeholder="Nome completo"
            />
            {errors.nome && (
              <p className="text-sm text-red-500 mt-1">{errors.nome.message}</p>
            )}
          </div>

          {!isEditing && (
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                {...register("cpf")}
                placeholder="000.000.000-00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O CPF será criptografado para proteção dos dados
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Função</Label>
              <Select value={funcao} onValueChange={(v) => setValue("funcao", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FUNCOES.map((f) => (
                    <SelectItem key={f} value={f}>{FUNCOES_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.funcao && (
                <p className="text-sm text-red-500 mt-1">{errors.funcao.message}</p>
              )}
            </div>

            <div>
              <Label>Setor</Label>
              <Select value={setor} onValueChange={(v) => setValue("setor", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dataAdmissao">Data de Admissão</Label>
              <Input
                id="dataAdmissao"
                type="date"
                {...register("dataAdmissao")}
              />
              {errors.dataAdmissao && (
                <p className="text-sm text-red-500 mt-1">{errors.dataAdmissao.message}</p>
              )}
            </div>

            {isEditing && (
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setValue("status", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email (opcional)</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
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
                isEditing ? "Salvar Alterações" : "Criar Colaborador"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
