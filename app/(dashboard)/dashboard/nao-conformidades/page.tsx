"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, CheckCircle2, Clock, FileWarning, Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type NcItem = {
  id: string;
  codigo: string;
  titulo?: string | null;
  descricao?: string | null;
  setor?: string | null;
  origem?: string | null;
  severidade?: string | null;
  status: string;
  popId?: string | null;
  loteId?: string | null;
  equipamentoId?: string | null;
  colaboradorId?: string | null;
  causaRaiz?: string | null;
  planoAcao?: string | null;
  prazoCorrecao?: string | null;
  prazoImplementacao?: string | null;
  verificacaoEfetividade?: string | null;
  sugestaoTreinamento?: boolean;
  sugestaoRevisaoPop?: boolean;
  comentarios?: Array<{ id: string; texto: string; userName: string; createdAt: string }>;
  historico?: Array<{ action: string; statusFrom?: string; statusTo?: string; userName?: string; at: string }>;
  pop?: { codigo: string; titulo: string; setor?: string | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  ABERTA: "Aberta",
  EM_INVESTIGACAO: "Em investigação",
  CAPA_PLANEJADA: "CAPA planejada",
  EM_IMPLEMENTACAO: "Em implementação",
  FECHADA: "Fechada",
  CANCELADA: "Cancelada",
};

