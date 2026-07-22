"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface TrilhaItem {
  id: string;
  status: string;
  situacao: "pendente" | "andamento" | "concluido" | "atrasado" | "vencido";
  validade?: string | null;
  diasParaVencer?: number | null;
  colaborador?: { nome: string };
  pop: { codigo: string; titulo: string };
}

interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  criadoEm: string;
}

const situacaoLabel: Record<string, string> = {
  pendente: "Pendente",
  andamento: "Em andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  vencido: "Vencido",
};

export default function MinhaTrilhaPage() {
  const [items, setItems] = useState<TrilhaItem[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [resumo, setResumo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [trilhaRes, alertasRes] = await Promise.all([
          fetch("/api/treinamentos/trilha"),
          fetch("/api/alertas"),
        ]);
        if (!trilhaRes.ok || !alertasRes.ok) throw new Error("Erro");
        const trilha = await trilhaRes.json();
        const alerts = await alertasRes.json();
        setItems(trilha.items || []);
        setResumo(trilha.resumo || {});
        setAlertas(alerts.alertas || []);
      } catch {
        toast.error("Não foi possível carregar sua trilha.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha Trilha de Aprendizagem"
        description="Pendências, treinamentos concluídos e vencimentos de certificados"
      />

      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Minha rotina de treinamento
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Use esta página para acompanhar seus treinamentos e prazos de certificação
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Aqui você vê quais treinamentos estão pendentes, em andamento, concluídos ou atrasados. A trilha ajuda a
              priorizar o que precisa ser feito primeiro, acompanhar o avanço da sua capacitação e manter seus certificados
              atualizados para as rotinas da farmácia.
            </p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 text-sm text-gray-600 shadow-sm md:max-w-xs">
            <strong className="block text-gray-900">Como usar</strong>
            Observe os cartões de resumo e abra os itens da lista para iniciar ou continuar treinamentos, realizar quizzes
            e confirmar pendências antes do vencimento.
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Pendentes" value={resumo.pendentes || 0} icon={<Clock className="h-4 w-4" />} />
        <Metric label="Em andamento" value={resumo.andamento || 0} icon={<GraduationCap className="h-4 w-4" />} />
        <Metric label="Concluídos" value={resumo.concluidos || 0} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Metric label="Atrasados" value={resumo.atrasados || 0} icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      {alertas.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 font-medium text-amber-900">Alertas de treinamento</p>
          <div className="space-y-2">
            {alertas.slice(0, 5).map((alerta) => (
              <p key={alerta.id} className="text-sm text-amber-900">{alerta.mensagem}</p>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">Carregando trilha...</Card>
        ) : items.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">Nenhum treinamento encontrado.</Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <GraduationCap className="h-5 w-5 text-teal-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.pop.codigo} - {item.pop.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.validade ? `Validade: ${new Date(item.validade).toLocaleDateString("pt-BR")}` : "Sem certificado emitido"}
                  </p>
                </div>
                <Badge variant={item.situacao === "atrasado" || item.situacao === "vencido" ? "destructive" : item.situacao === "concluido" ? "success" : "secondary"}>
                  {situacaoLabel[item.situacao] || item.situacao}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="text-teal-600">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}

