"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClipboardCheck, 
  Camera, 
  Video, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar,
  User,
  FileText,
  Star,
  AlertTriangle,
  RefreshCw,
  Upload,
  Eye
} from "lucide-react";

interface VerificacaoPratica {
  id: string;
  dataAgendamento: string;
  status: "PENDENTE" | "AGENDADO" | "EM_ANDAMENTO" | "APROVADO" | "REPROVADO" | "CANCELADO";
  supervisor: string;
  resultado?: string;
  nota?: number;
  treinamento: {
    colaborador: {
      nome: string;
      funcao: string;
      setor?: string;
    };
    pop: {
      codigo: string;
      titulo: string;
      setor?: string;
      descricao?: string;
    };
  };
  checklist?: any;
  observacoes?: string;
  pontosCriticos?: string;
  fotosUrl?: string[];
}

interface ChecklistItem {
  id: string;
  descricao: string;
  obrigatorio: boolean;
  tipo: "checkbox" | "avaliacao" | "observacao";
  evidencia: "foto" | "video" | "observacao";
  status?: "aprovado" | "reprovado" | "pendente";
  nota?: number;
  observacao?: string;
}

export default function VerificacaoPraticaPage() {
  const [verificacoes, setVerificacoes] = useState<VerificacaoPratica[]>([]);
  const [checklistPadrao, setChecklistPadrao] = useState<any[]>([]);
  const [selectedVerificacao, setSelectedVerificacao] = useState<VerificacaoPratica | null>(null);
  const [loading, setLoading] = useState(true);
  const [agendando, setAgendando] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<any>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar verificações
      const verificacoesResponse = await fetch("/api/verificacao-pratica?action=listar");
      const verificacoesData = await verificacoesResponse.json();
      setVerificacoes(verificacoesData.verificacoes || []);
      
      // Carregar checklist padrão
      const checklistResponse = await fetch("/api/verificacao-pratica?action=checklist");
      const checklistData = await checklistResponse.json();
      setChecklistPadrao(checklistData.checklist || []);
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APROVADO": return "bg-green-100 text-green-800";
      case "REPROVADO": return "bg-red-100 text-red-800";
      case "EM_ANDAMENTO": return "bg-blue-100 text-blue-800";
      case "AGENDADO": return "bg-yellow-100 text-yellow-800";
      case "PENDENTE": return "bg-gray-100 text-gray-800";
      case "CANCELADO": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APROVADO": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REPROVADO": return <XCircle className="h-4 w-4 text-red-500" />;
      case "EM_ANDAMENTO": return <Clock className="h-4 w-4 text-blue-500" />;
      case "AGENDADO": return <Calendar className="h-4 w-4 text-yellow-500" />;
      case "PENDENTE": return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const agendarVerificacao = async (treinamentoId: string, colaboradorId: string, popId: string) => {
    try {
      setAgendando(true);
      
      const dataAgendamento = new Date(Date.now() + 24 * 60 * 60 * 1000); // Amanhã
      
      const response = await fetch("/api/verificacao-pratica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "agendar",
          treinamentoId,
          colaboradorId,
          popId,
          dataAgendamento: dataAgendamento.toISOString(),
          duracaoEstimada: 60,
          supervisor: "Supervisor Designado"
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await carregarDados();
        alert("Verificação prática agendada com sucesso!");
      } else {
        alert("Erro ao agendar verificação: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao agendar verificação:", error);
      alert("Erro ao agendar verificação");
    } finally {
      setAgendando(false);
    }
  };

  const iniciarVerificacao = async (verificacaoId: string) => {
    try {
      const response = await fetch("/api/verificacao-pratica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "iniciar",
          verificacaoId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await carregarDados();
        alert("Verificação iniciada!");
      } else {
        alert("Erro ao iniciar verificação: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao iniciar verificação:", error);
      alert("Erro ao iniciar verificação");
    }
  };

  const handleAvaliacaoChange = (categoria: string, item: ChecklistItem, valor: any) => {
    const chave = `${categoria}_${item.id}`;
    
    setAvaliacoes(prev => ({
      ...prev,
      [chave]: {
        ...item,
        status: valor.status || item.status,
        nota: valor.nota || item.nota,
        observacao: valor.observacao || item.observacao
      }
    }));
  };

  const concluirAvaliacao = async () => {
    if (!selectedVerificacao) return;
    
    try {
      const response = await fetch("/api/verificacao-pratica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "avaliar",
          verificacaoId: selectedVerificacao.id,
          avaliacoes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await carregarDados();
        setSelectedVerificacao(null);
        setAvaliacoes({});
        alert("Verificação concluída com sucesso!");
      } else {
        alert("Erro ao concluir verificação: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao concluir verificação:", error);
      alert("Erro ao concluir verificação");
    }
  };

  const uploadEvidencia = async (tipo: "foto" | "video") => {
    if (!selectedVerificacao) return;
    
    try {
      setUploading(true);
      
      // Simulação de upload
      const arquivo = new Blob(["mock_file"], { type: "image/jpeg" });
      const nomeArquivo = `${tipo}_${Date.now()}.jpg`;
      
      const response = await fetch("/api/verificacao-pratica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "upload-evidencia",
          verificacaoId: selectedVerificacao.id,
          tipo,
          arquivo: "mock_base64",
          nomeArquivo
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`${tipo === "foto" ? "Foto" : "Vídeo"} enviada com sucesso!`);
      } else {
        alert(`Erro ao enviar ${tipo}: ` + data.error);
      }
    } catch (error) {
      console.error("Erro ao enviar evidência:", error);
      alert(`Erro ao enviar ${tipo}`);
    } finally {
      setUploading(false);
    }
  };

  const renderListaVerificacoes = () => (
    <div className="space-y-4">
      {verificacoes.map((verificacao) => (
        <Card key={verificacao.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(verificacao.status)}
                  <span className="font-semibold">{verificacao.treinamento.colaborador.nome}</span>
                  <Badge variant="outline">{verificacao.treinamento.colaborador.funcao}</Badge>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    <span>{verificacao.treinamento.pop.codigo} - {verificacao.treinamento.pop.titulo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>Supervisor: {verificacao.supervisor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatarData(verificacao.dataAgendamento)}</span>
                  </div>
                </div>
                
                {verificacao.resultado && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={getStatusColor(verificacao.resultado)}>
                      {verificacao.resultado}
                    </Badge>
                    {verificacao.nota && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm font-medium">{verificacao.nota.toFixed(1)}/10</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <Badge className={getStatusColor(verificacao.status)}>
                  {verificacao.status}
                </Badge>
                
                {verificacao.status === "AGENDADO" && (
                  <Button 
                    size="sm"
                    onClick={() => iniciarVerificacao(verificacao.id)}
                  >
                    <ClipboardCheck className="h-3 w-3 mr-1" />
                    Iniciar
                  </Button>
                )}
                
                {verificacao.status === "EM_ANDAMENTO" && (
                  <Button 
                    size="sm"
                    onClick={() => setSelectedVerificacao(verificacao)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Avaliar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderChecklistAvaliacao = () => {
    if (!selectedVerificacao) return null;

    return (
      <div className="space-y-6">
        {/* Cabeçalho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Avaliação Prática</span>
              <Badge className={getStatusColor("EM_ANDAMENTO")}>
                EM ANDAMENTO
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Colaborador</p>
                <p className="font-semibold">{selectedVerificacao.treinamento.colaborador.nome}</p>
                <p className="text-sm">{selectedVerificacao.treinamento.colaborador.funcao}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">POP</p>
                <p className="font-semibold">{selectedVerificacao.treinamento.pop.codigo}</p>
                <p className="text-sm">{selectedVerificacao.treinamento.pop.titulo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload de Evidências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Evidências Fotográficas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={() => uploadEvidencia("foto")}
                disabled={uploading}
                variant="outline"
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? "Enviando..." : "Tirar Foto"}
              </Button>
              <Button 
                onClick={() => uploadEvidencia("video")}
                disabled={uploading}
                variant="outline"
              >
                <Video className="h-4 w-4 mr-2" />
                {uploading ? "Enviando..." : "Gravar Vídeo"}
              </Button>
            </div>
            
            {selectedVerificacao.fotosUrl && selectedVerificacao.fotosUrl.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Evidências enviadas:</p>
                <div className="flex gap-2">
                  {selectedVerificacao.fotosUrl.map((url, index) => (
                    <div key={index} className="border rounded p-2 text-xs">
                      Evidência {index + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checklist de Avaliação */}
        <div className="space-y-4">
          {checklistPadrao.map((categoria) => (
            <Card key={categoria.categoria}>
              <CardHeader>
                <CardTitle className="text-lg">{categoria.categoria}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoria.itens.map((item: ChecklistItem) => {
                    const chave = `${categoria.categoria}_${item.id}`;
                    const avaliacaoAtual = avaliacoes[chave] || item;
                    
                    return (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium">{item.descricao}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.evidencia === "foto" && <Camera className="h-3 w-3 mr-1" />}
                                {item.evidencia === "video" && <Video className="h-3 w-3 mr-1" />}
                                {item.evidencia}
                              </Badge>
                              {item.obrigatorio && (
                                <Badge variant="destructive" className="text-xs">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {item.tipo === "checkbox" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={avaliacaoAtual.status === "aprovado" ? "default" : "outline"}
                              onClick={() => handleAvaliacaoChange(categoria.categoria, item, { status: "aprovado" })}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Conforme
                            </Button>
                            <Button
                              size="sm"
                              variant={avaliacaoAtual.status === "reprovado" ? "destructive" : "outline"}
                              onClick={() => handleAvaliacaoChange(categoria.categoria, item, { status: "reprovado" })}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Não Conforme
                            </Button>
                          </div>
                        )}

                        {item.tipo === "avaliacao" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Nota:</span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((nota) => (
                                  <Button
                                    key={nota}
                                    size="sm"
                                    variant={avaliacaoAtual.nota === nota ? "default" : "outline"}
                                    onClick={() => handleAvaliacaoChange(categoria.categoria, item, { 
                                      status: nota >= 3 ? "aprovado" : "reprovado", 
                                      nota 
                                    })}
                                  >
                                    {nota}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <textarea
                              className="w-full p-2 border rounded text-sm"
                              placeholder="Observações..."
                              value={avaliacaoAtual.observacao || ""}
                              onChange={(e) => handleAvaliacaoChange(categoria.categoria, item, { 
                                observacao: e.target.value 
                              })}
                              rows={2}
                            />
                          </div>
                        )}

                        {item.tipo === "observacao" && (
                          <textarea
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Observações..."
                            value={avaliacaoAtual.observacao || ""}
                            onChange={(e) => handleAvaliacaoChange(categoria.categoria, item, { 
                              status: "aprovado",
                              observacao: e.target.value 
                            })}
                            rows={3}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botões de Ação */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Button 
                onClick={concluirAvaliacao}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir Avaliação
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedVerificacao(null)}
              >
                Cancelar
              </Button>
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
          <p>Carregando verificações práticas...</p>
        </div>
      </div>
    );
  }

  if (selectedVerificacao) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Verificação Prática</h1>
          <p className="text-gray-600">Avaliação de competência prática do colaborador</p>
        </div>
        
        {renderChecklistAvaliacao()}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Verificação Prática</h1>
        <p className="text-gray-600">Prova de competência prática para certificação</p>
      </div>

      <Tabs defaultValue="lista" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista">Verificações</TabsTrigger>
          <TabsTrigger value="agendar">Agendar Nova</TabsTrigger>
          <TabsTrigger value="checklist">Checklist Padrão</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          {verificacoes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma verificação prática encontrada</p>
                <p className="text-sm text-gray-500 mt-2">
                  Agende uma nova verificação para começar
                </p>
              </CardContent>
            </Card>
          ) : (
            renderListaVerificacoes()
          )}
        </TabsContent>

        <TabsContent value="agendar">
          <Card>
            <CardHeader>
              <CardTitle>Agendar Nova Verificação Prática</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Para agendar uma verificação prática, primeiro selecione um treinamento concluído 
                  que exija comprovação prática.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 text-center">
                <Button disabled>
                  <Calendar className="h-4 w-4 mr-2" />
                  Selecionar Treinamento (Em breve)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Checklist Padrão de Verificação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklistPadrao.map((categoria) => (
                  <div key={categoria.categoria} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">{categoria.categoria}</h3>
                    <div className="space-y-2">
                      {categoria.itens.map((item: ChecklistItem) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${
                            item.obrigatorio ? "bg-red-500" : "bg-gray-300"
                          }`} />
                          <span>{item.descricao}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.evidencia}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
