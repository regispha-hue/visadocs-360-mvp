"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { STATUS_LOTE_LABELS } from "@/lib/types";
import { LoteFormDialog } from "../_components/lote-form-dialog";

interface Lote {
  id: string;
  numeroLote: string;
  loteInterno?: string;
  dataFabricacao?: string;
  dataValidade: string;
  dataRecebimento: string;
  quantidade: number;
  quantidadeAtual: number;
  precoUnitario?: number;
  notaFiscal?: string;
  analises?: any;
  observacoes?: string;
  status: string;
  materiaPrimaId: string;
  materiaPrima?: {
    id: string;
    codigo: string;
    nome: string;
    unidadeMedida: string;
    especificacoes?: any;
  };
  fornecedor?: {
    id: string;
    nome: string;
    cnpj?: string;
    telefone?: string;
    email?: string;
  };
  createdAt: string;
}

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "secondary" | "destructive"; label: string }> = {
  QUARENTENA: { variant: "warning", label: "Quarentena" },
  APROVADO: { variant: "success", label: "Aprovado" },
  REPROVADO: { variant: "destructive", label: "Reprovado" },
  VENCIDO: { variant: "destructive", label: "Vencido" },
  EM_USO: { variant: "success", label: "Em Uso" },
  ESGOTADO: { variant: "secondary", label: "Esgotado" },
};

