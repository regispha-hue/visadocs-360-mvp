"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Publicacao {
  id: string;
  numero: string;
  titulo: string;
  tipo: string;
  dataPublicacao: string;
  ementa: string;
  urlOficial: string;
  categorias: string[];
  nivelImpacto: number;
  isNew: boolean;
}

export default function AnvisaMonitorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user && (session.user as any).role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchPublicacoes();
  }, [session, status, router]);

  const fetchPublicacoes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/anvisa-monitor");
      if (!response.ok) throw new Error("Erro ao carregar");

      const data = await response.json();
      setPublicacoes(data.publications);
      setLastUpdate(data.lastUpdate);
    } catch (error) {
      toast.error("Erro ao carregar publicações ANVISA");
    } finally {
      setLoading(false);
    }
  };

  const handleSimularNova = async () => {
    try {
      const response = await fetch("/api/anvisa-monitor", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Erro ao simular");

      const data = await response.json();
      toast.success("Nova norma simulada criada!");
      fetchPublicacoes();
    } catch (error) {
      toast.error("Erro ao simular nova norma");
    }
  };

  const getImpactBadge = (nivel: number) => {
    if (nivel >= 5) return { variant: "destructive", label: "CRÍTICO" };
    if (nivel >= 4) return { variant: "default", label: "ALTO" };
    if (nivel >= 3) return { variant: "secondary", label: "MÉDIO" };
    return { variant: "outline", label: "BAIXO" };
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "RDC":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "Portaria":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Carregando publicações...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8 text-teal-600" />
              Monitor ANVISA
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitoramento de publicações e normas regulatórias
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchPublicacoes}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={handleSimularNova} variant="secondary">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Simular Nova Norma
            </Button>
          </div>
        </div>
        {lastUpdate && (
          <p className="text-sm text-muted-foreground mt-2">
            Última atualização: {format(new Date(lastUpdate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novas Publicações</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publicacoes.filter((p) => p.isNew).length}
            </div>
            <p className="text-xs text-muted-foreground">Nos últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impacto Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {publicacoes.filter((p) => p.nivelImpacto >= 5).length}
            </div>
            <p className="text-xs text-muted-foreground">Requer ação imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RDCs</CardTitle>
            <FileText className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publicacoes.filter((p) => p.tipo === "RDC").length}
            </div>
            <p className="text-xs text-muted-foreground">Resoluções publicadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monitorado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publicacoes.length}</div>
            <p className="text-xs text-muted-foreground">Publicações ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Publicações */}
      <div className="space-y-4">
        {publicacoes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhuma publicação encontrada</p>
              <p className="text-sm">Clique em "Atualizar" para buscar novas normas</p>
            </CardContent>
          </Card>
        ) : (
          publicacoes.map((pub) => {
            const impact = getImpactBadge(pub.nivelImpacto);
            return (
              <Card key={pub.id} className={pub.isNew ? "border-blue-500" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTipoIcon(pub.tipo)}
                        <Badge variant="outline">{pub.tipo}</Badge>
                        <Badge variant={impact.variant as any}>{impact.label}</Badge>
                        {pub.isNew && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            NOVO
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{pub.numero}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{pub.titulo}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(pub.urlOficial, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{pub.ementa}</p>

                  <div className="flex flex-wrap gap-2">
                    {pub.categorias.map((cat, i) => (
                      <Badge key={i} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Publicado em {format(new Date(pub.dataPublicacao), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                      <Button size="sm" variant={pub.nivelImpacto >= 4 ? "default" : "outline"}>
                        Criar Alerta
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Instruções */}
      <Card className="mt-8 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Sobre o Monitor ANVISA</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Este monitor verifica automaticamente publicações no Diário Oficial da União (DOU)
            relacionadas à ANVISA.
          </p>
          <p>Tipos de publicações monitoradas:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>RDCs (Resoluções da Diretoria Colegiada)</li>
            <li>Portarias</li>
            <li>Consultas Públicas</li>
            <li>Instruções Normativas</li>
          </ul>
          <p className="mt-2">
            <strong>Nota:</strong> Em produção, esta integração faz scraping real do site IN.gov.br.
            Atualmente está em modo de demonstração.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
