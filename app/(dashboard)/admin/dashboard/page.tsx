"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  GraduationCap,
  Building2,
  CreditCard,
  Bell,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Dashboard do Tenant (reutilizado do dashboard normal)
import PopChart from "@/components/charts/pop-chart";
import TreinamentoChart from "@/components/charts/treinamento-chart";

interface DashboardStats {
  // Admin stats
  totalTenants: number;
  activeSubscriptions: number;
  mrr: number;
  // Tenant stats
  totalPOPs: number;
  totalColaboradores: number;
  treinamentosPendentes: number;
  treinamentosConcluidos: number;
  certificadosValidos: number;
  certificadosExpirados: number;
  alertas: number;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("admin");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user && (session.user as any).role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchStats();
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Buscar stats admin
      const [adminRes, tenantRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/dashboard/stats"),
      ]);

      const adminData = adminRes.ok ? await adminRes.json() : {};
      const tenantData = tenantRes.ok ? await tenantRes.json() : {};

      setStats({
        // Admin
        totalTenants: adminData.totalTenants || 0,
        activeSubscriptions: adminData.activeSubscriptions || 0,
        mrr: adminData.mrr || 0,
        // Tenant
        totalPOPs: tenantData.totalPOPs || 0,
        totalColaboradores: tenantData.totalColaboradores || 0,
        treinamentosPendentes: tenantData.treinamentosPendentes || 0,
        treinamentosConcluidos: tenantData.treinamentosConcluidos || 0,
        certificadosValidos: tenantData.certificadosValidos || 0,
        certificadosExpirados: tenantData.certificadosExpirados || 0,
        alertas: tenantData.alertas || 0,
      });
    } catch (error) {
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Carregando dashboard...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-teal-600" />
          Dashboard Super Admin
        </h1>
        <p className="text-muted-foreground mt-2">
          Visão completa: Administração + Operação do Tenant
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Visão Admin
          </TabsTrigger>
          <TabsTrigger value="tenant" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Visão Tenant
          </TabsTrigger>
        </TabsList>

        {/* VISÃO ADMIN */}
        <TabsContent value="admin" className="space-y-6">
          {/* Stats Admin */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Farmácias</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTenants}</div>
                <p className="text-xs text-muted-foreground">Total cadastradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">Pagamento em dia</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <TrendingUp className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {stats.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Receita mensal recorrente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas ANVISA</CardTitle>
                <Bell className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.alertas}</div>
                <p className="text-xs text-muted-foreground">Novas normas</p>
              </CardContent>
            </Card>
          </div>

          {/* Links Rápidos Admin */}
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/admin/subscriptions">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium">Assinaturas</p>
                      <p className="text-sm text-muted-foreground">Gerenciar planos</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/anvisa-monitor">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Monitor ANVISA</p>
                      <p className="text-sm text-muted-foreground">Normas regulatórias</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/plans">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Planos</p>
                      <p className="text-sm text-muted-foreground">Configurar preços</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        {/* VISÃO TENANT */}
        <TabsContent value="tenant" className="space-y-6">
          {/* Stats Tenant */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">POPs</CardTitle>
                <FileText className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPOPs}</div>
                <p className="text-xs text-muted-foreground">Procedimentos cadastrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalColaboradores}</div>
                <p className="text-xs text-muted-foreground">Ativos no sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Treinamentos</CardTitle>
                <GraduationCap className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.treinamentosConcluidos}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-amber-600">{stats.treinamentosPendentes} pendentes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Certificados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.certificadosValidos}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-red-600">{stats.certificadosExpirados} expirados</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Links Rápidos Tenant */}
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/dashboard/pops">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <FileText className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium">POPs</p>
                      <p className="text-sm text-muted-foreground">Gerenciar procedimentos</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/colaboradores">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Colaboradores</p>
                      <p className="text-sm text-muted-foreground">Equipe e treinamentos</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/treinamentos">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Treinamentos</p>
                      <p className="text-sm text-muted-foreground">Agenda e certificados</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Alertas */}
          {(stats.treinamentosPendentes > 0 || stats.certificadosExpirados > 0) && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Atenção Necessária
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.treinamentosPendentes > 0 && (
                  <p className="text-amber-800">
                    • {stats.treinamentosPendentes} treinamentos pendentes aguardando conclusão
                  </p>
                )}
                {stats.certificadosExpirados > 0 && (
                  <p className="text-amber-800">
                    • {stats.certificadosExpirados} certificados expirados precisam de renovação
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
