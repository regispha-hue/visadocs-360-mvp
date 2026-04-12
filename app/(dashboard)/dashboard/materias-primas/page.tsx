"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { CATEGORIAS_MP, STATUS_MATERIA_PRIMA_LABELS } from "@/lib/types";
import { MpFormDialog } from "./_components/mp-form-dialog";
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

interface MateriaPrima {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  casNumber?: string;
  dci?: string;
  categoria?: string;
  unidadeMedida: string;
  estoqueMinimo?: number;
  status: string;
  fornecedor?: { id: string; nome: string };
  _count?: { lotes: number; pops: number };
  createdAt: string;
}

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "secondary"; label: string }> = {
  ATIVO: { variant: "success", label: "Ativo" },
  INATIVO: { variant: "secondary", label: "Inativo" },
  DESCONTINUADO: { variant: "warning", label: "Descontinuado" },
};

export default function MateriasPrimasPage() {
  const router = useRouter();
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMp, setEditingMp] = useState<MateriaPrima | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMp, setDeletingMp] = useState<MateriaPrima | null>(null);

  const fetchMateriasPrimas = async () => {
    try {
      const params = new URLSearchParams();
      if (categoriaFilter && categoriaFilter !== "all") params.append("categoria", categoriaFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const res = await fetch(`/api/materias-primas?${params.toString()}`);
      const data = await res.json();
      if (data?.materiasPrimas) {
        setMateriasPrimas(data.materiasPrimas);
      }
    } catch (error) {
      toast.error("Erro ao carregar matérias-primas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriasPrimas();
  }, [categoriaFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deletingMp) return;
    try {
      const res = await fetch(`/api/materias-primas/${deletingMp.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir");
      }
      toast.success("Matéria-prima excluída!");
      fetchMateriasPrimas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir matéria-prima");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingMp(null);
    }
  };

  const columns = [
    {
      key: "codigo",
      header: "Código",
      render: (item: MateriaPrima) => (
        <span className="font-mono text-sm font-medium">{item.codigo}</span>
      ),
    },
    {
      key: "nome",
      header: "Nome",
      render: (item: MateriaPrima) => (
        <div>
          <p className="font-medium">{item.nome}</p>
          {item.casNumber && (
            <p className="text-xs text-muted-foreground">CAS: {item.casNumber}</p>
          )}
        </div>
      ),
    },
    {
      key: "categoria",
      header: "Categoria",
      render: (item: MateriaPrima) => item.categoria || "-",
    },
    {
      key: "fornecedor",
      header: "Fornecedor",
      render: (item: MateriaPrima) => item.fornecedor?.nome || "-",
    },
    {
      key: "unidadeMedida",
      header: "Unidade",
    },
    {
      key: "lotes",
      header: "Lotes",
      render: (item: MateriaPrima) => (
        <span className="text-sm">{item._count?.lotes || 0}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: MateriaPrima) => {
        const badge = STATUS_BADGES[item.status] || { variant: "secondary", label: item.status };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Ações",
      render: (item: MateriaPrima) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/materias-primas/${item.id}`)}
            title="Visualizar"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingMp(item);
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
              setDeletingMp(item);
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
        title="Matérias-Primas"
        description="Gerencie as fichas de especificação de matérias-primas"
      >
        <Button onClick={() => { setEditingMp(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Matéria-Prima
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-4">
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIAS_MP.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_MATERIA_PRIMA_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={materiasPrimas}
        searchPlaceholder="Buscar por código..."
        searchKey="codigo"
      />

      <MpFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchMateriasPrimas}
        editingMp={editingMp}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a matéria-prima "{deletingMp?.nome}"? 
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
