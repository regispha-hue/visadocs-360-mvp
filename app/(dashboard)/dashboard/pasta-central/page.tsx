"use client";

import { useEffect, useState } from "react";
import { Award, ClipboardList, FileText, Printer, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function PastaCentralPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/gestao/pasta-central");
        if (!res.ok) throw new Error("Erro");
        setData(await res.json());
      } catch {
        toast.error("Não foi possível carregar a pasta central.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Card className="p-6 text-sm text-muted-foreground">Carregando pasta central...</Card>;
  if (!data) return <Card className="p-6 text-sm text-muted-foreground">Dados indisponíveis.</Card>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pasta Central de Gestão"
        description="Evidências consolidadas para RT, administração e fiscalização"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Metric icon={<FileText className="h-4 w-4" />} label="POPs vigentes" value={data.resumo?.popsVigentes || 0} />
        <Metric icon={<Award className="h-4 w-4" />} label="Certificados" value={data.resumo?.certificados || 0} />
        <Metric icon={<ClipboardList className="h-4 w-4" />} label="Treinamentos concluídos" value={data.resumo?.treinamentosConcluidos || 0} />
        <Metric icon={<ShieldAlert className="h-4 w-4" />} label="NC abertas" value={data.resumo?.naoConformidadesAbertas || 0} />
      </div>

      <Card className="p-4">
        <p className="mb-3 font-medium">Certificados por colaborador</p>
        <div className="space-y-2">
          {(data.certificadosPorColaborador || []).slice(0, 20).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">{item.nome}</span>
              <div className="flex gap-2">
                <Badge variant="secondary">{item.total} certificados</Badge>
                {item.vencidos > 0 && <Badge variant="destructive">{item.vencidos} vencidos</Badge>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-3 font-medium">Impressão controlada recente</p>
        <div className="space-y-2">
          {(data.impressaoControlada || []).slice(0, 10).map((log: any) => (
            <div key={log.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
              <Printer className="h-4 w-4 text-teal-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{log.documento?.code ? `${log.documento.code} - ` : ""}{log.documento?.title}</p>
                <p className="text-xs text-muted-foreground">
                  {log.tipo} · {log.usuarioNome || log.usuarioId} · {new Date(log.criadoEm).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-3 font-medium">Não conformidades recentes</p>
        <div className="space-y-2">
          {(data.naoConformidades?.recentes || []).slice(0, 10).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="truncate text-sm">{item.codigo} - {item.titulo}</span>
              <Badge variant={item.status === "CONCLUIDA" || item.status === "FECHADA" ? "success" : "warning"}>{item.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
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
