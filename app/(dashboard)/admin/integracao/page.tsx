"use client";

import { useState, useCallback } from "react";
import { 
  Cpu, 
  Zap, 
  UploadCloud, 
  Database, 
  Webhook, 
  Activity, 
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Loader2,
  Download,
  Code,
  RefreshCw,
  Server,
  Cloud,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface SyncLog {
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface MappingResult {
  sourceColumn: string;
  targetColumn: string;
  confidence: number;
  sample: string;
}

export default function IntegracaoUniversalPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [mappingResults, setMappingResults] = useState<MappingResult[] | null>(null);
  const [riskDetected, setRiskDetected] = useState(false);
  const [riskDetails, setRiskDetails] = useState<any>(null);

  const addLog = (type: SyncLog["type"], message: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR", { hour12: false });
    setSyncLogs((prev) => [...prev, { timestamp, type, message }]);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    
    // Validar tipo de arquivo
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // Excel
      "application/vnd.ms-excel",
      "text/csv",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado. Use Excel, CSV ou PDF.");
      return;
    }

    await processFile(file);
  }, []);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setSyncLogs([]);
    setMappingResults(null);
    setRiskDetected(false);

    try {
      addLog("info", "Iniciando processamento de arquivo...");
      addLog("info", `Arquivo: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

      // Upload do arquivo
      const formData = new FormData();
      formData.append("file", file);

      addLog("info", "Enviando arquivo para processamento...");

      const response = await fetch("/api/integracao/processar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao processar arquivo");
      }

      const result = await response.json();

      if (result.success) {
        addLog("success", `IA: Origem identificada -> ${result.source}`);
        
        // Adicionar logs de mapeamento
        result.mappings.forEach((mapping: MappingResult) => {
          addLog("info", `'${mapping.sourceColumn}' mapeado para '${mapping.targetColumn}' (${mapping.confidence}% confiança)`);
        });

        setMappingResults(result.mappings);

        addLog("success", `Sincronizando ${result.recordCount} registros com Neon DB...`);

        // Verificar inconsistências
        if (result.inconsistencies && result.inconsistencies.length > 0) {
          setRiskDetected(true);
          setRiskDetails(result.inconsistencies);
          addLog("warning", `Inconsistência: ${result.inconsistencies.length} funcionários sem cadastro`);
        } else {
          addLog("success", "Sincronização concluída sem inconsistências!");
        }

        toast.success(`Arquivo processado! ${result.recordCount} registros sincronizados.`);
      } else {
        throw new Error(result.error || "Erro desconhecido");
      }
    } catch (error: any) {
      addLog("error", `Erro: ${error.message}`);
      toast.error("Erro ao processar arquivo");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleGenerateTrainings = async () => {
    try {
      addLog("info", "Gerando treinamentos automáticos para funcionários não cadastrados...");
      
      const response = await fetch("/api/integracao/gerar-treinamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inconsistencies: riskDetails }),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar treinamentos");
      }

      const result = await response.json();

      if (result.success) {
        addLog("success", `${result.treinamentosCriados} treinamentos gerados automaticamente!`);
        toast.success("Treinamentos gerados com sucesso!");
        setRiskDetected(false);
      }
    } catch (error) {
      toast.error("Erro ao gerar treinamentos");
    }
  };

  const getLogColor = (type: SyncLog["type"]) => {
    switch (type) {
      case "info": return "text-blue-400";
      case "success": return "text-green-400";
      case "warning": return "text-yellow-400";
      case "error": return "text-red-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-gray-100">
      {/* Header */}
      <nav className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none italic">
                VISADOCS <span className="text-blue-500">UNIVERSAL BRIDGE</span>
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                Protocolo de Integração IA v4.0
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-green-500">NEON DB CONECTADO</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Coluna Esquerda: Métodos de Entrada */}
          <div className="lg:col-span-7 space-y-6">
            {/* Dropzone Principal */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-transparent border-blue-500/30">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                  <Zap className="text-yellow-400" />
                  Conexão Zero-Config
                </h2>
                <p className="text-gray-400 mb-8">
                  Arraste qualquer relatório exportado do seu ERP (Fagron, Trier, HOS) e nossa IA mapeia os dados instantaneamente.
                </p>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                    isDragging 
                      ? "border-blue-400 bg-blue-500/10" 
                      : "border-blue-500/50 hover:bg-blue-500/5"
                  }`}
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    {isProcessing ? (
                      <div className="space-y-4">
                        <Loader2 className="w-12 h-12 mx-auto text-blue-400 animate-spin" />
                        <p className="font-bold text-lg">Processando com IA...</p>
                        <p className="text-sm text-gray-500">DeepSeek R1 analisando estrutura de dados</p>
                      </div>
                    ) : (
                      <div className="space-y-4 group">
                        <UploadCloud className="w-12 h-12 mx-auto text-blue-400 group-hover:scale-110 transition-transform" />
                        <p className="font-bold text-lg">Solte seu Excel, CSV ou PDF aqui</p>
                        <p className="text-sm text-gray-500">O DeepSeek R1 fará o mapeamento de colunas automaticamente</p>
                      </div>
                    )}
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Cards de Métodos */}
            <div className="grid grid-cols-2 gap-4">
              {/* SQL Local Bridge */}
              <Card className="bg-gray-900 border-gray-800 hover:border-blue-500/50 transition-colors">
                <CardContent className="p-6">
                  <Database className="mb-3 text-blue-400" />
                  <h3 className="font-bold mb-2">SQL Local Bridge</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Conecte direto no banco Firebird/SQL Server da farmácia.
                  </p>
                  <Button className="w-full text-xs bg-white text-black hover:bg-gray-200">
                    <Download className="w-4 h-4 mr-2" />
                    BAIXAR AGENTE .EXE
                  </Button>
                </CardContent>
              </Card>

              {/* Webhook API */}
              <Card className="bg-gray-900 border-gray-800 hover:border-blue-500/50 transition-colors">
                <CardContent className="p-6">
                  <Webhook className="mb-3 text-purple-400" />
                  <h3 className="font-bold mb-2">Webhook API</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Endpoint universal para sistemas Cloud modernos.
                  </p>
                  <Button variant="outline" className="w-full text-xs">
                    <Code className="w-4 h-4 mr-2" />
                    VER DOCUMENTAÇÃO
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Resultados do Mapeamento */}
            {mappingResults && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="text-green-400" />
                    Mapeamento Inteligente Concluído
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mappingResults.map((mapping, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {mapping.sourceColumn}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                          <Badge className="text-xs bg-blue-600">
                            {mapping.targetColumn}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-400">
                          {mapping.confidence}% confiança
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Direita: Status e Monitoramento */}
          <div className="lg:col-span-5 space-y-6">
            {/* Monitor de Sincronização */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="text-blue-500" />
                  Monitor de Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-xs h-64 overflow-y-auto bg-black/30 p-4 rounded-lg">
                  {syncLogs.length === 0 ? (
                    <p className="text-gray-500 italic">Aguardando arquivo...</p>
                  ) : (
                    syncLogs.map((log, index) => (
                      <div key={index} className={`flex gap-3 ${getLogColor(log.type)}`}>
                        <span className="text-gray-600">[{log.timestamp}]</span>
                        <span>{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card de Inteligência de Risco */}
            {riskDetected && (
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <ShieldAlert className="text-red-500 w-8 h-8" />
                    <Badge className="bg-red-500 text-white text-[10px]">
                      AÇÃO NECESSÁRIA
                    </Badge>
                  </div>
                  <h4 className="font-bold text-red-100 mb-2">Inconsistência Detectada</h4>
                  <p className="text-xs text-red-200/60 mt-1">
                    Foram encontrados {riskDetails?.length || 0} funcionários no ERP que não possuem cadastro no Visadocs. 
                    O Score de Conformidade caiu para 64%.
                  </p>
                  <Button 
                    onClick={handleGenerateTrainings}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    GERAR TREINAMENTOS AUTOMÁTICOS
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Status das Conexões */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm">Status das Integrações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-green-400" />
                    <span className="text-sm">Fagron FórmulaCerta</span>
                  </div>
                  <Badge variant="outline" className="text-xs text-green-400">Conectado</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm">Trier ERP</span>
                  </div>
                  <Badge variant="outline" className="text-xs text-yellow-400">Configurar</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">HOS Sistemas</span>
                  </div>
                  <Badge variant="outline" className="text-xs text-gray-400">Não conectado</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm">Sincronizações Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-400">142</p>
                    <p className="text-xs text-gray-500">Registros sincronizados</p>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-400">98%</p>
                    <p className="text-xs text-gray-500">Taxa de sucesso</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
