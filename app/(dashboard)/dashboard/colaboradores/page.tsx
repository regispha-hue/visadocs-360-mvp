"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Eye, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SETORES, FUNCOES, FUNCOES_LABELS } from "@/lib/types";
import { ColaboradorFormDialog } from "./_components/colaborador-form-dialog";

interface Colaborador {
  id: string;
  nome: string;
  cpfMasked: string;
  funcao: string;
  setor: string;
  dataAdmissao: string;
  email?: string;
  status: string;
}

export default function ColaboradoresPage() {
  const router = useRouter();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [funcaoFilter, setFuncaoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);

  const fetchColaboradores = async () => {
    try {
      const params = new URLSearchParams();
      if (funcaoFilter && funcaoFilter !== "all") params.append("funcao", funcaoFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const res = await fetch(`/api/colaboradores?${params.toString()}`);
      const data = await res.json();
      if (data?.colaboradores) {
        setColaboradores(data.colaboradores);
      }
    } catch (error) {
      toast.error("Erro ao carregar colaboradores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, [funcaoFilter, statusFilter]);

  const columns = [
    {
      key: "nome",
      header: "Nome",
      render: (item: Colaborador) => (
        <div>
          <p className="font-medium">{item?.nome ?? "N/A"}</p>
          <p className="text-sm text-muted-foreground">{item?.cpfMasked ?? "N/A"}</p>
        </div>
      ),
    },
    {
      key: "funcao",
      header: "Função",
      render: (item: Colaborador) => FUNCOES_LABELS[item?.funcao] ?? item?.funcao ?? "N/A",
    },
    {
      key: "setor",
      header: "Setor",
    },
    {
      key: "dataAdmissao",
      header: "Admissão",
      render: (item: Colaborador) =>
        item?.dataAdmissao ? format(new Date(item.dataAdmissao), "dd/MM/yyyy", { locale: ptBR }) : "N/A",
    },
    {
      key: "status",
      header: "Status",
      render: (item: Colaborador) => (
        <Badge variant={item?.status === "ATIVO" ? "success" : "secondary"}>
          {item?.status === "ATIVO" ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (item: Colaborador) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/colaboradores/${item?.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingColaborador(item);
              setDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
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
    <div>
      <PageHeader
        title="Colaboradores"
        description="Gerencie a equipe da farmácia"
      >
        <Button onClick={() => { setEditingColaborador(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Colaborador
        </Button>
      </PageHeader>

      <div className="flex gap-4 mb-6">
        <Select value={funcaoFilter} onValueChange={setFuncaoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as funções</SelectItem>
            {FUNCOES.map((f) => (
              <SelectItem key={f} value={f}>{FUNCOES_LABELS[f]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ATIVO">Ativo</SelectItem>
            <SelectItem value="INATIVO">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={colaboradores}
        columns={columns}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
        emptyMessage="Nenhum colaborador encontrado"
      />

      <ColaboradorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        colaborador={editingColaborador}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingColaborador(null);
          fetchColaboradores();
        }}
      />
    </div>
  );
}
