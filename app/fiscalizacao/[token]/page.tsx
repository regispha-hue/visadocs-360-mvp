"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Award, Building2, Calendar, Shield, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";

interface PortalData {
  farmacia: {
    id: string;
    nome: string;
    cnpj: string;
    responsavel: string;
    email: string;
    telefone: string;
    status: string;
  };
  popsPorSetor: Record<string, any[]>;
  colaboradores: any[];
  certificados: any[];
  totalPOPs: number;
  totalColaboradores: number;
  totalCertificados: number;
  acessadoEm: string;
}

export default function FiscalizacaoPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/fiscalizacao/public/${token}`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Token inválido");
        }
        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { farmacia, popsPorSetor, colaboradores, certificados, totalPOPs, totalColaboradores, totalCertificados } = data;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-8 w-8 text-teal-600" />
          <h1 className="text-2xl font-bold">Portal de Fiscalização ANVISA</h1>
        </div>
        <p className="text-muted-foreground">
          Documentação de Procedimentos Operacionais Padrão conforme RDC 67/2007
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Acesso em: {new Date(data.acessadoEm).toLocaleString("pt-BR")}
        </p>
      </div>

      {/* Farmácia Info */}
      <Card className="mb-6 border-teal-200">
        <CardHeader className="bg-teal-50">
          <CardTitle className="flex items-center gap-2 text-teal-800">
            <Building2 className="h-5 w-5" />
            {farmacia.nome}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-medium">{farmacia.cnpj}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Responsável Técnico</p>
              <p className="font-medium">{farmacia.responsavel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={farmacia.status === "ATIVO" ? "default" : "secondary"}>
                {farmacia.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{totalPOPs}</p>
              <p className="text-sm text-muted-foreground">POPs Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Users className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{totalColaboradores}</p>
              <p className="text-sm text-muted-foreground">Colaboradores</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Award className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{totalCertificados}</p>
              <p className="text-sm text-muted-foreground">Certificados Válidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pops" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pops">POPs por Setor</TabsTrigger>
          <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
        </TabsList>

        <TabsContent value="pops" className="space-y-4">
          {Object.entries(popsPorSetor).map(([setor, pops]) => (
            <Card key={setor}>
              <CardHeader>
                <CardTitle className="text-lg">{setor}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pops.map((pop: any) => (
                    <div key={pop.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{pop.codigo} - {pop.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          Versão: {pop.versao} | Revisão: {new Date(pop.dataRevisao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant="outline">{pop.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="colaboradores">
          <Card>
            <CardHeader>
              <CardTitle>Equipe da Farmácia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {colaboradores.map((col) => (
                  <div key={col.id} className="p-3 border rounded-lg">
                    <p className="font-medium">{col.nome}</p>
                    <p className="text-sm text-muted-foreground">{col.funcao} - {col.setor}</p>
                    <p className="text-xs text-muted-foreground">
                      Admissão: {new Date(col.dataAdmissao).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificados">
          <Card>
            <CardHeader>
              <CardTitle>Certificados de Treinamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Total de {totalCertificados} certificados válidos emitidos
              </p>
              <div className="space-y-2">
                {certificados.map((cert: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <Award className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Certificado emitido em {new Date(cert.data).toLocaleDateString("pt-BR")}
                      {cert.nota && ` - Nota: ${cert.nota.toFixed(1)}`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Portal de Fiscalização VISADOCS - Conformidade RDC 67/2007</p>
        <p>Documentação digital para farmácias de manipulação</p>
      </div>
    </div>
  );
}
