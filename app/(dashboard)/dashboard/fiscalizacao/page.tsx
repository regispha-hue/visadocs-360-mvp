"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  QrCode, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Users,
  Calendar,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";

interface AuditoriaData {
  id: string;
  tenant: {
    nome: string;
    cnpj: string;
    responsavel: string;
  };
  masterListPOPs: Array<{
    codigo: string;
    titulo: string;
    versao: string;
    status: string;
    dataValidade: string;
    responsavel: string;
    setor: string;
    implantadoEm?: string;
    implantadoPor?: string;
  }>;
  certificados: Array<{
    colaborador: string;
    funcao: string;
    pop: string;
    popTitulo: string;
    dataTreinamento: string;
    status: string;
    validade: string;
    instrutor: string;
    notaQuiz?: number;
  }>;
  cronogramaValidades: Array<{
    documento: string;
    tipo: string;
    titulo?: string;
    colaborador?: string;
    dataValidade: string;
    diasParaVencer: number;
    status: string;
  }>;
  dataGeracao: Date;
  dataExpiracao: Date;
  acessos: Array<{
    data: string;
    tipo: string;
    ip: string;
  }>;
}

export default function FiscalizacaoPage() {
  const [auditoriaAtiva, setAuditoriaAtiva] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [codigoAcesso, setCodigoAcesso] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [acessoData, setAcessoData] = useState<AuditoriaData | null>(null);
  const [acessando, setAcessando] = useState(false);

  useEffect(() => {
    verificarAuditoriaAtiva();
  }, []);

  const verificarAuditoriaAtiva = async () => {
    try {
      const response = await fetch("/api/auditoria-fiscalizacao?action=status");
      const data = await response.json();
      
      if (data.ativa && data.auditoria) {
        setAuditoriaAtiva(data.auditoria);
        setQrCode(data.auditoria.qrCode);
        setCodigoAcesso(data.auditoria.codigoAcesso);
      }
    } catch (error) {
      console.error("Erro ao verificar auditoria ativa:", error);
    }
  };

  const gerarQRCode = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auditoria-fiscalizacao?action=gerar-qrcode", {
        method: "POST"
      });
      const data = await response.json();
      
      if (data.success) {
        setAuditoriaAtiva(data.auditoria);
        setQrCode(data.qrCode);
        setCodigoAcesso(data.codigoAcesso);
        
        // Gerar QR Code visual
        if (data.qrCodeImage) {
          setQrCode(data.qrCodeImage);
        }
      }
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
    } finally {
      setLoading(false);
    }
  };

  const acessarAuditoria = async (codigo: string) => {
    try {
      setAcessando(true);
      const response = await fetch(`/api/auditoria-fiscalizacao?action=acesso-auditoria&qr=${encodeURIComponent(codigo)}`);
      const data = await response.json();
      
      if (data.success) {
        setAcessoData(data.auditoria);
      } else {
        alert("QR Code ou código inválido");
      }
    } catch (error) {
      console.error("Erro ao acessar auditoria:", error);
      alert("Erro ao acessar auditoria");
    } finally {
      setAcessando(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ATIVO": return "bg-green-100 text-green-800";
      case "VENCIDO": return "bg-red-100 text-red-800";
      case "VENCENDO": return "bg-yellow-100 text-yellow-800";
      case "VALIDO": return "bg-green-100 text-green-800";
      case "VENCE_HOJE": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
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

  const calcularTempoExpiracao = () => {
    if (!auditoriaAtiva?.dataExpiracao) return "";
    
    const agora = new Date();
    const expiracao = new Date(auditoriaAtiva.dataExpiracao);
    const diff = expiracao.getTime() - agora.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    
    if (horas <= 0) return "Expirado";
    if (horas < 1) return "Expira em minutos";
    if (horas < 24) return `Expira em ${horas}h`;
    
    const dias = Math.floor(horas / 24);
    return `Expira em ${dias}d ${horas % 24}h`;
  };

  const renderQRCodeCard = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Botão de Pânico - Modo Fiscalização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {auditoriaAtiva ? (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Auditoria ativa! {calcularTempoExpiracao()}
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-2">
              <div className="bg-gray-100 p-4 rounded-lg">
                {qrCode.startsWith('data:image') ? (
                  <img 
                    src={qrCode} 
                    alt="QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="text-6xl font-mono break-all p-4">
                    {qrCode.substring(0, 20)}...
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-semibold">Código de Acesso:</p>
                <p className="text-lg font-mono bg-gray-200 px-3 py-1 rounded">
                  {codigoAcesso}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => acessarAuditoria(qrCode)}
                disabled={acessando}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                {acessando ? "Acessando..." : "Visualizar Auditoria"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={gerarQRCode}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma auditoria ativa. Clique para gerar um novo QR Code.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={gerarQRCode}
              disabled={loading}
              className="w-full"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {loading ? "Gerando..." : "Gerar QR Code"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAuditoriaView = () => {
    if (!acessoData) return null;

    return (
      <div className="space-y-6">
        {/* Cabeçalho da Auditoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Modo Auditoria - Read-Only</span>
              <Badge variant="outline">
                Fiscalização
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Farmácia</p>
                <p className="font-semibold">{acessoData.tenant.nome}</p>
                <p className="text-sm">{acessoData.tenant.cnpj}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Responsável Técnico</p>
                <p className="font-semibold">{acessoData.tenant.responsavel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Período de Acesso</p>
                <p className="font-semibold">
                  {formatarData(acessoData.dataGeracao?.toISOString() ?? "")} - {formatarData(acessoData.dataExpiracao?.toISOString() ?? "")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pops" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pops">POPs</TabsTrigger>
            <TabsTrigger value="certificados">Certificados</TabsTrigger>
            <TabsTrigger value="validades">Validades</TabsTrigger>
            <TabsTrigger value="acessos">Acessos</TabsTrigger>
          </TabsList>

          <TabsContent value="pops">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Master List de POPs
                  </span>
                  <span className="text-sm font-normal">
                    {acessoData.masterListPOPs.length} POPs
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {acessoData.masterListPOPs.map((pop, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {pop.codigo}
                          </span>
                          <span className="font-medium">{pop.titulo}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span>Versão: {pop.versao}</span> | 
                          <span> Setor: {pop.setor}</span> |
                          <span> Responsável: {pop.responsavel}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(pop.status)}>
                          {pop.status}
                        </Badge>
                        {pop.dataValidade && (
                          <p className="text-xs text-gray-600 mt-1">
                            Vence: {new Date(pop.dataValidade).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificados">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Certificados de Treinamento
                  </span>
                  <span className="text-sm font-normal">
                    {acessoData.certificados.length} certificados
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {acessoData.certificados.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cert.colaborador}</span>
                          <span className="text-sm text-gray-600">({cert.funcao})</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span>POP: {cert.pop} - {cert.popTitulo}</span> |
                          <span> Instrutor: {cert.instrutor}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Treinamento: {new Date(cert.dataTreinamento).toLocaleDateString('pt-BR')}
                          {cert.notaQuiz && ` | Nota: ${cert.notaQuiz}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(cert.status)}>
                          {cert.status}
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">
                          Vence: {new Date(cert.validade).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validades">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Cronograma de Validades
                  </span>
                  <span className="text-sm font-normal">
                    {acessoData.cronogramaValidades.length} documentos
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {acessoData.cronogramaValidades.map((validade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {validade.documento}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {validade.tipo}
                          </Badge>
                        </div>
                        {validade.titulo && (
                          <p className="text-sm text-gray-600 mt-1">{validade.titulo}</p>
                        )}
                        {validade.colaborador && (
                          <p className="text-sm text-gray-600">Colaborador: {validade.colaborador}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(validade.status)}>
                          {validade.status}
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">
                          {validade.diasParaVencer === 0 ? "Vence hoje" : 
                           validade.diasParaVencer < 0 ? `Venceu há ${Math.abs(validade.diasParaVencer)} dias` :
                           `Vence em ${validade.diasParaVencer} dias`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(validade.dataValidade).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acessos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Histórico de Acessos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {acessoData.acessos.map((acesso, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {acesso.tipo}
                          </Badge>
                          <span className="text-sm">{acesso.ip}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {formatarData(acesso.data)}
                        </p>
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
  };

  if (acessoData) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Auditoria Fiscalização</h1>
          <p className="text-gray-600">Modo read-only para fiscalização</p>
        </div>
        
        {renderAuditoriaView()}
        
        <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            onClick={() => setAcessoData(null)}
          >
            Voltar para Gerar QR Code
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Botão de Pânico - Fiscalização</h1>
        <p className="text-gray-600">Modo auditoria para acesso rápido do fiscal</p>
      </div>

      {renderQRCodeCard()}
      
      {auditoriaAtiva && (
        <div className="mt-8">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Como usar:</strong> Imprima este QR Code e coloque em local visível no balcão. 
              O fiscal pode escanear ou digitar o código de acesso para visualizar todos os documentos 
              de forma organizada e profissional.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
