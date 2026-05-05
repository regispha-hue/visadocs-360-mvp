"use client";
import { EnderecoTenant } from '@/types';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Users,
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Tenant {
  id: string;
  nome: string;
  cnpj: string;
  responsavel: string;
  email: string;
  telefone: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  status: string;
  subscriptionStatus: string;
  trialEndsAt?: string;
  createdAt: string;
  _count: {
    pops: number;
    colaboradores: number;
    treinamentos: number;
    users: number;
  };
  users: { id: string; name: string; email: string; role: string }[];
}

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "destructive" | "secondary"; label: string }> = {
  PENDENTE: { variant: "warning", label: "Pendente" },
  ATIVO: { variant: "success", label: "Ativo" },
  SUSPENSO: { variant: "destructive", label: "Suspenso" },
  CANCELADO: { variant: "secondary", label: "Cancelado" },
};

export default function FarmaciaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const fetchTenant = async () => {
    try {
      const res = await fetch(`/api/farmacias/${params.id}`);
      const data = await res.json();
      if (data?.tenant) {
        setTenant(data.tenant);
      }
    } catch (error) {
      toast.error("Erro ao carregar farmácia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [params.id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/farmacias/${params.id}/aprovar`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao aprovar");
      
      setApprovalResult({
        email: data?.adminUser?.email ?? "",
        tempPassword: data?.adminUser?.tempPassword ?? "",
      });
      setApprovalDialog(true);
      fetchTenant();
      toast.success("Farmácia aprovada com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao aprovar farmácia");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/farmacias/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao atualizar status");
      
      fetchTenant();
      toast.success("Status atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar status");
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Farmácia não encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const statusBadge = STATUS_BADGES[tenant.status] ?? { variant: "secondary", label: tenant.status };
  const endereco = (tenant.endereco ?? {}) as EnderecoTenant;

  return (
    <div>
      <PageHeader
        title={tenant.nome}
        description={`CNPJ: ${tenant.cnpj}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </PageHeader>

      {/* Status and Actions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant={statusBadge.variant} className="text-base px-4 py-1">
                {statusBadge.label}
              </Badge>
              {tenant.subscriptionStatus === "TRIAL" && tenant.trialEndsAt && (
                <Badge variant="outline">
                  Trial até {format(new Date(tenant.trialEndsAt), "dd/MM/yyyy", { locale: ptBR })}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {tenant.status === "PENDENTE" && (
                <Button onClick={handleApprove} disabled={actionLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              )}
              {tenant.status === "ATIVO" && (
                <Button variant="destructive" onClick={() => handleStatusChange("SUSPENSO")} disabled={actionLoading}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Suspender
                </Button>
              )}
              {tenant.status === "SUSPENSO" && (
                <Button onClick={() => handleStatusChange("ATIVO")} disabled={actionLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reativar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-600" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{tenant.responsavel}</p>
                <p className="text-sm text-muted-foreground">Responsável</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{tenant.email}</p>
                <p className="text-sm text-muted-foreground">Email</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{tenant.telefone}</p>
                <p className="text-sm text-muted-foreground">Telefone</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {endereco.logradouro}, {endereco.numero}
                  {endereco.complemento ? ` - ${endereco.complemento}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {endereco.bairro}, {endereco.cidade} - {endereco.estado}, {endereco.cep}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {format(new Date(tenant.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-sm text-muted-foreground">Data de cadastro</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-teal-50">
                <FileText className="h-6 w-6 text-teal-600 mb-2" />
                <p className="text-2xl font-bold">{tenant._count?.pops ?? 0}</p>
                <p className="text-sm text-muted-foreground">POPs</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50">
                <Users className="h-6 w-6 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{tenant._count?.colaboradores ?? 0}</p>
                <p className="text-sm text-muted-foreground">Colaboradores</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50">
                <GraduationCap className="h-6 w-6 text-emerald-600 mb-2" />
                <p className="text-2xl font-bold">{tenant._count?.treinamentos ?? 0}</p>
                <p className="text-sm text-muted-foreground">Treinamentos</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50">
                <User className="h-6 w-6 text-purple-600 mb-2" />
                <p className="text-2xl font-bold">{tenant._count?.users ?? 0}</p>
                <p className="text-sm text-muted-foreground">Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Result Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Farmácia Aprovada!
            </DialogTitle>
            <DialogDescription>
              As credenciais de acesso foram enviadas por email e também estão disponíveis abaixo:
            </DialogDescription>
          </DialogHeader>
          {approvalResult && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(approvalResult.email)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-mono">{approvalResult.email}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Senha temporária:</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(approvalResult.tempPassword)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-mono">{approvalResult.tempPassword}</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-800">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Guarde essas informações em local seguro. A senha temporária não poderá ser visualizada novamente.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setApprovalDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
