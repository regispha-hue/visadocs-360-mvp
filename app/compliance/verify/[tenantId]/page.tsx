"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  Award,
  Calendar,
  ChevronRight,
  Building2,
  QrCode,
  Printer,
  Download,
  Shield,
  AlertOctagon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface ComplianceData {
  farmacia: {
    nome: string;
    cnpj: string;
    responsavel: string;
    endereco?: string;
    telefone?: string;
  };
  compliance: {
    overallScore: number;
    status: string;
    color: string;
    totalColaboradores: number;
    colaboradoresTreinados: number;
    treinamentosVencidos: number;
    popsAtivos: number;
    percentualTreinados: number;
    percentualValidos: number;
    lastUpdated: string;
  };
  colaboradores: Array<{
    id: string;
    nome: string;
    cargo: string;
    status: string;
    treinamentosConcluidos: number;
    treinamentosPendentes: number;
    certificadosAtivos: number;
    ultimoTreinamento?: string;
  }>;
  pops: Array<{
    id: string;
    codigo: string;
    titulo: string;
    categoria: string;
    status: string;
    version: string;
    updatedAt: string;
  }>;
  ultimaFiscalizacao?: {
    data: string;
    resultado: string;
    observacoes?: string;
  };
}

export default function ComplianceVerifyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantId = params.tenantId as string;
  const token = searchParams.get("token");

  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "colaboradores" | "pops">("overview");

  useEffect(() => {
    loadComplianceData();
  }, [tenantId, token]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/compliance/verify/${tenantId}?token=${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao carregar dados");
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Erro ao carregar dados de compliance");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <QrCode className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Verificando compliance...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertOctagon className="w-6 h-6" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error || "Dados não encontrados. QR Code pode estar expirado ou inválido."}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-500 mt-4">
              Entre em contato com a farmácia ou visite fisicamente o estabelecimento para verificação presencial.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { farmacia, compliance, colaboradores, pops } = data;

  const getStatusColor = (color: string) => {
    const colors: Record<string, string> = {
      green: "bg-green-100 text-green-800 border-green-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      red: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[color] || colors.blue;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header - Não imprime */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2 rounded-lg text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-teal-900">VISADOCS Compliance</h1>
              <p className="text-xs text-gray-500">Verificação de Conformidade em Tempo Real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 print:p-0">
        {/* Farmácia Info */}
        <Card className="mb-6 print:shadow-none print:border-0">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{farmacia.nome}</h2>
                  <p className="text-gray-500">CNPJ: {farmacia.cnpj}</p>
                  <p className="text-gray-500">Responsável: {farmacia.responsavel}</p>
                  {farmacia.endereco && (
                    <p className="text-gray-500 text-sm">{farmacia.endereco}</p>
                  )}
                </div>
              </div>
              <div className="text-right print:hidden">
                <Badge className={`text-lg px-4 py-2 ${getStatusColor(compliance.color)}`}>
                  <Shield className="w-4 h-4 mr-2" />
                  {compliance.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="md:col-span-1 print:shadow-none">
            <CardContent className="p-6 text-center">
              <h3 className="text-gray-500 text-sm font-medium mb-4">Score de Compliance</h3>
              <div className={`text-6xl font-black ${getScoreColor(compliance.overallScore)}`}>
                {compliance.overallScore}%
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Status: <span className="font-semibold">{compliance.status}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 print:shadow-none">
            <CardContent className="p-6">
              <h3 className="text-gray-800 font-semibold mb-4">Indicadores de Conformidade</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{compliance.percentualTreinados}%</div>
                  <p className="text-sm text-gray-600">
                    {compliance.colaboradoresTreinados} de {compliance.totalColaboradores} colaboradores treinados
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Award className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{compliance.percentualValidos}%</div>
                  <p className="text-sm text-gray-600">
                    Certificados válidos
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <FileText className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{compliance.popsAtivos}</div>
                  <p className="text-sm text-gray-600">
                    POPs ativos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Não imprime */}
        <div className="flex gap-2 mb-6 print:hidden">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveTab("overview")}
            className={activeTab === "overview" ? "bg-teal-600" : ""}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Visão Geral
          </Button>
          <Button
            variant={activeTab === "colaboradores" ? "default" : "outline"}
            onClick={() => setActiveTab("colaboradores")}
            className={activeTab === "colaboradores" ? "bg-teal-600" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Colaboradores ({colaboradores.length})
          </Button>
          <Button
            variant={activeTab === "pops" ? "default" : "outline"}
            onClick={() => setActiveTab("pops")}
            className={activeTab === "pops" ? "bg-teal-600" : ""}
          >
            <FileText className="w-4 h-4 mr-2" />
            POPs ({pops.length})
          </Button>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === "overview" && (
          <div className="space-y-6 print:block">
            {/* Alertas de Compliance */}
            {compliance.treinamentosVencidos > 0 && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Atenção:</strong> Existem {compliance.treinamentosVencidos} treinamento(s) vencido(s). 
                  Regularização necessária para manter conformidade com a RDC 67/2007.
                </AlertDescription>
              </Alert>
            )}

            {/* Resumo Executivo */}
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle>Resumo Executivo de Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Sistema de Gestão Implementado</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">OK</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">POPs Documentados e Atualizados</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">{pops.length} POPs</Badge>
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg border ${
                    compliance.treinamentosVencidos === 0 
                      ? "bg-green-50 border-green-100" 
                      : "bg-orange-50 border-orange-100"
                  }`}>
                    <div className="flex items-center gap-3">
                      {compliance.treinamentosVencidos === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      )}
                      <span className="font-medium">Treinamentos em Dia</span>
                    </div>
                    <Badge variant="outline" className={
                      compliance.treinamentosVencidos === 0 ? "text-green-600" : "text-orange-600"
                    }>
                      {compliance.treinamentosVencidos === 0 ? "100%" : `${compliance.treinamentosVencidos} pendentes`}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Certificação por Blockchain</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">Ativo</Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="text-sm text-gray-500">
                  <p><strong>Última atualização:</strong> {new Date(compliance.lastUpdated).toLocaleString("pt-BR")}</p>
                  <p className="mt-1">
                    <strong>Verificação realizada em:</strong> {new Date().toLocaleString("pt-BR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "colaboradores" && (
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>Quadro de Colaboradores e Treinamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {colaboradores.map((colab) => (
                  <div
                    key={colab.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium">{colab.nome}</p>
                        <p className="text-sm text-gray-500">{colab.cargo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant={colab.treinamentosPendentes === 0 ? "default" : "destructive"}>
                          {colab.treinamentosPendentes === 0 ? "Regular" : `${colab.treinamentosPendentes} pendentes`}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {colab.treinamentosConcluidos} treinamentos concluídos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "pops" && (
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>Procedimentos Operacionais Padrão (POPs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pops.map((pop) => (
                  <div
                    key={pop.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-teal-600" />
                      <div>
                        <p className="font-medium text-sm">{pop.codigo}</p>
                        <p className="text-sm text-gray-600">{pop.titulo}</p>
                        <p className="text-xs text-gray-400">{pop.categoria}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      v{pop.version}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer - Info de verificação */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-500 print:bg-gray-50">
          <p className="font-medium">Verificação de Compliance - VISADOCS</p>
          <p>Este documento é válido por 24 horas a partir da data de geração.</p>
          <p className="mt-1">Verificação realizada via QR Code em {new Date().toLocaleString("pt-BR")}</p>
          <p className="mt-2 text-xs">
            Dados atualizados em tempo real conforme RDC 67/2007 e normas da ANVISA.
          </p>
        </div>
      </main>
    </div>
  );
}
