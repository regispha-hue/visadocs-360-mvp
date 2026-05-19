"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import { DataTable } from "@/components/data-table";
import {
  FileText,
  ArrowLeft,
  Calendar,
  User,
  Target,
  Download,
  GraduationCap,
  ClipboardList,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";

interface Documento {
  id: string;
  codigo: string;
  titulo: string;
  tipo: string;
  categoria: string;
  versao: string;
}

interface Pop {
  id: string;
  codigo: string;
  titulo: string;
  setor: string;
  versao: string;
  dataRevisao: string;
  responsavel: string;
  objetivo: string;
  descricao: string;
  arquivoUrl?: string;
  arquivoNome?: string;
  arquivoPublic?: boolean;
  status: string;
  treinamentos: {
    id: string;
    dataTreinamento: string;
    instrutor: string;
    status: string;
    colaborador: { id: string; nome: string; funcao: string };
  }[];
  documentos?: Documento[];
}

interface HistoryVersion {
  id: string;
  version: string;
  status: string;
  approvedAt?: string;
  obsoleteAt?: string | null;
}

interface HistoryTraining {
  id: string;
  status: string;
  dataTreinamento?: string | null;
  approvedPopVersionId?: string | null;
  popVersaoSnapshot?: string | null;
  colaborador?: { id: string; nome: string } | null;
}

interface HistoryEvent {
  id: string;
  action: string;
  statusFrom?: string | null;
  statusTo?: string | null;
  version?: string | null;
  userName?: string | null;
  occurredAt: string;
}

interface PopHistory {
  versions?: HistoryVersion[];
  events?: HistoryEvent[];
  trainings?: HistoryTraining[];
}

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "secondary"; label: string }> = {
  RASCUNHO: { variant: "secondary", label: "Rascunho" },
  EM_REVISAO: { variant: "warning", label: "Em revisão pelo RT" },
  REJEITADO: { variant: "warning", label: "Rejeitado pelo RT" },
  APROVADO: { variant: "success", label: "Aprovado pelo RT" },
  VIGENTE: { variant: "success", label: "Vigente para uso interno" },
  OBSOLETO: { variant: "secondary", label: "Obsoleto" },
  ATIVO: { variant: "success", label: "Ativo" },
  ARQUIVADO: { variant: "warning", label: "Arquivado" },
};

