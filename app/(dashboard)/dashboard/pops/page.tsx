"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Eye, Edit, Archive, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SETORES, STATUS_POP_LABELS } from "@/lib/types";
import { PopFormDialog } from "./_components/pop-form-dialog";
import { getFileUrl } from "@/lib/s3";

interface Pop {
  id: string;
  codigo: string;
  titulo: string;
  setor: string;
  versao: string;
  dataRevisao: string;
  responsavel: string;
  status: string;
  arquivoUrl?: string;
  arquivoPublic?: boolean;
  createdAt: string;
}

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "secondary"; label: string }> = {
  RASCUNHO: { variant: "secondary", label: "Rascunho" },
  ATIVO: { variant: "success", label: "Ativo" },
  ARQUIVADO: { variant: "warning", label: "Arquivado" },
};

export default function PopsPage() {
  const router = useRouter();
  const [pops, setPops] = useState<Pop[]>([]);
  const [loading, setLoading] = useState(true);
  const [setorFilter, setSetorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPop, setEditingPop] = useState<Pop | null>(null);

  const fetchPops = async () => {
    try {
      const params = new URLSearchParams();
      if (setorFilter && setorFilter !== "all") params.append("setor", setorFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const res = await fetch(`/api/pops?${params.toString()}`);
      const data = await res.json();
      if (data?.pops) {
        setPops(data.pops);
      }
    } catch (error) {
      toast.error("Erro ao carregar POPs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPops();
  }, [setorFilter, statusFilter]);

  const handleDownload = async (pop: Pop) => {
    if (!pop?.arquivoUrl) {
      toast.error("Arquivo não disponível");
      return;
    }
    try {
      const res = await fetch(`/api/pops/${pop.id}/download`);
      const data = await res.json();
      if (data?.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = pop.codigo + ".pdf";
        a.click();
      }
    } catch (error) {
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handleStatusChange = async (pop: Pop, newStatus: string) => {
    try {
      const res = await fetch(`/api/pops/${pop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status atualizado!");
      fetchPops();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const columns = [
    {
      key: "codigo",
      header: "Código",
      render: (item: Pop) => (
        <span className="font-mono font-medium text-teal-600">{item?.codigo ?? "N/A"}</span>
      ),
    },
    {
      key: "titulo",
      header: "Título",
      render: (item: Pop) => (
        <div className="max-w-[300px]">
          <p className="font-medium truncate">{item?.titulo ?? "N/A"}</p>
          <p className="text-sm text-muted-foreground">{item?.responsavel ?? "N/A"}</p>
        </div>
      ),
    },
    {
      key: "setor",
      header: "Setor",
    },
    {
      key: "versao",
      header: "Versão",
    },
    {
      key: "status",
      header: "Status",
      render: (item: Pop) => {
        const badge = STATUS_BADGES[item?.status] ?? { variant: "secondary", label: item?.status };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: "dataRevisao",
      header: "Revisão",
      render: (item: Pop) =>
        item?.dataRevisao ? format(new Date(item.dataRevisao), "dd/MM/yyyy", { locale: ptBR }) : "N/A",
    },
    {
      key: "actions",
      header: "Ações",
      render: (item: Pop) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/pops/${item?.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingPop(item);
              setDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {item?.arquivoUrl && (
            <Button variant="ghost" size="icon" onClick={() => handleDownload(item)}>
              <Download className="h-4 w-4" />
            </Button>
          )}
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
    <div>
      <PageHeader
        title="POPs"
        description="Gerencie os Procedimentos Operacionais Padrão"
      >
        <Button onClick={() => { setEditingPop(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo POP
        </Button>
      </PageHeader>

      <div className="flex gap-4 mb-6">
        <Select value={setorFilter} onValueChange={setSetorFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {SETORES.map((setor) => (
              <SelectItem key={setor} value={setor}>{setor}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="RASCUNHO">Rascunho</SelectItem>
            <SelectItem value="ATIVO">Ativo</SelectItem>
            <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={pops}
        columns={columns}
        searchKey="titulo"
        searchPlaceholder="Buscar por título..."
        emptyMessage="Nenhum POP encontrado"
      />

      <PopFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pop={editingPop}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingPop(null);
          fetchPops();
        }}
      />
    </div>
  );
}