const GRAVIDADE_LABELS: Record<string, string> = {
  CRITICA: "Crítica",
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

const ORIGENS = [
  "AUDITORIA_INTERNA",
  "AUTOINSPECAO",
  "RECLAMACAO",
  "DESVIO_PROCESSO",
  "FISCALIZACAO",
  "TREINAMENTO",
  "OUTRA",
];

function statusLabel(status: string) {
  return STATUS_LABELS[status] || status;
}

function gravidadeLabel(gravidade?: string | null) {
  if (!gravidade) return "Sem gravidade";
  return GRAVIDADE_LABELS[gravidade] || gravidade;
}

function severityClass(gravidade?: string | null) {
  switch (gravidade) {
    case "CRITICA":
      return "bg-red-100 text-red-800 border-red-200";
    case "ALTA":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "MEDIA":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "BAIXA":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Sem prazo";
  return new Date(value).toLocaleDateString("pt-BR");
}

function isOverdue(item: NcItem) {
  if (!item.prazoCorrecao || ["FECHADA", "CANCELADA"].includes(item.status)) return false;
  return new Date(item.prazoCorrecao).getTime() < Date.now();
}

export default function NaoConformidadesPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [items, setItems] = useState<NcItem[]>([]);
  const [stats, setStats] = useState({ total: 0, abertas: 0, criticas: 0, vencidas: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<NcItem | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [gravidade, setGravidade] = useState("TODAS");
  const [actionText, setActionText] = useState("");
  const [actionDate, setActionDate] = useState("");
  const [sugestaoTreinamento, setSugestaoTreinamento] = useState(true);
  const [sugestaoRevisaoPop, setSugestaoRevisaoPop] = useState(true);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    origem: "AUTOINSPECAO",
    gravidade: "MEDIA",
    setor: "",
    popId: "",
    loteId: "",
    equipamentoId: "",
    colaboradorId: "",
  });

  const canClose = user?.role === "RT";

  async function loadData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "TODOS") params.set("status", status);
    if (gravidade !== "TODAS") params.set("gravidade", gravidade);
    const response = await fetch(`/api/nao-conformidades?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Erro ao carregar não conformidades");
      setLoading(false);
      return;
    }
    setItems(data.items || []);
    setStats(data.stats || { total: 0, abertas: 0, criticas: 0, vencidas: 0 });
    if (selected) {
      const refreshed = (data.items || []).find((item: NcItem) => item.id === selected.id);
      setSelected(refreshed || null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, gravidade]);

  const filteredItems = useMemo(() => items, [items]);

  async function createNc() {
    const response = await fetch("/api/nao-conformidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Erro ao abrir NC");
      return;
    }
    toast.success(`${data.item.codigo} aberta`);
    setDialogOpen(false);
    setForm({
      titulo: "",
      descricao: "",
      origem: "AUTOINSPECAO",
      gravidade: "MEDIA",
      setor: "",
      popId: "",
      loteId: "",
      equipamentoId: "",
      colaboradorId: "",
    });
    await loadData();
    setSelected(data.item);
  }

  async function runAction(path: string, body: Record<string, unknown>) {
    if (!selected) return;
    const response = await fetch(`/api/nao-conformidades/${selected.id}/${path}`, {
      method: path === "comentarios" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Erro ao atualizar NC");
      return;
    }
    toast.success("NC atualizada");
    setActionText("");
    setActionDate("");
    setSelected(data.item);
    await loadData();
  }

  function renderActionPanel() {
    if (!selected) return null;

    if (selected.status === "ABERTA") {
      return (
        <ActionBox title="Investigar causa raiz">
          <Textarea value={actionText} onChange={(event) => setActionText(event.target.value)} placeholder="Causa raiz identificada..." />
          <Button onClick={() => runAction("investigar", { causaRaiz: actionText })}>Registrar investigação</Button>
        </ActionBox>
      );
    }

    if (selected.status === "EM_INVESTIGACAO") {
      return (
        <ActionBox title="Planejar CAPA">
          <Textarea value={actionText} onChange={(event) => setActionText(event.target.value)} placeholder="Ação corretiva/preventiva, responsável e evidências esperadas..." />
          <Input type="date" value={actionDate} onChange={(event) => setActionDate(event.target.value)} />
          <Button onClick={() => runAction("planejar-capa", { planoAcao: actionText, prazoImplementacao: actionDate })}>Planejar CAPA</Button>
        </ActionBox>
      );
    }

    if (selected.status === "CAPA_PLANEJADA") {
      const highRisk = selected.severidade === "CRITICA" || selected.severidade === "ALTA";
      return (
        <ActionBox title="Autorizar implementação">
          {highRisk && !canClose && (
            <p className="text-sm text-orange-700">NC crítica/alta exige aprovação do RT para entrar em implementação.</p>
          )}
          <Textarea value={actionText} onChange={(event) => setActionText(event.target.value)} placeholder="Observação da implementação..." />
          <Button disabled={highRisk && !canClose} onClick={() => runAction("implementar", { observacao: actionText })}>
            Iniciar implementação
          </Button>
        </ActionBox>
      );
    }

    if (selected.status === "EM_IMPLEMENTACAO" && !selected.verificacaoEfetividade) {
      return (
        <ActionBox title="Verificar efetividade">
          <Textarea value={actionText} onChange={(event) => setActionText(event.target.value)} placeholder="Evidências de efetividade da CAPA..." />
          <Button onClick={() => runAction("verificar", { verificacaoEfetividade: actionText })}>Registrar efetividade</Button>
        </ActionBox>
      );
    }

    if (selected.status === "EM_IMPLEMENTACAO" && selected.verificacaoEfetividade) {
      return (
        <ActionBox title="Fechar NC">
          {!canClose && <p className="text-sm text-orange-700">Somente RT pode fechar a não conformidade.</p>}
          <Textarea value={actionText} onChange={(event) => setActionText(event.target.value)} placeholder="Comentário final do fechamento..." />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={sugestaoTreinamento} onCheckedChange={(checked) => setSugestaoTreinamento(Boolean(checked))} />
            Sugerir treinamento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={sugestaoRevisaoPop} onCheckedChange={(checked) => setSugestaoRevisaoPop(Boolean(checked))} />
            Sugerir revisão de POP
          </label>
          <Button disabled={!canClose} onClick={() => runAction("fechar", { observacaoFechamento: actionText, sugestaoTreinamento, sugestaoRevisaoPop })}>
            Fechar NC
          </Button>
        </ActionBox>
      );
    }

    return null;
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Não Conformidades e CAPA</h1>
          <p className="text-muted-foreground">Abertura, investigação, plano CAPA, efetividade e fechamento com trilha auditável.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Abrir NC
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova não conformidade</DialogTitle>
              <DialogDescription>Informe a ocorrência e vincule ao menos um POP, lote, equipamento ou colaborador.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <Input placeholder="Título" value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} />
              <Textarea placeholder="Descrição da ocorrência" value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} />
              <div className="grid gap-3 md:grid-cols-3">
                <Select value={form.gravidade} onValueChange={(value) => setForm({ ...form, gravidade: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(GRAVIDADE_LABELS).map((value) => <SelectItem key={value} value={value}>{gravidadeLabel(value)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.origem} onValueChange={(value) => setForm({ ...form, origem: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Setor" value={form.setor} onChange={(event) => setForm({ ...form, setor: event.target.value })} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="ID do POP vinculado" value={form.popId} onChange={(event) => setForm({ ...form, popId: event.target.value })} />
                <Input placeholder="ID do lote" value={form.loteId} onChange={(event) => setForm({ ...form, loteId: event.target.value })} />
                <Input placeholder="ID do equipamento" value={form.equipamentoId} onChange={(event) => setForm({ ...form, equipamentoId: event.target.value })} />
                <Input placeholder="ID do colaborador" value={form.colaboradorId} onChange={(event) => setForm({ ...form, colaboradorId: event.target.value })} />
              </div>
              <Button onClick={createNc}>Salvar abertura</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={FileWarning} label="Total" value={stats.total} />
        <Metric icon={Clock} label="Abertas" value={stats.abertas} />
        <Metric icon={AlertTriangle} label="Críticas" value={stats.criticas} />
        <Metric icon={ShieldCheck} label="Vencidas" value={stats.vencidas} />
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por número, título, setor..." value={q} onChange={(event) => setQ(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadData()} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os status</SelectItem>
            {Object.keys(STATUS_LABELS).map((value) => <SelectItem key={value} value={value}>{statusLabel(value)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={gravidade} onValueChange={setGravidade}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas</SelectItem>
            {Object.keys(GRAVIDADE_LABELS).map((value) => <SelectItem key={value} value={value}>{gravidadeLabel(value)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando não conformidades...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhuma não conformidade encontrada.</div>
            ) : (
              <div className="divide-y">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`w-full px-4 py-3 text-left hover:bg-muted/60 ${selected?.id === item.id ? "bg-teal-50" : ""}`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{item.codigo}</span>
                          <Badge variant="outline" className={severityClass(item.severidade)}>{gravidadeLabel(item.severidade)}</Badge>
                          <Badge variant="outline">{statusLabel(item.status)}</Badge>
                          {isOverdue(item) && <Badge variant="destructive">Vencida</Badge>}
                        </div>
                        <p className="mt-1 font-medium">{item.titulo}</p>
                        <p className="text-sm text-muted-foreground">{item.origem?.replaceAll("_", " ")} {item.pop ? `- ${item.pop.codigo}` : ""}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">Prazo: {formatDate(item.prazoCorrecao)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            {!selected ? (
              <div className="py-16 text-center text-muted-foreground">Selecione uma NC para ver o fluxo CAPA.</div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{selected.codigo}</p>
                      <h2 className="text-xl font-semibold">{selected.titulo}</h2>
                    </div>
                    <Badge variant="outline">{statusLabel(selected.status)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selected.descricao}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Gravidade" value={gravidadeLabel(selected.severidade)} />
                  <Info label="Prazo" value={formatDate(selected.prazoCorrecao)} />
                  <Info label="Origem" value={selected.origem?.replaceAll("_", " ") || "-"} />
                  <Info label="Setor" value={selected.setor || "-"} />
                </div>

                {selected.pop && <Info label="POP vinculado" value={`${selected.pop.codigo} - ${selected.pop.titulo}`} />}
                {selected.causaRaiz && <Info label="Causa raiz" value={selected.causaRaiz} />}
                {selected.planoAcao && <Info label="Plano CAPA" value={selected.planoAcao} />}
                {selected.verificacaoEfetividade && <Info label="Efetividade" value={selected.verificacaoEfetividade} />}

                {renderActionPanel()}

                <ActionBox title="Comentário">
                  <Textarea value={actionText} onChange={(event) => setActionText(event.target.value)} placeholder="Adicionar comentário ao histórico..." />
                  <Button variant="outline" onClick={() => runAction("comentarios", { texto: actionText })}>Comentar</Button>
                </ActionBox>

                {canClose && !["FECHADA", "CANCELADA"].includes(selected.status) && (
                  <Button variant="destructive" onClick={() => runAction("cancelar", { motivo: actionText || "Cancelado pelo RT" })}>
                    Cancelar NC
                  </Button>
                )}

                <div className="space-y-2">
                  <h3 className="font-semibold">Linha do tempo</h3>
                  <div className="space-y-2">
                    {(selected.historico || []).slice().reverse().map((event, index) => (
                      <div key={`${event.at}-${index}`} className="rounded border p-2 text-sm">
                        <div className="font-medium">{event.action}</div>
                        <div className="text-muted-foreground">{event.userName || "Sistema"} - {formatDate(event.at)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-7 w-7 text-teal-600" />
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function ActionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded border p-3">
      <div className="flex items-center gap-2 font-semibold">
        <CheckCircle2 className="h-4 w-4 text-teal-600" />
        {title}
      </div>
      {children}
    </div>
  );
}
