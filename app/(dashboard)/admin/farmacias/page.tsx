"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";

interface Farmacia {
  id: string;
  nome: string;
  cnpj: string;
  responsavel: string;
  email: string;
  telefone: string;
  status: string;
  subscriptionStatus: string;
  createdAt: string;
  _count: {
    pops: number;
    colaboradores: number;
    treinamentos: number;
  };
}

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "destructive" | "secondary"; label: string }> = {
  PENDENTE: { variant: "warning", label: "Pendente" },
  ATIVO: { variant: "success", label: "Ativo" },
  SUSPENSO: { variant: "destructive", label: "Suspenso" },
  CANCELADO: { variant: "secondary", label: "Cancelado" },
};

export default function FarmaciasPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get("status") || "";
  
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const fetchFarmacias = async () => {
    try {
      const url = statusFilter ? `/api/farmacias?status=${statusFilter}` : "/api/farmacias";
      const res = await fetch(url);
      const data = await res.json();
      if (data?.farmacias) {
        setFarmacias(data.farmacias);
      }
    } catch (error) {
      toast.error("Erro ao carregar farmácias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmacias();
  }, [statusFilter]);

  const columns = [
    {
      key: "nome",
      header: "Farmácia",
      render: (item: Farmacia) => (
        <div>
          <p className="font-medium">{item?.nome ?? "N/A"}</p>
          <p className="text-sm text-muted-foreground">{item?.cnpj ?? "N/A"}</p>
        </div>
      ),
    },
    {
      key: "responsavel",
      header: "Responsável",
      render: (item: Farmacia) => (
        <div>
          <p>{item?.responsavel ?? "N/A"}</p>
          <p className="text-sm text-muted-foreground">{item?.email ?? "N/A"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Farmacia) => {
        const badge = STATUS_BADGES[item?.status] ?? { variant: "secondary", label: item?.status };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "Cadastro",
      render: (item: Farmacia) =>
        item?.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A",
    },
    {
      key: "actions",
      header: "Ações",
      render: (item: Farmacia) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/farmacias/${item?.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            Ver
          </Link>
        </Button>
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
        title="Farmácias"
        description="Gerencie todas as farmácias cadastradas no sistema"
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDENTE">Pendentes</SelectItem>
            <SelectItem value="ATIVO">Ativos</SelectItem>
            <SelectItem value="SUSPENSO">Suspensos</SelectItem>
            <SelectItem value="CANCELADO">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable
        data={farmacias}
        columns={columns}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
        emptyMessage="Nenhuma farmácia encontrada"
      />
    </div>
  );
}
