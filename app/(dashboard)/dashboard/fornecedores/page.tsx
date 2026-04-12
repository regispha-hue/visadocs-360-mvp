"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/loading-spinner";
import { FornecedorFormDialog } from "./_components/fornecedor-form-dialog";
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

interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  contato?: string;
  observacoes?: string;
  ativo: boolean;
  _count?: { materiasPrimas: number; lotes: number };
  createdAt: string;
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFornecedor, setDeletingFornecedor] = useState<Fornecedor | null>(null);

  const fetchFornecedores = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("ativo", statusFilter);
      
      const res = await fetch(`/api/fornecedores?${params.toString()}`);
      const data = await res.json();
      if (data?.fornecedores) {
        setFornecedores(data.fornecedores);
      }
    } catch (error) {
      toast.error("Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, [statusFilter]);

  const handleDelete = async () => {
    if (!deletingFornecedor) return;
    try {
      const res = await fetch(`/api/fornecedores/${deletingFornecedor.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir");
      }
      toast.success("Fornecedor excluído!");
      fetchFornecedores();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir fornecedor");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingFornecedor(null);
    }
  };

  const columns = [
    {
      key: "nome",
      header: "Nome",
      render: (item: Fornecedor) => (
        <div>
          <p className="font-medium">{item.nome}</p>
          {item.contato && (
            <p className="text-xs text-muted-foreground">Contato: {item.contato}</p>
          )}
        </div>
      ),
    },
    {
      key: "cnpj",
      header: "CNPJ",
      render: (item: Fornecedor) => item.cnpj || "-",
    },
    {
      key: "telefone",
      header: "Telefone",
      render: (item: Fornecedor) => item.telefone || "-",
    },
    {
      key: "email",
      header: "E-mail",
      render: (item: Fornecedor) => item.email || "-",
    },
    {
      key: "materiasPrimas",
      header: "MPs",
      render: (item: Fornecedor) => (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{item._count?.materiasPrimas || 0}</span>
        </div>
      ),
    },
    {
      key: "lotes",
      header: "Lotes",
      render: (item: Fornecedor) => item._count?.lotes || 0,
    },
    {
      key: "ativo",
      header: "Status",
      render: (item: Fornecedor) => (
        <Badge variant={item.ativo ? "success" : "secondary"}>
          {item.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (item: Fornecedor) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingFornecedor(item);
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
              setDeletingFornecedor(item);
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
        title="Fornecedores"
        description="Gerencie os fornecedores de matérias-primas"
      >
        <Button onClick={() => { setEditingFornecedor(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={fornecedores}
        searchPlaceholder="Buscar por nome..."
        searchKey="nome"
      />

      <FornecedorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchFornecedores}
        editingFornecedor={editingFornecedor}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{deletingFornecedor?.nome}"? 
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
