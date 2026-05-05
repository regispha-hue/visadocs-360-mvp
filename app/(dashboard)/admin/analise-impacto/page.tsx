"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Analise {
  popId: string;
  popCodigo: string;
  popTitulo: string;
  popSetor: string;
  score: number;
  nivel: "CRITICO" | "ALTO" | "MEDIO" | "BAIXO" | "NENHUM";
  motivos: string[];
  acoes: string[];
}

export default function AnaliseImpactoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [norma, setNorma] = useState({
    numero: "",
    titulo: "",
    categorias: "",
  });

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleAnalisar = async () => {
    if (!norma.numero || !norma.titulo) {
      toast.error("Preencha número e título da norma");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/analise-impacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          normaNumero: norma.numero,
          normaTitulo: norma.titulo,
          normaCategorias: norma.categorias.split(",").map((c) => c.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error("Erro na análise");

      const data = await response.json();
      setAnalises(data.analises);
      setEstatisticas(data.estatisticas);
      toast.success("Análise concluída!");
    } catch (error) {
      toast.error("Erro ao realizar análise");
    } finally {
      setLoading(false);
    }
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case "CRITICO":
        return "bg-red-100 text-red-800 border-red-300";
      case "ALTO":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIO":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "BAIXO":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case "CRITICO":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "ALTO":
        return <Activity className="h-4 w-4 text-orange-600" />;
      case "MEDIO":
        return <BarChart3 className="h-4 w-4 text-yellow-600" />;
      case "BAIXO":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8 text-teal-600" />
          Análise de Impacto POP
        </h1>
        <p className="text-muted-foreground mt-2">
          Avalie o impacto de novas normas nos seus POPs
        </p>
      </div>

      {/* Formulário de Análise */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Nova Análise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Número da Norma</label>
              <Input
                placeholder="Ex: RDC 876/2024"
                value={norma.numero}
                onChange={(e) => setNorma({ ...norma, numero: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Título da norma regulatória"
                value={norma.titulo}
                onChange={(e) => setNorma({ ...norma, titulo: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Categorias (separadas por vírgula)</label>
            <Input
              placeholder="Ex: Manipulação, Qualidade, Estéril"
              value={norma.categorias}
              onChange={(e) => setNorma({ ...norma, categorias: e.target.value })}
            />
          </div>
          <Button onClick={handleAnalisar} disabled={loading} className="w-full">
            {loading ? (
              <>Analisando...</>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Analisar Impacto nos POPs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-600">Crítico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {estatisticas.critico}
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-600">Alto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {estatisticas.alto}
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-600">Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {estatisticas.medio}
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-600">Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {estatisticas.baixo}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total POPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{estatisticas.totalPops}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultados */}
      {analises.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Resultados da Análise</h2>
          {analises
            .filter((a) => a.nivel !== "NENHUM")
            .map((analise) => (
              <Card
                key={analise.popId}
                className={`border-l-4 ${getNivelColor(analise.nivel).replace(
                  "bg-",
                  "border-"
                )}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getNivelIcon(analise.nivel)}
                        <Badge className={getNivelColor(analise.nivel)}>
                          {analise.nivel} ({analise.score}%)
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {analise.popCodigo}
                        </span>
                      </div>
                      <h3 className="font-semibold">{analise.popTitulo}</h3>
                      <p className="text-sm text-muted-foreground">
                        Setor: {analise.popSetor}
                      </p>

                      <div className="mt-3">
                        <p className="text-sm font-medium">Motivos:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {analise.motivos.map((motivo, i) => (
                            <li key={i}>{motivo}</li>
                          ))}
                        </ul>
                      </div>

                      {analise.acoes.length > 0 && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium text-red-600">
                            Ações Recomendadas:
                          </p>
                          <ul className="text-sm list-disc list-inside mt-1">
                            {analise.acoes.map((acao, i) => (
                              <li key={i}>{acao}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Progress value={analise.score} className="mt-4" />
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
