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

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "secondary"; label: string }> = {
  RASCUNHO: { variant: "secondary", label: "Rascunho" },
  ATIVO: { variant: "success", label: "Ativo" },
  ARQUIVADO: { variant: "warning", label: "Arquivado" },
};

export default function PopDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [pop, setPop] = useState<Pop | null>(null);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [popRes, quizRes] = await Promise.all([
          fetch(`/api/pops/${params.id}`),
          fetch(`/api/quizzes/by-pop/${params.id}`),
        ]);
        const popData = await popRes.json();
        const quizData = await quizRes.json();
        if (popData?.pop) setPop(popData.pop);
        if (quizData?.quiz) setQuiz(quizData.quiz);
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