export default function LoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [lote, setLote] = useState<Lote | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchLote = async () => {
    try {
      const res = await fetch(`/api/lotes/${params.id}`);
      const data = await res.json();
      if (data?.lote) {
        setLote(data.lote);
      } else {
        toast.error("Lote não encontrado");
        router.push("/dashboard/lotes");
      }
    } catch (error) {
      toast.error("Erro ao carregar lote");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLote();
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!lote) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/lotes/${lote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar status");
      }

      toast.success("Status atualizado!");
      fetchLote();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!lote) {
    return null;
  }

  const badge = STATUS_BADGES[lote.status] || { variant: "secondary", label: lote.status };
  const diasParaVencer = differenceInDays(new Date(lote.dataValidade), new Date());
  const isExpired = diasParaVencer < 0;
  const isExpiringSoon = diasParaVencer >= 0 && diasParaVencer <= 30;
  const analises = lote.analises || {};
  const specs = lote.materiaPrima?.especificacoes || {};

  const ConformidadeIcon = ({ value }: { value?: string }) => {
    if (!value) return null;
    if (value === "CONFORME") return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (value === "NAO_CONFORME") return <XCircle className="h-4 w-4 text-red-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`Lote ${lote.numeroLote}`}
          description={lote.materiaPrima?.nome || ""}
        >
          <Button onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </PageHeader>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {(isExpired || isExpiringSoon) && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {isExpired ? "Vencido" : `Vence em ${diasParaVencer} dias`}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quantidade Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lote.quantidadeAtual.toFixed(2)} {lote.materiaPrima?.unidadeMedida}
            </div>
            <p className="text-xs text-muted-foreground">
              de {lote.quantidade.toFixed(2)} {lote.materiaPrima?.unidadeMedida} recebidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isExpired ? "text-red-600" : isExpiringSoon ? "text-orange-600" : ""}`}>
              {format(new Date(lote.dataValidade), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <p className="text-xs text-muted-foreground">
              {isExpired ? "Vencido" : `${diasParaVencer} dias restantes`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recebimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(lote.dataRecebimento), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alterar Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={lote.status} onValueChange={handleStatusChange} disabled={statusLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LOTE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="analises">Análises</TabsTrigger>
          <TabsTrigger value="rastreabilidade">Rastreabilidade</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Lote</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nº Lote Fabricante</Label>
                    <p className="font-mono font-medium">{lote.numeroLote}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Lote Interno</Label>
                    <p className="font-medium">{lote.loteInterno || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Data Fabricação</Label>
                    <p className="font-medium">
                      {lote.dataFabricacao ? format(new Date(lote.dataFabricacao), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nota Fiscal</Label>
                    <p className="font-medium">{lote.notaFiscal || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Quantidade Recebida</Label>
                    <p className="font-medium">{lote.quantidade.toFixed(2)} {lote.materiaPrima?.unidadeMedida}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Preço Unitário</Label>
                    <p className="font-medium">
                      {lote.precoUnitario ? `R$ ${lote.precoUnitario.toFixed(2)}` : "-"}
                    </p>
                  </div>
                </div>
                {lote.observacoes && (
                  <div>
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="font-medium">{lote.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matéria-Prima</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lote.materiaPrima && (
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm">{lote.materiaPrima.codigo}</p>
                        <p className="font-medium text-lg">{lote.materiaPrima.nome}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/materias-primas/${lote.materiaPrima.id}`}>
                          Ver Ficha
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {lote.fornecedor && (
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground">Fornecedor</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="font-medium">{lote.fornecedor.nome}</p>
                      {lote.fornecedor.cnpj && (
                        <p className="text-sm text-muted-foreground">CNPJ: {lote.fornecedor.cnpj}</p>
                      )}
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        {lote.fornecedor.telefone && <span>{lote.fornecedor.telefone}</span>}
                        {lote.fornecedor.email && <span>{lote.fornecedor.email}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analises">
          <Card>
            <CardHeader>
              <CardTitle>Análises de Recebimento</CardTitle>
              <CardDescription>Resultados das análises realizadas no recebimento do lote</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Parâmetro</th>
                      <th className="text-left py-3 px-4 font-medium">Especificação</th>
                      <th className="text-left py-3 px-4 font-medium">Resultado</th>
                      <th className="text-left py-3 px-4 font-medium">Conformidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Aspecto</td>
                      <td className="py-3 px-4 text-muted-foreground">{specs.aspecto || "-"}</td>
                      <td className="py-3 px-4">{analises.aspecto?.resultado || "-"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ConformidadeIcon value={analises.aspecto?.conformidade} />
                          <span>{analises.aspecto?.conformidade === "CONFORME" ? "Conforme" : analises.aspecto?.conformidade === "NAO_CONFORME" ? "Não Conforme" : "-"}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">pH</td>
                      <td className="py-3 px-4 text-muted-foreground">{specs.ph || "-"}</td>
                      <td className="py-3 px-4">{analises.ph?.resultado || "-"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ConformidadeIcon value={analises.ph?.conformidade} />
                          <span>{analises.ph?.conformidade === "CONFORME" ? "Conforme" : analises.ph?.conformidade === "NAO_CONFORME" ? "Não Conforme" : "-"}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Densidade</td>
                      <td className="py-3 px-4 text-muted-foreground">{specs.densidade || "-"}</td>
                      <td className="py-3 px-4">{analises.densidade?.resultado || "-"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ConformidadeIcon value={analises.densidade?.conformidade} />
                          <span>{analises.densidade?.conformidade === "CONFORME" ? "Conforme" : analises.densidade?.conformidade === "NAO_CONFORME" ? "Não Conforme" : "-"}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Teor</td>
                      <td className="py-3 px-4 text-muted-foreground">{specs.teor || "-"}</td>
                      <td className="py-3 px-4">{analises.teor?.resultado || "-"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ConformidadeIcon value={analises.teor?.conformidade} />
                          <span>{analises.teor?.conformidade === "CONFORME" ? "Conforme" : analises.teor?.conformidade === "NAO_CONFORME" ? "Não Conforme" : "-"}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Umidade</td>
                      <td className="py-3 px-4 text-muted-foreground">{specs.umidade || "-"}</td>
                      <td className="py-3 px-4">{analises.umidade?.resultado || "-"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ConformidadeIcon value={analises.umidade?.conformidade} />
                          <span>{analises.umidade?.conformidade === "CONFORME" ? "Conforme" : analises.umidade?.conformidade === "NAO_CONFORME" ? "Não Conforme" : "-"}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rastreabilidade">
          <Card>
            <CardHeader>
              <CardTitle>Rastreabilidade</CardTitle>
              <CardDescription>Histórico e rastreabilidade do lote</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">Lote cadastrado no sistema</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(lote.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">Recebimento do lote</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(lote.dataRecebimento), "dd/MM/yyyy", { locale: ptBR })}
                      {lote.fornecedor && ` - Fornecedor: ${lote.fornecedor.nome}`}
                    </p>
                  </div>
                </div>
                {lote.dataFabricacao && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                    <div>
                      <p className="font-medium">Fabricação</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(lote.dataFabricacao), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 mt-2 rounded-full ${isExpired ? "bg-red-500" : "bg-orange-500"}`} />
                  <div>
                    <p className="font-medium">Validade</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(lote.dataValidade), "dd/MM/yyyy", { locale: ptBR })}
                      {isExpired ? " - VENCIDO" : ` - ${diasParaVencer} dias restantes`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LoteFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchLote}
        editingLote={lote}
      />
    </div>
  );
}
