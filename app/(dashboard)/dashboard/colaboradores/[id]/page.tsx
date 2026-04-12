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
  User,
  ArrowLeft,
  Calendar,
  Briefcase,
  Mail,
  Building2,
  GraduationCap,
  FolderOpen,
  FileText,
  Download,
  Award,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import { FUNCOES_LABELS } from "@/lib/types";

interface Colaborador {
  id: string;
  nome: string;
  cpfMasked: string;
  funcao: string;
  setor: string;
  dataAdmissao: string;
  email?: string;
  status: string;
  treinamentos: {
    id: string;
    dataTreinamento: string;
    instrutor: string;
    status: string;
    pop: { id: string; codigo: string; titulo: string; setor: string };
  }[];
}

export default function ColaboradorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPop, setDownloadingPop] = useState<string | null>(null);
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);

  useEffect(() => {
    const fetchColaborador = async () => {
      try {
        const res = await fetch(`/api/colaboradores/${params.id}`);
        const data = await res.json();
        if (data?.colaborador) {
          setColaborador(data.colaborador);
        }
      } catch (error) {
        toast.error("Erro ao carregar colaborador");
      } finally {
        setLoading(false);
      }
    };
    fetchColaborador();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Colaborador não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const concluidos = (colaborador.treinamentos ?? []).filter(
    (t) => t.status === "CONCLUIDO"
  );

  const treinamentoColumns = [
    {
      key: "pop",
      header: "POP",
      render: (item: any) => (
        <div>
          <p className="font-medium font-mono text-teal-600">{item?.pop?.codigo ?? "N/A"}</p>
          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
            {item?.pop?.titulo ?? "N/A"}
          </p>
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
      <PageHeader title={colaborador.nome} description={FUNCOES_LABELS[colaborador.funcao] ?? colaborador.funcao}>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={colaborador.status === "ATIVO" ? "success" : "secondary"}>
                {colaborador.status === "ATIVO" ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{colaborador.cpfMasked}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50">
                <Briefcase className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Função</p>
                <p className="font-medium">{FUNCOES_LABELS[colaborador.funcao] ?? colaborador.funcao}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Setor</p>
                <p className="font-medium">{colaborador.setor}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Admissão</p>
                <p className="font-medium">
                  {format(new Date(colaborador.dataAdmissao), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {colaborador.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Mail className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{colaborador.email}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Treinamentos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-teal-600" />
              Histórico de Treinamentos ({colaborador.treinamentos?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={colaborador.treinamentos ?? []}
              columns={treinamentoColumns}
              emptyMessage="Nenhum treinamento registrado"
            />
          </CardContent>
        </Card>
      </div>

      {/* Pasta Pessoal - POPs Treinados */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-teal-600" />
            Pasta Pessoal — POPs Treinados e Concluídos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Documentos dos POPs que o colaborador já foi treinado e pode consultar
          </p>
        </CardHeader>
        <CardContent>
          {concluidos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhum POP concluído ainda</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {concluidos.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-teal-50 rounded-lg">
                    <FileText className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-teal-700">{t.pop.codigo}</p>
                    <p className="text-sm font-medium truncate">{t.pop.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      Treinado em: {format(new Date(t.dataTreinamento), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {(t as any).tentativasQuiz?.[0]?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const tentativaId = (t as any).tentativasQuiz[0].id;
                          setDownloadingCert(t.id);
                          try {
                            const res = await fetch(`/api/certificados/${tentativaId}`);
                            if (!res.ok) throw new Error("Erro");
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `Certificado_${t.pop.codigo}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch {
                            toast.error("Erro ao baixar certificado");
                          } finally {
                            setDownloadingCert(null);
                          }
                        }}
                        disabled={downloadingCert === t.id}
                        title="Baixar Certificado"
                      >
                        {downloadingCert === t.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Award className="h-4 w-4 text-amber-500" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setDownloadingPop(t.pop.id);
                        try {
                          const res = await fetch(`/api/pops/${t.pop.id}/docx`);
                          if (!res.ok) throw new Error("Erro");
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${t.pop.codigo} - ${t.pop.titulo}.docx`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch {
                          toast.error("Erro ao baixar POP");
                        } finally {
                          setDownloadingPop(null);
                        }
                      }}
                      disabled={downloadingPop === t.pop.id}
                      title="Baixar POP"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
