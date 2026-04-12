"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  GraduationCap,
  Award,
  TrendingUp,
  Target,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import toast from "react-hot-toast";
import Link from "next/link";

interface ColabProgress {
  id: string;
  nome: string;
  funcao: string;
  totalPops: number;
  popsTreinados: number;
  popsConcluidos: number;
  percentual: number;
  mediaQuiz: number | null;
}

interface SetorProgress {
  setor: string;
  totalPops: number;
  treinamentosRealizados: number;
  treinamentosConcluidos: number;
  colaboradoresTreinados: number;
  percentual: number;
}

interface Resumo {
  totalPops: number;
  totalColaboradores: number;
  totalTreinamentos: number;
  totalConcluidos: number;
  taxaConclusao: number;
  mediaGeralQuiz: number;
  colabsCompletos: number;
}

const TEAL_SHADES = [
  "#0d9488",
  "#14b8a6",
  "#2dd4bf",
  "#5eead4",
  "#99f6e4",
  "#0f766e",
  "#115e59",
  "#134e4a",
  "#0d9488",
  "#14b8a6",
  "#2dd4bf",
  "#5eead4",
];

function getProgressColor(pct: number) {
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 50) return "text-amber-600";
  return "text-red-500";
}

function getProgressBadge(pct: number) {
  if (pct >= 80) return { variant: "success" as const, label: "Excelente" };
  if (pct >= 50) return { variant: "warning" as const, label: "Em progresso" };
  return { variant: "destructive" as const, label: "Aten\u00e7\u00e3o" };
}

export default function ProgressoPage() {
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [colaboradores, setColaboradores] = useState<ColabProgress[]>([]);
  const [setores, setSetores] = useState<SetorProgress[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/progresso");
        const data = await res.json();
        if (data?.resumo) {
          setResumo(data.resumo);
          setColaboradores(data.colaboradores ?? []);
          setSetores(data.setores ?? []);
        }
      } catch {
        toast.error("Erro ao carregar progresso");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!resumo) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum dado de progresso dispon\u00edvel.</p>
      </div>
    );
  }

  const chartData = setores.map((s) => ({
    name: s.setor.length > 25 ? s.setor.substring(0, 22) + "..." : s.setor,
    fullName: s.setor,
    pops: s.totalPops,
    concluidos: s.treinamentosConcluidos,
    percentual: s.percentual,
  }));

  return (
    <div>
      <PageHeader
        title="Progresso LMS"
        description="Acompanhamento do aprendizado e capacita\u00e7\u00e3o dos colaboradores"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Colaboradores</p>
                <p className="text-3xl font-bold">{resumo.totalColaboradores}</p>
              </div>
              <div className="p-3 rounded-full bg-teal-50">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {resumo.colabsCompletos} com 100% conclu\u00eddo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conclus\u00e3o</p>
                <p className="text-3xl font-bold">{resumo.taxaConclusao}%</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-50">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {resumo.totalConcluidos} de {resumo.totalTreinamentos} treinamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">M\u00e9dia Geral Quiz</p>
                <p className="text-3xl font-bold">{resumo.mediaGeralQuiz}%</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Nota m\u00e9dia das avalia\u00e7\u00f5es aprovadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">POPs Ativos</p>
                <p className="text-3xl font-bold">{resumo.totalPops}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-50">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Procedimentos que requerem treinamento
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Sector Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-600" />
              Progresso por Setor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Conclus\u00e3o"]}
                    labelFormatter={(label: string, payload: any[]) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullName ?? label;
                    }}
                  />
                  <Bar dataKey="percentual" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={TEAL_SHADES[idx % TEAL_SHADES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados de setores</p>
            )}
          </CardContent>
        </Card>

        {/* Sector Detail Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-600" />
              Detalhes por Setor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {setores.map((setor) => (
                <div key={setor.setor} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate max-w-[200px]" title={setor.setor}>
                      {setor.setor}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {setor.totalPops} POPs · {setor.colaboradoresTreinados} colab.
                      </span>
                      <span className={`text-sm font-semibold ${getProgressColor(setor.percentual)}`}>
                        {setor.percentual}%
                      </span>
                    </div>
                  </div>
                  <Progress value={setor.percentual} className="h-2" />
                </div>
              ))}
              {setores.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Sem dados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collaborator Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-600" />
            Progresso por Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          {colaboradores.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Colaborador</th>
                    <th className="text-left py-3 px-2 font-medium">Fun\u00e7\u00e3o</th>
                    <th className="text-center py-3 px-2 font-medium">POPs Conclu\u00eddos</th>
                    <th className="text-center py-3 px-2 font-medium">M\u00e9dia Quiz</th>
                    <th className="text-left py-3 px-2 font-medium min-w-[200px]">Progresso</th>
                    <th className="text-center py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {colaboradores.map((colab) => {
                    const badge = getProgressBadge(colab.percentual);
                    return (
                      <tr key={colab.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <Link
                            href={`/dashboard/colaboradores/${colab.id}`}
                            className="font-medium text-teal-700 hover:underline"
                          >
                            {colab.nome}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{colab.funcao}</td>
                        <td className="py-3 px-2 text-center">
                          <span className="font-semibold">{colab.popsConcluidos}</span>
                          <span className="text-muted-foreground"> / {colab.totalPops}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {colab.mediaQuiz != null ? (
                            <span className={`font-semibold ${getProgressColor(colab.mediaQuiz)}`}>
                              {colab.mediaQuiz}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">\u2014</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Progress value={colab.percentual} className="h-2 flex-1" />
                            <span className={`text-sm font-semibold w-10 text-right ${getProgressColor(colab.percentual)}`}>
                              {colab.percentual}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum colaborador ativo encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
