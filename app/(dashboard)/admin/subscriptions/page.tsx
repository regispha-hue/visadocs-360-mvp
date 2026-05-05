"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CreditCard,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  canceledAt: string | null;
  stripeSubscriptionId: string | null;
  plan: {
    name: string;
    priceMonthly: number;
    priceYearly: number;
  };
  tenant: {
    id: string;
    nome: string;
    cnpj: string;
    email: string;
    status: string;
  };
  _count: {
    payments: number;
  };
}

interface Metrics {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  canceled: number;
  mrr: number;
  arr: number;
  trialExpiringSoon: number;
}

export default function AdminSubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user && (session.user as any).role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchSubscriptions();
  }, [session, status, router]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/subscriptions");
      if (!response.ok) throw new Error("Erro ao carregar");
      
      const data = await response.json();
      setSubscriptions(data.subscriptions);
      setMetrics(data.metrics);
    } catch (error) {
      toast.error("Erro ao carregar assinaturas");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string, immediate: boolean = false) => {
    if (!confirm(`Deseja ${immediate ? "cancelar imediatamente" : "agendar cancelamento"} desta assinatura?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/subscriptions/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Cancelado pelo administrador",
          cancelImmediately: immediate,
        }),
      });

      if (!response.ok) throw new Error("Erro ao cancelar");

      toast.success(immediate ? "Assinatura cancelada" : "Cancelamento agendado");
      fetchSubscriptions();
    } catch (error) {
      toast.error("Erro ao cancelar assinatura");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: any }> = {
      ATIVO: { variant: "default", icon: CheckCircle },
      TRIAL: { variant: "secondary", icon: Clock },
      SUSPENSO: { variant: "destructive", icon: AlertTriangle },
      CANCELADO: { variant: "outline", icon: XCircle },
      PENDENTE: { variant: "warning", icon: Clock },
    };

    const config = variants[status] || variants.PENDENTE;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.tenant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.tenant.cnpj.includes(searchTerm) ||
      sub.plan.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-teal-600" />
          Gestão de Assinaturas
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie planos, assinaturas e pagamentos
        </p>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metrics.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita mensal recorrente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metrics.arr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita anual recorrente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.trial} em trial · {metrics.suspended} suspensas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.trialExpiringSoon} trials expiram em 7 dias
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por farmácia, CNPJ ou plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "ATIVO" ? "default" : "outline"}
                onClick={() => setStatusFilter("ATIVO")}
                size="sm"
              >
                Ativas
              </Button>
              <Button
                variant={statusFilter === "TRIAL" ? "default" : "outline"}
                onClick={() => setStatusFilter("TRIAL")}
                size="sm"
              >
                Trial
              </Button>
              <Button
                variant={statusFilter === "SUSPENSO" ? "default" : "outline"}
                onClick={() => setStatusFilter("SUSPENSO")}
                size="sm"
              >
                Suspensas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmácia</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Pagamentos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Filter className="h-8 w-8" />
                      <p>Nenhuma assinatura encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.tenant.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          CNPJ: {sub.tenant.cnpj}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.plan.name}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sub.billingCycle}</Badge>
                    </TableCell>
                    <TableCell>
                      R${" "}
                      {sub.billingCycle === "MENSAL"
                        ? sub.plan.priceMonthly.toFixed(2)
                        : (sub.plan.priceYearly / 12).toFixed(2)}
                      /mês
                    </TableCell>
                    <TableCell>
                      {format(new Date(sub.startDate), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>{sub._count.payments}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/subscriptions/${sub.id}`)
                            }
                          >
                            Ver detalhes
                          </DropdownMenuItem>
                          {sub.status !== "CANCELADO" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleCancel(sub.id, false)}
                              >
                                Agendar cancelamento
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancel(sub.id, true)}
                                className="text-red-600"
                              >
                                Cancelar imediatamente
                              </DropdownMenuItem>
                            </>
                          )}
                          {sub.stripeSubscriptionId && (
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  `https://dashboard.stripe.com/subscriptions/${sub.stripeSubscriptionId}`,
                                  "_blank"
                                )
                              }
                            >
                              Ver no Stripe
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {filteredSubscriptions.length} de {subscriptions.length}{" "}
        assinaturas
      </div>
    </div>
  );
}
