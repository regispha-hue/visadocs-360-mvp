"use client";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Log {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  userName: string | null;
  tenantId: string | null;
  tenant: { nome: string } | null;
  details: any;
  createdAt: Date;
}

interface LogsTableProps {
  logs: Log[];
}

const ACTION_COLORS: Record<string, string> = {
  TENANT_CREATED: "bg-blue-500",
  TENANT_APPROVED: "bg-emerald-500",
  TENANT_SUSPENDED: "bg-red-500",
  TENANT_REACTIVATED: "bg-emerald-500",
  TENANT_CANCELLED: "bg-gray-500",
  POP_CREATED: "bg-teal-500",
  POP_UPDATED: "bg-amber-500",
  TREINAMENTO_CREATED: "bg-purple-500",
  TREINAMENTO_COMPLETED: "bg-emerald-500",
};

const ACTION_LABELS: Record<string, string> = {
  TENANT_CREATED: "Farmácia Criada",
  TENANT_APPROVED: "Farmácia Aprovada",
  TENANT_SUSPENDED: "Farmácia Suspensa",
  TENANT_REACTIVATED: "Farmácia Reativada",
  TENANT_CANCELLED: "Farmácia Cancelada",
  POP_CREATED: "POP Criado",
  POP_UPDATED: "POP Atualizado",
  POP_ARCHIVED: "POP Arquivado",
  POP_ACTIVATED: "POP Ativado",
  COLABORADOR_CREATED: "Colaborador Criado",
  COLABORADOR_UPDATED: "Colaborador Atualizado",
  TREINAMENTO_CREATED: "Treinamento Criado",
  TREINAMENTO_COMPLETED: "Treinamento Concluído",
  USER_LOGIN: "Login",
  USER_CREATED: "Usuário Criado",
};

export function LogsTable({ logs }: LogsTableProps) {
  const safeLogs = logs ?? [];

  const columns = [
    {
      key: "createdAt",
      header: "Data/Hora",
      render: (item: Log) =>
        item?.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "N/A",
    },
    {
      key: "action",
      header: "Ação",
      render: (item: Log) => {
        const color = ACTION_COLORS[item?.action] ?? "bg-gray-500";
        const label = ACTION_LABELS[item?.action] ?? item?.action ?? "N/A";
        return <Badge className={`${color} text-white`}>{label}</Badge>;
      },
    },
    {
      key: "entity",
      header: "Entidade",
      render: (item: Log) => (
        <span className="text-sm">
          {item?.entity ?? "N/A"}
          {item?.entityId ? ` (${item.entityId.slice(0, 8)}...)` : ""}
        </span>
      ),
    },
    {
      key: "userName",
      header: "Usuário",
      render: (item: Log) => item?.userName ?? "Sistema",
    },
    {
      key: "tenant",
      header: "Farmácia",
      render: (item: Log) => item?.tenant?.nome ?? "-",
    },
  ];

  return (
    <DataTable
      data={safeLogs}
      columns={columns}
      searchKey="action"
      searchPlaceholder="Buscar por ação..."
      emptyMessage="Nenhum log encontrado"
      pageSize={20}
    />
  );
}
