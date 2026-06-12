"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Shield, UserCog } from "lucide-react";
import toast from "react-hot-toast";
import { DataTable } from "@/components/data-table";
import { LoadingSpinner } from "@/components/loading-spinner";
import { PageHeader } from "@/components/page-header";
import { UserCreateDialog } from "@/components/user-create-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TenantUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface Tenant {
  id: string;
  nome: string;
  status: string;
  users: TenantUser[];
}

interface SessionUser {
  role?: string;
  tenantId?: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  RT: "Responsável Técnico",
  OPERADOR: "Operador",
  SUPER_ADMIN: "Super Admin",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function UsuariosPage() {
  const { data: session, status } = useSession() || {};
  const user = session?.user as SessionUser | undefined;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchTenant = useCallback(async () => {
    if (!user?.tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/farmacias/${user.tenantId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao carregar usuários");
      setTenant(data.tenant);
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao carregar usuários"));
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId]);

  useEffect(() => {
    if (status !== "loading") {
      fetchTenant();
    }
  }, [fetchTenant, status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Sessão expirada. Faça login novamente para gerenciar usuários.
        </CardContent>
      </Card>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Acesso restrito a administradores do tenant.
        </CardContent>
      </Card>
    );
  }

  const users = tenant?.users ?? [];
  const columns = [
    {
      key: "name",
      header: "Usuário",
      render: (item: TenantUser) => (
        <div>
          <p className="font-medium">{item.name || "Sem nome"}</p>
          <p className="text-sm text-muted-foreground">{item.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Papel",
      render: (item: TenantUser) => <Badge variant="outline">{ROLE_LABELS[item.role] ?? item.role}</Badge>,
    },
    {
      key: "createdAt",
      header: "Criado em",
      render: (item: TenantUser) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "N/A"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Usuários"
        description={`Gerencie acessos de ${tenant?.nome ?? "seu tenant"}`}
      >
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo usuário
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-teal-600" />
              Usuários do tenant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users.length}</p>
            <p className="text-sm text-muted-foreground">Acessos vinculados ao tenant ativo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600" />
              Permissões disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Administradores podem criar usuários RT e Operador. Criação de ADMIN e SUPER_ADMIN não fica disponível nesta tela.
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={users}
        columns={columns}
        searchKey="email"
        searchPlaceholder="Buscar por email..."
        emptyMessage="Nenhum usuário encontrado"
      />

      <UserCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        roles={["RT", "OPERADOR"]}
        onSuccess={fetchTenant}
      />
    </div>
  );
}
