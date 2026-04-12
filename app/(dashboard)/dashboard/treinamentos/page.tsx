"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Plus, Eye, Edit, CheckCircle, ClipboardList, Award, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { TreinamentoFormDialog } from "./_components/treinamento-form-dialog";

interface Treinamento {
  id: string;
  dataTreinamento: string;
  instrutor: string;
  duracao?: number;
  notaQuiz?: number;
  aprovadoQuiz?: boolean;
  status: string;
  pop: { id: string; codigo: string; titulo: string };
  colaborador: { id: string; nome: string; funcao: string };
}

export default function TreinamentosPage() {
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTreinamento, setEditingTreinamento] = useState<Treinamento | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  const fetchTreinamentos = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const res = await fetch(`/api/treinamentos?${params.toString()}`);
      const data = await res.json();
      if (data?.treinamentos) {
        setTreinamentos(data.treinamentos);
      }
    } catch (error) {
      toast.error("Erro ao carregar treinamentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreinamentos();
  }, [statusFilter]);

  const handleComplete = async (treinamento: Treinamento) => {
    try {
      const res = await fetch(`/api/treinamentos/${treinamento.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONCLUIDO" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Treinamento marcado como concluído!");
      fetchTreinamentos();
    } catch (error) {
      toast.error("Erro ao atualizar treinamento");
    }
  };

  const handleDownloadCertificado = async (treinamentoId: string) => {
    setDownloadingCertId(treinamentoId);
    try {
      // First get the tentativa for this treinamento
      const tentRes = await fetch(`/api/treinamentos/${treinamentoId}/tentativas`);
      const tentData = await tentRes.json();
      const aprovada = tentData?.tentativas?.find((t: any) => t.aprovado);
      if (!aprovada) {
        toast.error("Nenhuma tentativa aprovada encontrada");
        return;
      }
      const res = await fetch(`/api/certificados/${aprovada.id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro" }));
        throw new Error(err.error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificado.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificado baixado!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao baixar certificado");
    } finally {
      setDownloadingCertId(null);
    }
  };

  const columns = [
    {
      key: "dataTreinamento",
      header: "Data",
      render: (item: Treinamento) =>
        item?.dataTreinamento
          ? format(new Date(item.dataTreinamento), "dd/MM/yyyy", { locale: ptBR })
          : "N/A",
    },
    {
      key: "pop",
      header: "POP",
      render: (item: Treinamento) => (
        <div>
          <p className="font-mono font-medium text-teal-600">{item?.pop?.codigo ?? "N/A"}</p>
          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
            {item?.pop?.titulo ?? "N/A"}
          </p>
        </div>
      ),
    },
    {
      key: "colaborador",
      header: "Colaborador",
      render: (item: Treinamento) => (
        <div>
          <p className="font-medium">{item?.colaborador?.nome ?? "N/A"}</p>
          <p className="text-sm text-muted-foreground">{item?.colaborador?.funcao ?? "N/A"}</p>
        </div>
      ),
    },
    {
      key: "instrutor",
      header: "Instrutor",
    },
    {
      key: "duracao",
      header: "Duração",
      render: (item: Treinamento) => item?.duracao ? `${item.duracao}h` : "-",
    },
    {
      key: "notaQuiz",
      header: "Nota Quiz",
      render: (item: Treinamento) => {
        if (item?.notaQuiz == null) return <span className="text-muted-foreground text-sm">-</span>;
        return (
          <span className={`font-semibold ${item.aprovadoQuiz ? "text-emerald-600" : "text-red-500"}`}>
            {item.notaQuiz.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (item: Treinamento) => {
        const variants: Record<string, "success" | "warning" | "secondary"> = {
          CONCLUIDO: "success",
          EM_AVALIACAO: "secondary",
          PENDENTE: "warning",
        };
        const labels: Record<string, string> = {
          CONCLUIDO: "Concluído",
          EM_AVALIACAO: "Em Avaliação",
          PENDENTE: "Pendente",
        };
        return (
          <Badge variant={variants[item?.status] || "warning"}>
            {labels[item?.status] || item?.status}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Ações",
      render: (item: Treinamento) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingTreinamento(item);
              setDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {(item?.status === "PENDENTE" || item?.status === "EM_AVALIACAO") && (
            <Link href={`/dashboard/treinamentos/quiz/${item.id}`}>
              <Button variant="ghost" size="icon" title="Fazer Prova">
                <ClipboardList className="h-4 w-4 text-teal-600" />
              </Button>
            </Link>
          )}
          {item?.status === "PENDENTE" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleComplete(item)}
              title="Marcar como concluído (sem quiz)"
            >
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </Button>
          )}
          {item?.status === "CONCLUIDO" && item?.aprovadoQuiz && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownloadCertificado(item.id)}
              title="Baixar Microcertificado"
              disabled={downloadingCertId === item.id}
            >
              {downloadingCertId === item.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
              ) : (
                <Award className="h-4 w-4 text-amber-500" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Treinamentos"
        description="Registre e acompanhe os treinamentos da equipe"
      >
        <Button onClick={() => { setEditingTreinamento(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Treinamento
        </Button>
      </PageHeader>

      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="PENDENTE">Pendentes</SelectItem>
            <SelectItem value="EM_AVALIACAO">Em Avaliação</SelectItem>
            <SelectItem value="CONCLUIDO">Concluídos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={treinamentos}
        columns={columns}
        searchKey="instrutor"
        searchPlaceholder="Buscar por instrutor..."
        emptyMessage="Nenhum treinamento encontrado"
      />

      <TreinamentoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        treinamento={editingTreinamento}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingTreinamento(null);
          fetchTreinamentos();
        }}
      />
    </div>
  );
}
