"use client";

import { useState, useEffect } from "react";
import { 
  QrCode, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ComplianceQRProps {
  tenantId: string;
}

interface QRData {
  qrCode: string;
  url: string;
  token: string;
  expiresAt: string;
  farmacia: {
    nome: string;
    cnpj: string;
    responsavel: string;
    totalColaboradores: number;
    totalPOPs: number;
  };
  compliance: {
    overallScore: number;
    status: string;
    color: string;
  };
  instructions: string[];
}

export function ComplianceQRCard({ tenantId }: ComplianceQRProps) {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/compliance/qr");
      
      if (!response.ok) {
        throw new Error("Erro ao carregar QR Code");
      }

      const data = await response.json();
      setQrData(data);
    } catch (error) {
      toast.error("Erro ao carregar QR Code de compliance");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const response = await fetch("/api/compliance/qr", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Erro ao regenerar QR Code");
      }

      const data = await response.json();
      setQrData(data);
      toast.success("QR Code regenerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao regenerar QR Code");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrData?.qrCode) return;

    // Converter base64 para blob
    const base64Data = qrData.qrCode.replace(/^data:image\/png;base64,/, "");
    const blob = new Blob([Buffer.from(base64Data, "base64")], { type: "image/png" });
    const url = URL.createObjectURL(blob);

    // Criar link de download
    const link = document.createElement("a");
    link.href = url;
    link.download = `QR-Compliance-${qrData.farmacia.nome.replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("QR Code baixado com sucesso!");
  };

  const handleCopyUrl = () => {
    if (!qrData?.url) return;
    
    navigator.clipboard.writeText(qrData.url);
    setCopied(true);
    toast.success("URL copiada para a área de transferência!");
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!qrData?.qrCode) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code de Compliance - ${qrData.farmacia.nome}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .container {
              max-width: 400px;
              border: 2px solid #0d9488;
              border-radius: 16px;
              padding: 30px;
              background: #f0fdfa;
            }
            .qr-code {
              width: 300px;
              height: 300px;
              margin: 20px auto;
              border-radius: 8px;
            }
            h1 {
              color: #0f766e;
              font-size: 24px;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 14px;
              margin-bottom: 20px;
            }
            .info {
              background: white;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
              text-align: left;
              font-size: 12px;
              color: #666;
            }
            .footer {
              margin-top: 30px;
              font-size: 10px;
              color: #999;
            }
            .badge {
              display: inline-block;
              background: #0d9488;
              color: white;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="badge">FISCALIZAÇÃO ANVISA</div>
            <h1>${qrData.farmacia.nome}</h1>
            <p class="subtitle">Escaneie para verificar conformidade em tempo real</p>
            <img src="${qrData.qrCode}" alt="QR Code" class="qr-code" />
            <div class="info">
              <strong>Instruções:</strong><br>
              1. Abra o aplicativo de câmera do celular<br>
              2. Aponte para o QR Code<br>
              3. Acesse o painel de compliance<br>
              <br>
              <strong>Válido até:</strong> ${new Date(qrData.expiresAt).toLocaleDateString("pt-BR")}
            </div>
            <p class="footer">
              VISADOCS 360 - Gestão de Compliance Farmacêutico<br>
              Dados atualizados em tempo real conforme RDC 67/2007
            </p>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusColor = (color: string) => {
    const colors: Record<string, string> = {
      green: "bg-green-100 text-green-800 border-green-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      red: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <QrCode className="w-12 h-12 text-teal-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Carregando QR Code...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!qrData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar QR Code. Tente novamente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const diasRestantes = Math.ceil(
    (new Date(qrData.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              QR Code de Fiscalização
            </CardTitle>
            <CardDescription className="mt-1">
              Acesso rápido para fiscais e auditores verificarem compliance
            </CardDescription>
          </div>
          <Badge className={getStatusColor(qrData.compliance.color)}>
            {qrData.compliance.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Code Image */}
        <div className="flex flex-col items-center">
          <div className="relative bg-white p-4 rounded-xl border-2 border-teal-100 shadow-sm">
            <img
              src={qrData.qrCode}
              alt="QR Code de Compliance"
              className="w-64 h-64"
            />
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
              <Badge variant="outline" className="bg-white text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Válido por {diasRestantes} dias
              </Badge>
            </div>
          </div>
        </div>

        {/* Score de Compliance */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Score de Compliance Atual</p>
          <p className={`text-3xl font-bold ${
            qrData.compliance.overallScore >= 70 ? "text-green-600" : "text-orange-600"
          }`}>
            {qrData.compliance.overallScore}%
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-teal-50 rounded-lg">
            <p className="text-2xl font-bold text-teal-600">
              {qrData.farmacia.totalColaboradores}
            </p>
            <p className="text-xs text-gray-600">Colaboradores</p>
          </div>
          <div className="text-center p-3 bg-teal-50 rounded-lg">
            <p className="text-2xl font-bold text-teal-600">
              {qrData.farmacia.totalPOPs}
            </p>
            <p className="text-xs text-gray-600">POPs Ativos</p>
          </div>
        </div>

        <Separator />

        {/* URL de Acesso */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">URL de Acesso:</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-gray-100 p-2 rounded text-xs break-all">
              {qrData.url}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Como usar:
          </p>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            {qrData.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button 
            onClick={handleDownload} 
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar PNG
          </Button>
          <Button 
            onClick={handlePrint} 
            variant="outline" 
            className="flex-1"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
        <Button
          onClick={handleRegenerate}
          disabled={regenerating}
          variant="outline"
          className="w-full"
        >
          {regenerating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {regenerating ? "Regenerando..." : "Gerar Novo QR Code"}
        </Button>
        <p className="text-xs text-gray-500 text-center">
          Ao regenerar, o QR Code anterior será invalidado automaticamente.
        </p>
      </CardFooter>
    </Card>
  );
}
