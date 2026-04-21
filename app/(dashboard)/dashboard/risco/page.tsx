"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  FileText,
  BarChart3,
  Brain,
  Eye
} from "lucide-react";

interface Risco {
  id: string;
  descricao: string;
  setor: string;
  probabilidade: number;
  impacto: number;
  nivelRisco: number;
  tipo: string;
  severidade: string;
  status: string;
  pop?: {
    codigo: string;
    titulo: string;
    setor: string;
  };
  naoConformidades: number;
  auditorias: number;
  planoAcao?: string;
  prazoPlano?: string;
}

interface AnaliseIA {
  riscosIdentificados: Array<{
    descricao: string;
    setor: string;
    probabilidade: number;
    impacto: number;
    nivelRisco: number;
    tipo: string;
    severidade: string;
    evidencias: string[];
    popsAfetados: string[];
    recomendacao: string;
  }>;
  insights: string[];
  acoesRecomendadas: Array<{
    prioridade: string;
    acao: string;
    prazo: string;
    responsavel: string;
  }>;
  scoreConformidade: number;
  tendencias: {
    naoConformidades: string;
    riscos: string;
    conformidade: string;
  };
}

export default function RiscoPage() {
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [analiseIA, setAnaliseIA] = useState<AnaliseIA | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRisco, setSelectedRisco] = useState<Risco | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar matriz de riscos
      const matrizResponse = await fetch("/api/risco?action=matriz");
      const matrizData = await matrizResponse.json();
      setRiscos(matrizData.matriz || []);
      
      // Carregar análise IA
      const analiseResponse = await fetch("/api/risco?action=analise-ia");
      const analiseData = await analiseResponse.json();
      setAnaliseIA(analiseData.analise || null);
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeveridadeColor = (severidade: string) => {
    switch (severidade) {
      case "CRITICO": return "bg-red-500";
      case "ALTO": return "bg-orange-500";
      case "MEDIO": return "bg-yellow-500";
      case "BAIXO": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CRITICO": return "bg-red-100 text-red-800";
      case "MITIGADO": return "bg-green-100 text-green-800";
      case "MONITORADO": return "bg-blue-100 text-blue-800";
      case "IDENTIFICADO": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (tendencia: string) => {
    switch (tendencia) {
      case "crescente": return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "decrescente": return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderMatrizRisco = () => {
    return (
      <div className="space-y-6">
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Riscos</p>
                  <p className="text-2xl font-bold">{riscos.length}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Riscos Críticos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {riscos.filter(r => r.severidade === "CRITICO").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mitigados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {riscos.filter(r => r.status === "MITIGADO").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Score Conformidade</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analiseIA ? Math.round(analiseIA.scoreConformidade * 100) : 0}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matriz Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Matriz de Risco Interativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Matriz de Calor */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Matriz de Probabilidade vs Impacto</h3>
                <div className="relative h-64 bg-gray-50 rounded-lg p-4">
                  {/* Eixos */}
                  <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-600">Probabilidade</div>
                  <div className="absolute top-0 bottom-0 left-0 text-xs text-gray-600 transform -rotate-90 origin-center">Impacto</div>
                  
                  {/* Pontos de Risco */}
                  {riscos.map((risco, index) => (
                    <div
                      key={risco.id}
                      className={`absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${getSeveridadeColor(risco.severidade)}`}
                      style={{
                        left: `${(risco.probabilidade / 5) * 80 + 10}%`,
                        top: `${(risco.impacto / 5) * 80 + 10}%`
                      }}
                      onClick={() => setSelectedRisco(risco)}
                      title={`${risco.descricao} (Risco: ${risco.nivelRisco})`}
                    />
                  ))}
                </div>
              </div>

              {/* Lista de Riscos */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Riscos Identificados</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {riscos.map((risco) => (
                    <div
                      key={risco.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRisco?.id === risco.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedRisco(risco)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{risco.descricao}</p>
                          <p className="text-xs text-gray-600">{risco.setor} - Risco: {risco.nivelRisco}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(risco.status)}>
                            {risco.status}
                          </Badge>
                          <div className={`w-3 h-3 rounded-full ${getSeveridadeColor(risco.severidade)}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do Risco Selecionado */}
        {selectedRisco && (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Informações Gerais</h4>
                  <div className="space-y-2">
                    <p><strong>Descrição:</strong> {selectedRisco.descricao}</p>
                    <p><strong>Setor:</strong> {selectedRisco.setor}</p>
                    <p><strong>Tipo:</strong> {selectedRisco.tipo}</p>
                    <p><strong>Probabilidade:</strong> {selectedRisco.probabilidade}/5</p>
                    <p><strong>Impacto:</strong> {selectedRisco.impacto}/5</p>
                    <p><strong>Nível de Risco:</strong> {selectedRisco.nivelRisco}</p>
                    <p><strong>Severidade:</strong> {selectedRisco.severidade}</p>
                    <p><strong>Status:</strong> {selectedRisco.status}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Impactos e Ações</h4>
                  <div className="space-y-2">
                    {selectedRisco.pop && (
                      <p><strong>POP Vinculado:</strong> {selectedRisco.pop.codigo} - {selectedRisco.pop.titulo}</p>
                    )}
                    <p><strong>Não Conformidades:</strong> {selectedRisco.naoConformidades}</p>
                    <p><strong>Auditorias:</strong> {selectedRisco.auditorias}</p>
                    {selectedRisco.planoAcao && (
                      <p><strong>Plano de Ação:</strong> {selectedRisco.planoAcao}</p>
                    )}
                    {selectedRisco.prazoPlano && (
                      <p><strong>Prazo:</strong> {new Date(selectedRisco.prazoPlano).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderAnaliseIA = () => {
    if (!analiseIA) return <div>Carregando análise...</div>;

    return (
      <div className="space-y-6">
        {/* Score de Conformidade */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Score de Conformidade</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(analiseIA.scoreConformidade * 100)}%
                </p>
              </div>
              <div className="text-right">
                <Brain className="h-8 w-8 text-blue-500 mb-2" />
                <p className="text-sm text-gray-600">Análise NexoritIA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tendências */}
        <Card>
          <CardHeader>
            <CardTitle>Tendências Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {getTrendIcon(analiseIA.tendencias.naoConformidades)}
                <span>Não Conformidades: {analiseIA.tendencias.naoConformidades}</span>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(analiseIA.tendencias.riscos)}
                <span>Riscos: {analiseIA.tendencias.riscos}</span>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(analiseIA.tendencias.conformidade)}
                <span>Conformidade: {analiseIA.tendencias.conformidade}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Riscos Identificados pela IA */}
        <Card>
          <CardHeader>
            <CardTitle>Riscos Identificados pela IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analiseIA.riscosIdentificados.map((risco, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{risco.descricao}</h4>
                    <Badge className={getSeveridadeColor(risco.severidade)}>
                      {risco.severidade}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Setor:</strong> {risco.setor}</p>
                      <p><strong>Tipo:</strong> {risco.tipo}</p>
                      <p><strong>Nível Risco:</strong> {risco.nivelRisco}</p>
                    </div>
                    <div>
                      <p><strong>POPs Afetados:</strong> {risco.popsAfetados.join(", ")}</p>
                      <p><strong>Evidências:</strong> {risco.evidencias.join(", ")}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p><strong>Recomendação:</strong> {risco.recomendacao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights Gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analiseIA.insights.map((insight, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ações Recomendadas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Recomendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analiseIA.acoesRecomendadas.map((acao, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={acao.prioridade === "CRÍTICA" ? "destructive" : "default"}>
                        {acao.prioridade}
                      </Badge>
                      <span className="font-medium">{acao.acao}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>Prazo: {acao.prazo}</span> | <span>Responsável: {acao.responsavel}</span>
                    </div>
                  </div>
                  <Button size="sm">
                    <Clock className="h-4 w-4 mr-1" />
                    Agendar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Carregando análise de riscos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gestão de Riscos e Conformidade</h1>
        <p className="text-gray-600">Análise inteligente de riscos operacionais e regulatórios</p>
      </div>

      <Tabs defaultValue="matriz" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="matriz">Matriz de Risco</TabsTrigger>
          <TabsTrigger value="ia">Análise NexoritIA</TabsTrigger>
        </TabsList>

        <TabsContent value="matriz">
          {renderMatrizRisco()}
        </TabsContent>

        <TabsContent value="ia">
          {renderAnaliseIA()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
