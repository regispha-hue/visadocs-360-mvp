"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { FileText, Users, GraduationCap } from "lucide-react";
import { FUNCOES_LABELS } from "@/lib/types";

interface ReportsChartsProps {
  popsBySetor: { setor: string; _count: number }[];
  popsByStatus: { status: string; _count: number }[];
  colaboradoresByFuncao: { funcao: string; _count: number }[];
  treinamentosByStatus: { status: string; _count: number }[];
}

const COLORS = ["#0D9488", "#1E40AF", "#059669", "#7C3AED", "#DB2777"];
const STATUS_COLORS: Record<string, string> = { RASCUNHO: "#6B7280", ATIVO: "#10B981", ARQUIVADO: "#F59E0B", PENDENTE: "#F59E0B", CONCLUIDO: "#10B981" };
const STATUS_LABELS: Record<string, string> = { RASCUNHO: "Rascunho", ATIVO: "Ativo", ARQUIVADO: "Arquivado", PENDENTE: "Pendente", CONCLUIDO: "Concluído" };

export function ReportsCharts({ popsBySetor, popsByStatus, colaboradoresByFuncao, treinamentosByStatus }: ReportsChartsProps) {
  const popsBySetorData = (popsBySetor ?? []).map((i) => ({ name: i?.setor ?? "N/A", value: i?._count ?? 0 }));
  const popsByStatusData = (popsByStatus ?? []).map((i) => ({ name: STATUS_LABELS[i?.status] ?? i?.status, value: i?._count ?? 0, color: STATUS_COLORS[i?.status] ?? "#6B7280" }));
  const colaboradoresData = (colaboradoresByFuncao ?? []).map((i) => ({ name: FUNCOES_LABELS[i?.funcao] ?? i?.funcao, value: i?._count ?? 0 }));
  const treinamentosData = (treinamentosByStatus ?? []).map((i) => ({ name: STATUS_LABELS[i?.status] ?? i?.status, value: i?._count ?? 0, color: STATUS_COLORS[i?.status] ?? "#6B7280" }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-teal-600" />POPs por Setor</CardTitle></CardHeader><CardContent>{(popsBySetorData?.length ?? 0) === 0 ? <div className="flex items-center justify-center h-[250px] text-muted-foreground">Nenhum dado</div> : <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={popsBySetorData} layout="vertical" margin={{ left: 80, right: 20 }}><XAxis type="number" tickLine={false} tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" tickLine={false} tick={{ fontSize: 11 }} width={75} /><Tooltip contentStyle={{ fontSize: 11 }} /><Bar dataKey="value" fill="#0D9488" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-teal-600" />POPs por Status</CardTitle></CardHeader><CardContent>{(popsByStatusData?.length ?? 0) === 0 ? <div className="flex items-center justify-center h-[250px] text-muted-foreground">Nenhum dado</div> : <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={popsByStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{popsByStatusData?.map((e, i) => <Cell key={i} fill={e?.color} />)}</Pie><Tooltip /><Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" />Colaboradores por Função</CardTitle></CardHeader><CardContent>{(colaboradoresData?.length ?? 0) === 0 ? <div className="flex items-center justify-center h-[250px] text-muted-foreground">Nenhum dado</div> : <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={colaboradoresData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ value }) => value}>{colaboradoresData?.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-emerald-600" />Treinamentos por Status</CardTitle></CardHeader><CardContent>{(treinamentosData?.length ?? 0) === 0 ? <div className="flex items-center justify-center h-[250px] text-muted-foreground">Nenhum dado</div> : <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={treinamentosData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{treinamentosData?.map((e, i) => <Cell key={i} fill={e?.color} />)}</Pie><Tooltip /><Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div>}</CardContent></Card>
    </div>
  );
}
