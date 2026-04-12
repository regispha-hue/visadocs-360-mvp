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
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const treinamentoSchema = z.object({
  popId: z.string().min(1, "POP é obrigatório"),
  colaboradorId: z.string().min(1, "Colaborador é obrigatório"),
  dataTreinamento: z.string().min(1, "Data é obrigatória"),
  instrutor: z.string().min(1, "Instrutor é obrigatório"),
  duracao: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.string().optional(),
});

type TreinamentoForm = z.infer<typeof treinamentoSchema>;

interface TreinamentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treinamento?: any;
  onSuccess: () => void;
}

export function TreinamentoFormDialog({ open, onOpenChange, treinamento, onSuccess }: TreinamentoFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pops, setPops] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const isEditing = !!treinamento;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TreinamentoForm>({
    resolver: zodResolver(treinamentoSchema),
    defaultValues: {
      popId: "",
      colaboradorId: "",
      dataTreinamento: new Date().toISOString().split("T")[0],
      instrutor: "",
      duracao: "",
      observacoes: "",
      status: "PENDENTE",
    },
  });

  const popId = watch("popId");
  const colaboradorId = watch("colaboradorId");
  const status = watch("status");

  // Fetch POPs and colaboradores
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [popsRes, colabRes] = await Promise.all([
          fetch("/api/pops?status=ATIVO"),
          fetch("/api/colaboradores?status=ATIVO"),
        ]);
        const popsData = await popsRes.json();
        const colabData = await colabRes.json();
        setPops(popsData?.pops ?? []);
        setColaboradores(colabData?.colaboradores ?? []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (open) fetchData();
  }, [open]);

  useEffect(() => {
    if (treinamento) {
      reset({
        popId: treinamento.popId || treinamento.pop?.id || "",
        colaboradorId: treinamento.colaboradorId || treinamento.colaborador?.id || "",
        dataTreinamento: treinamento.dataTreinamento
          ? new Date(treinamento.dataTreinamento).toISOString().split("T")[0]
          : "",
        instrutor: treinamento.instrutor || "",
        duracao: treinamento.duracao?.toString() || "",
        observacoes: treinamento.observacoes || "",
        status: treinamento.status || "CONCLUIDO",
      });
    } else {
      reset({
        popId: "",
        colaboradorId: "",
        dataTreinamento: new Date().toISOString().split("T")[0],
        instrutor: "",
        duracao: "",
        observacoes: "",
        status: "PENDENTE",
      });
    }
  }, [treinamento, reset]);

  const onSubmit = async (data: TreinamentoForm) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        duracao: data.duracao ? parseFloat(data.duracao) : null,
      };

      const url = isEditing ? `/api/treinamentos/${treinamento.id}` : "/api/treinamentos";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Erro ao salvar treinamento");
      }

      toast.success(isEditing ? "Treinamento atualizado!" : "Treinamento registrado!");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar treinamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Treinamento" : "Registrar Treinamento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>POP</Label>
            <Select value={popId} onValueChange={(v) => setValue("popId", v)} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o POP" />
              </SelectTrigger>
              <SelectContent>
                {pops?.map((p) => (
                  <SelectItem key={p?.id} value={p?.id}>
                    {p?.codigo} - {p?.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.popId && (
              <p className="text-sm text-red-500 mt-1">{errors.popId.message}</p>
            )}
          </div>

          <div>
            <Label>Colaborador</Label>
            <Select value={colaboradorId} onValueChange={(v) => setValue("colaboradorId", v)} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o colaborador" />
              </SelectTrigger>
              <SelectContent>
                {colaboradores?.map((c) => (
                  <SelectItem key={c?.id} value={c?.id}>
                    {c?.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.colaboradorId && (
              <p className="text-sm text-red-500 mt-1">{errors.colaboradorId.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dataTreinamento">Data</Label>
              <Input
                id="dataTreinamento"
                type="date"
                {...register("dataTreinamento")}
              />
              {errors.dataTreinamento && (
                <p className="text-sm text-red-500 mt-1">{errors.dataTreinamento.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="duracao">Duração (horas)</Label>
              <Input
                id="duracao"
                type="number"
                step="0.5"
                {...register("duracao")}
                placeholder="2"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="instrutor">Instrutor</Label>
              <Input
                id="instrutor"
                {...register("instrutor")}
                placeholder="Nome do instrutor"
              />
              {errors.instrutor && (
                <p className="text-sm text-red-500 mt-1">{errors.instrutor.message}</p>
              )}
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="EM_AVALIACAO">Em Avaliação</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register("observacoes")}
              placeholder="Observações sobre o treinamento"
              rows={3}
            />
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
                isEditing ? "Salvar Alterações" : "Registrar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