export default function PopDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [pop, setPop] = useState<Pop | null>(null);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [history, setHistory] = useState<PopHistory | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [popRes, quizRes, historyRes, sessionRes] = await Promise.all([
          fetch(`/api/pops/${params.id}`),
          fetch(`/api/quizzes/by-pop/${params.id}`),
          fetch(`/api/pops/${params.id}/history`),
          fetch("/api/auth/session"),
        ]);
        const popData = await popRes.json();
        const quizData = await quizRes.json();
        const historyData = await historyRes.json();
        const sessionData = await sessionRes.json();
        if (popData?.pop) setPop(popData.pop);
        if (quizData?.quiz) setQuiz(quizData.quiz);
        if (historyData) setHistory(historyData);
        setCurrentRole(sessionData?.user?.role || null);
      } catch (error) {
        toast.error("Erro ao carregar POP");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleDownload = async () => {
    if (!pop?.arquivoUrl) return;
    try {
      const res = await fetch(`/api/pops/${pop.id}/download`);
      const data = await res.json();
      if (data?.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = pop.arquivoNome || pop.codigo + ".pdf";
        a.click();
      }
    } catch (error) {
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handleRtDecision = async (decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED") => {
    if (!pop) return;
    setDeciding(true);
    try {
      const res = await fetch(`/api/pops/${pop.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          version: pop.versao || "1.0",
          comment: "Decisão registrada pela tela de revisão do RT.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao registrar decisão");
      setPop(data.pop);
      toast.success("Decisão do RT registrada");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao registrar decisão");
    } finally {
      setDeciding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!pop) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">POP não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const statusBadge = STATUS_BADGES[pop.status] ?? { variant: "secondary", label: pop.status };
  const historyVersions = history?.versions ?? [];
  const historyTrainings = history?.trainings ?? [];
  const currentApprovedVersion = historyVersions.find((version) => version.status === "CURRENT") ?? historyVersions[0];
  const affectedTrainingGroups = historyVersions
    .filter((version) => version.status === "OBSOLETE")
    .map((version) => ({
      version,
      trainings: historyTrainings.filter((training) => training.approvedPopVersionId === version.id),
    }))
    .filter((group) => group.trainings.length > 0);

  const treinamentoColumns = [
    {
      key: "colaborador",
      header: "Colaborador",
      render: (item: any) => (
        <div>
          <p className="font-medium">{item?.colaborador?.nome ?? "N/A"}</p>
          <p className="text-sm text-muted-foreground">{item?.colaborador?.funcao ?? "N/A"}</p>
        </div>
      ),
    },
    {
      key: "dataTreinamento",
      header: "Data",
      render: (item: any) =>
        item?.dataTreinamento
          ? format(new Date(item.dataTreinamento), "dd/MM/yyyy", { locale: ptBR })
          : "N/A",
    },
    {
      key: "instrutor",
      header: "Instrutor",
    },
    {
      key: "status",
      header: "Status",
      render: (item: any) => (
        <Badge variant={item?.status === "CONCLUIDO" ? "success" : "warning"}>
          {item?.status === "CONCLUIDO" ? "Concluído" : "Pendente"}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={pop.codigo} description={pop.titulo}>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        {pop.arquivoUrl && (
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Arquivo
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Informações do POP
              </CardTitle>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-teal-600" />
                Objetivo
              </h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{pop.objetivo}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Descrição/Procedimento</h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{pop.descricao}</p>
              </div>
            </div>

            {["RASCUNHO", "EM_REVISAO", "REJEITADO"].includes(pop.status) && (
              <div className="p-3 rounded-lg border bg-amber-50 text-sm text-amber-900">
                Este POP permanece como minuta ou artefato auxiliar até revisão e aprovação do Responsável Técnico.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50">
                <FileText className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Setor</p>
                <p className="font-medium">{pop.setor}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsável</p>
                <p className="font-medium">{pop.responsavel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Versão / Revisão</p>
                <p className="font-medium">
                  {pop.versao} - {format(new Date(pop.dataRevisao), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Treinamentos</p>
                <p className="font-medium">{pop.treinamentos?.length ?? 0} realizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentRole === "RT" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-teal-600" />
              Revisão do Responsável Técnico
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button disabled={deciding} onClick={() => handleRtDecision("APPROVED")}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovar versão
            </Button>
            <Button variant="outline" disabled={deciding} onClick={() => handleRtDecision("CHANGES_REQUESTED")}>
              Solicitar ajustes
            </Button>
            <Button variant="destructive" disabled={deciding} onClick={() => handleRtDecision("REJECTED")}>
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Histórico documental</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(history?.events || []).slice(0, 8).map((event) => (
            <div key={event.id} className="flex items-start justify-between gap-4 border-b pb-2 text-sm">
              <div>
                <p className="font-medium">{event.action}</p>
                <p className="text-muted-foreground">
                  {event.statusFrom || "início"} → {event.statusTo || "registro"} · versão {event.version || "N/A"}
                </p>
              </div>
              <div className="text-right text-muted-foreground">
                <p>{event.userName || "Sistema"}</p>
                <p>{format(new Date(event.occurredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
              </div>
            </div>
          ))}
          {(!history?.events || history.events.length === 0) && (
            <p className="text-sm text-muted-foreground">Nenhum evento documental registrado ainda.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-600" />
            Treinamentos afetados por versão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {affectedTrainingGroups.map(({ version, trainings }) => (
            <div key={version.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">Versão {version.version}</p>
                  <p className="text-sm text-muted-foreground">
                    Obsoleta{version.obsoleteAt ? ` em ${format(new Date(version.obsoleteAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}` : ""}
                    {currentApprovedVersion?.id && currentApprovedVersion.id !== version.id
                      ? ` · substituída pela versão ${currentApprovedVersion.version}`
                      : ""}
                  </p>
                </div>
                <Badge variant="secondary">Registro interno histórico</Badge>
              </div>

              <div className="mt-3 space-y-2">
                {trainings.map((training) => (
                  <div key={training.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 p-3 text-sm">
                    <div>
                      <p className="font-medium">{training.colaborador?.nome || "Colaborador não informado"}</p>
                      <p className="text-muted-foreground">
                        Treinamento vinculado à versão {training.popVersaoSnapshot || version.version}
                      </p>
                    </div>
                    <div className="text-right text-muted-foreground">
                      <p>{training.status === "CONCLUIDO" ? "Concluído" : "Pendente"}</p>
                      <p>
                        {training.dataTreinamento
                          ? format(new Date(training.dataTreinamento), "dd/MM/yyyy", { locale: ptBR })
                          : "Data não informada"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {affectedTrainingGroups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum treinamento interno vinculado a versões obsoletas deste POP.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quiz */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              Quiz / Avaliação
            </CardTitle>
            <Link href={`/dashboard/pops/${pop.id}/quiz`}>
              <Button variant={quiz ? "outline" : "default"} size="sm">
                {quiz ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Quiz
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Quiz
                  </>
                )}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {quiz ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant={quiz.ativo ? "success" : "secondary"}>
                  {quiz.ativo ? "Ativo" : "Inativo"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {quiz.questoes?.length ?? 0} questão(ões) · Nota mínima: {quiz.notaMinima}%
                </span>
              </div>
              <p className="font-medium">{quiz.titulo}</p>
              {quiz.descricao && (
                <p className="text-sm text-muted-foreground">{quiz.descricao}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {quiz._count?.tentativas ?? 0} tentativa(s) registrada(s)
              </p>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum quiz configurado para este POP.</p>
              <p className="text-sm">Crie um quiz para avaliar o conhecimento dos colaboradores.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos Relacionados */}
      {pop.documentos && pop.documentos.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              Documentos Relacionados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pop.documentos.map((doc) => {
                const tipoBadge = doc.tipo === "RQ"
                  ? { variant: "default" as const, color: "bg-blue-100 text-blue-700" }
                  : doc.tipo === "MBP"
                  ? { variant: "secondary" as const, color: "bg-purple-100 text-purple-700" }
                  : { variant: "outline" as const, color: "bg-gray-100 text-gray-700" };
                return (
                  <div
                    key={doc.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-sm text-teal-700">{doc.codigo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoBadge.color}`}>
                        {doc.tipo}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{doc.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">{doc.versao}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treinamentos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-600" />
            Histórico de Treinamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={pop.treinamentos ?? []}
            columns={treinamentoColumns}
            emptyMessage="Nenhum treinamento registrado para este POP"
          />
        </CardContent>
      </Card>
    </div>
  );
}
