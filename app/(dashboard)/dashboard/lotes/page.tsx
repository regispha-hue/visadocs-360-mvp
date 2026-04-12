"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { STATUS_LOTE_LABELS } from "@/lib/types";
import { LoteFormDialog } from "./_components/lote-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Lote {
  id: string;
  numeroLote: string;
  loteInterno?: string;
  dataFabricacao?: string;
  dataValidade: string;
  dataRecebimento: string;
  quantidade: number;
  quantidadeAtual: number;
  status: string;
  materiaPrima?: { id: string; codigo: string; nome: string; unidadeMedida: string };
  fornecedor?: { id: string; nome: string };
  createdAt: string;
}

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "secondary" | "destructive"; label: string }> = {
  QUARENTENA: { variant: "warning", label: "Quarentena" },
  APROVADO: { variant: "success", label: "Aprovado" },
  REPROVADO: { variant: "destructive", label: "Reprovado" },
  VENCIDO: { variant: "destructive", label: "Vencido" },
  EM_USO: { variant: "success", label: "Em Uso" },
  ESGOTADO: { variant: "secondary", label: "Esgotado" },
};

export default function LotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedMpId = searchParams.get("materiaPrimaId") || undefined;
  
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [vencendoFilter, setVencendoFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLote, setDeletingLote] = useState<Lote | null>(null);

  // Open dialog if there's a pre-selected MP
  useEffect(() => {
    if (preSelectedMpId) {
      setDialogOpen(true);
    }
  }, [preSelectedMpId]);

  const fetchLotes = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (vencendoFilter && vencendoFilter !== "all") params.append("vencendo", vencendoFilter);
      
      const res = await fetch(`/api/lotes?${params.toString()}`);
      const data = await res.json();
      if (data?.lotes) {
        setLotes(data.lotes);
      }
    } catch (error) {
      toast.error("Erro ao carregar lotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, [statusFilter, vencendoFilter]);

  const handleDelete = async () => {
    if (!deletingLote) return;
    try {
      const res = await fetch(`/api/lotes/${deletingLote.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir");
      }
      toast.success("Lote excluído!");
      fetchLotes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir lote");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingLote(null);
    }
  };

  const columns = [
    {
      key: "numeroLote",
      header: "Lote",
      render: (item: Lote) => (
        <div>
          <span className="font-mono font-medium">{item.numeroLote}</span>
          {item.loteInterno && (
            <p className="text-xs text-muted-foreground">Int: {item.loteInterno}</p>
          )}
        </div>
      ),
    },
    {
      key: "materiaPrima",
      header: "Matéria-Prima",
      render: (item: Lote) => (
        <div>
          <p className="font-medium">{item.materiaPrima?.nome}</p>
          <p className="text-xs text-muted-foreground">{item.materiaPrima?.codigo}</p>
        </div>
      ),
    },
    {
      key: "fornecedor",
      header: "Fornecedor",
      render: (item: Lote) => item.fornecedor?.nome || "-",
    },
    {
      key: "dataValidade",
      header: "Validade",
      render: (item: Lote) => {
        const diasParaVencer = differenceInDays(new Date(item.dataValidade), new Date());
        const isExpired = diasParaVencer < 0;
        const isExpiringSoon = diasParaVencer >= 0 && diasParaVencer <= 30;
        
        return (
          <div className="flex items-center gap-2">
            <span className={isExpired ? "text-red-600 font-medium" : isExpiringSoon ? "text-orange-600 font-medium" : ""}>
              {format(new Date(item.dataValidade), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            {(isExpired || isExpiringSoon) && (
              <AlertTriangle className={`h-4 w-4 ${isExpired ? "text-red-600" : "text-orange-600"}`} />
            )}
          </div>
        );
      },
    },
    {
      key: "quantidade",
      header: "Quantidade",
      render: (item: Lote) => (
        <span>
          {item.quantidadeAtual.toFixed(2)} / {item.quantidade.toFixed(2)} {item.materiaPrima?.unidadeMedida}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Lote) => {
        const badge = STATUS_BADGES[item.status] || { variant: "secondary", label: item.status };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Ações",
      render: (item: Lote) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/lotes/${item.id}`)}
            title="Visualizar"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingLote(item);
              setDialogOpen(true);
            }}
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDeletingLote(item);
              setDeleteDialogOpen(true);
            }}
            title="Excluir"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Lotes"
        description="Gerencie os lotes de matérias-primas e rastreabilidade"
      >
        <Button onClick={() => { setEditingLote(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lote
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_LOTE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={vencendoFilter} onValueChange={setVencendoFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Vencimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="7">Vencendo em 7 dias</SelectItem>
            <SelectItem value="15">Vencendo em 15 dias</SelectItem>
            <SelectItem value="30">Vencendo em 30 dias</SelectItem>
            <SelectItem value="60">Vencendo em 60 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={lotes}
        searchPlaceholder="Buscar por lote..."
        searchKey="numeroLote"
      />

      <LoteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchLotes}
        editingLote={editingLote}
        preSelectedMpId={preSelectedMpId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lote "{deletingLote?.numeroLote}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
