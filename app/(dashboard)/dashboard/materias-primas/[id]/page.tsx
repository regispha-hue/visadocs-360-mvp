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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Link2, Unlink, Edit, Eye, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { STATUS_MATERIA_PRIMA_LABELS, STATUS_LOTE_LABELS } from "@/lib/types";
import { MpFormDialog } from "../_components/mp-form-dialog";

interface MateriaPrima {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  casNumber?: string;
  dci?: string;
  categoria?: string;
  unidadeMedida: string;
  estoqueMinimo?: number;
  especificacoes?: any;
  status: string;
  fornecedor?: { id: string; nome: string; cnpj: string; telefone: string; email: string };
  lotes: any[];
  pops: any[];
  createdAt: string;
}

interface Pop {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
}

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "secondary" | "destructive"; label: string }> = {
  ATIVO: { variant: "success", label: "Ativo" },
  INATIVO: { variant: "secondary", label: "Inativo" },
  DESCONTINUADO: { variant: "warning", label: "Descontinuado" },
};

const LOTE_STATUS_BADGES: Record<string, { variant: "success" | "warning" | "secondary" | "destructive"; label: string }> = {
  QUARENTENA: { variant: "warning", label: "Quarentena" },
  APROVADO: { variant: "success", label: "Aprovado" },
  REPROVADO: { variant: "destructive", label: "Reprovado" },
  VENCIDO: { variant: "destructive", label: "Vencido" },
  EM_USO: { variant: "success", label: "Em Uso" },
  ESGOTADO: { variant: "secondary", label: "Esgotado" },
};

export default function MateriaPrimaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [materiaPrima, setMateriaPrima] = useState<MateriaPrima | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkPopDialogOpen, setLinkPopDialogOpen] = useState(false);
  const [availablePops, setAvailablePops] = useState<Pop[]>([]);
  const [selectedPopId, setSelectedPopId] = useState("");
  const [linkQuantidade, setLinkQuantidade] = useState("");
  const [linkObservacoes, setLinkObservacoes] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);

  const fetchMateriaPrima = async () => {
    try {
      const res = await fetch(`/api/materias-primas/${params.id}`);
      const data = await res.json();
      if (data?.materiaPrima) {
        setMateriaPrima(data.materiaPrima);
      } else {
        toast.error("Matéria-prima não encontrada");
        router.push("/dashboard/materias-primas");
      }
    } catch (error) {
      toast.error("Erro ao carregar matéria-prima");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePops = async () => {
    try {
      const res = await fetch("/api/pops?status=ATIVO");
      const data = await res.json();
      if (data?.pops) {
        // Filter out already linked POPs
        const linkedPopIds = materiaPrima?.pops.map((p) => p.pop.id) || [];
        setAvailablePops(data.pops.filter((p: Pop) => !linkedPopIds.includes(p.id)));
      }
    } catch (error) {
      console.error("Error fetching POPs:", error);
    }
  };

  useEffect(() => {
    fetchMateriaPrima();
  }, [params.id]);

  useEffect(() => {
    if (linkPopDialogOpen && materiaPrima) {
      fetchAvailablePops();
    }
  }, [linkPopDialogOpen, materiaPrima]);

  const handleLinkPop = async () => {
    if (!selectedPopId) {
      toast.error("Selecione um POP");
      return;
    }

    setLinkLoading(true);
    try {
      const res = await fetch(`/api/materias-primas/${params.id}/pops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          popId: selectedPopId,
          quantidade: linkQuantidade || null,
          observacoes: linkObservacoes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao vincular");
      }

      toast.success("POP vinculado com sucesso!");
      setLinkPopDialogOpen(false);
      setSelectedPopId("");
      setLinkQuantidade("");
      setLinkObservacoes("");
      fetchMateriaPrima();
    } catch (error: any) {
      toast.error(error.message || "Erro ao vincular POP");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkPop = async (popId: string) => {
    try {
      const res = await fetch(`/api/materias-primas/${params.id}/pops?popId=${popId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao desvincular");
      }

      toast.success("POP desvinculado!");
      fetchMateriaPrima();
    } catch (error: any) {
      toast.error(error.message || "Erro ao desvincular POP");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!materiaPrima) {
    return null;
  }

  const specs = materiaPrima.especificacoes || {};
  const badge = STATUS_BADGES[materiaPrima.status] || { variant: "secondary", label: materiaPrima.status };

  // Calculate current stock from approved/in-use lots
  const estoqueAtual = materiaPrima.lotes
    .filter((l) => ["APROVADO", "EM_USO"].includes(l.status))
    .reduce((acc, l) => acc + l.quantidadeAtual, 0);

  const abaixoMinimo = materiaPrima.estoqueMinimo && estoqueAtual < materiaPrima.estoqueMinimo;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={materiaPrima.nome}
          description={`Código: ${materiaPrima.codigo}`}
        >
          <Button onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </PageHeader>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {materiaPrima.categoria && <Badge variant="outline">{materiaPrima.categoria}</Badge>}
        {abaixoMinimo && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Estoque Baixo
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estoque Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estoqueAtual.toFixed(2)} {materiaPrima.unidadeMedida}
            </div>
            {materiaPrima.estoqueMinimo && (
              <p className="text-xs text-muted-foreground">
                Mínimo: {materiaPrima.estoqueMinimo} {materiaPrima.unidadeMedida}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lotes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materiaPrima.lotes.filter((l) => ["APROVADO", "EM_USO", "QUARENTENA"].includes(l.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {materiaPrima.lotes.length} lotes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">POPs Vinculados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materiaPrima.pops.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="especificacoes">Especificações</TabsTrigger>
          <TabsTrigger value="lotes">Lotes ({materiaPrima.lotes.length})</TabsTrigger>
          <TabsTrigger value="pops">POPs ({materiaPrima.pops.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Código</Label>
                <p className="font-medium">{materiaPrima.codigo}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nome</Label>
                <p className="font-medium">{materiaPrima.nome}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">CAS Number</Label>
                <p className="font-medium">{materiaPrima.casNumber || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">DCI</Label>
                <p className="font-medium">{materiaPrima.dci || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Categoria</Label>
                <p className="font-medium">{materiaPrima.categoria || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Unidade de Medida</Label>
                <p className="font-medium">{materiaPrima.unidadeMedida}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="font-medium">{materiaPrima.descricao || "-"}</p>
              </div>
              {materiaPrima.fornecedor && (
                <div className="md:col-span-2 border-t pt-4">
                  <Label className="text-muted-foreground">Fornecedor Principal</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="font-medium">{materiaPrima.fornecedor.nome}</p>
                    {materiaPrima.fornecedor.cnpj && (
                      <p className="text-sm text-muted-foreground">CNPJ: {materiaPrima.fornecedor.cnpj}</p>
                    )}
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      {materiaPrima.fornecedor.telefone && <span>{materiaPrima.fornecedor.telefone}</span>}
                      {materiaPrima.fornecedor.email && <span>{materiaPrima.fornecedor.email}</span>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="especificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Especificações Físico-Químicas</CardTitle>
              <CardDescription>Parâmetros de qualidade da matéria-prima</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Aspecto</Label>
                <p className="font-medium">{specs.aspecto || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Cor</Label>
                <p className="font-medium">{specs.cor || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Odor</Label>
                <p className="font-medium">{specs.odor || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">pH</Label>
                <p className="font-medium">{specs.ph || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Densidade</Label>
                <p className="font-medium">{specs.densidade || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Solubilidade</Label>
                <p className="font-medium">{specs.solubilidade || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Ponto de Fusão</Label>
                <p className="font-medium">{specs.pontoFusao || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Teor</Label>
                <p className="font-medium">{specs.teor || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Umidade</Label>
                <p className="font-medium">{specs.umidade || "-"}</p>
              </div>
              {specs.outrasEspecificacoes && (
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Outras Especificações</Label>
                  <p className="font-medium">{specs.outrasEspecificacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lotes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lotes</CardTitle>
                <CardDescription>Controle de lotes e rastreabilidade</CardDescription>
              </div>
              <Button asChild>
                <Link href={`/dashboard/lotes?materiaPrimaId=${materiaPrima.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lote
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {materiaPrima.lotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum lote cadastrado para esta matéria-prima
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lote</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materiaPrima.lotes.map((lote) => {
                      const loteBadge = LOTE_STATUS_BADGES[lote.status] || { variant: "secondary", label: lote.status };
                      const isExpiringSoon = new Date(lote.dataValidade) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      return (
                        <TableRow key={lote.id}>
                          <TableCell className="font-mono">{lote.numeroLote}</TableCell>
                          <TableCell>{lote.fornecedor?.nome || "-"}</TableCell>
                          <TableCell>
                            <span className={isExpiringSoon ? "text-orange-600 font-medium" : ""}>
                              {format(new Date(lote.dataValidade), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {lote.quantidadeAtual.toFixed(2)} / {lote.quantidade.toFixed(2)} {materiaPrima.unidadeMedida}
                          </TableCell>
                          <TableCell>
                            <Badge variant={loteBadge.variant}>{loteBadge.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/dashboard/lotes/${lote.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pops">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>POPs Vinculados</CardTitle>
                <CardDescription>Procedimentos que utilizam esta matéria-prima</CardDescription>
              </div>
              <Button onClick={() => setLinkPopDialogOpen(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Vincular POP
              </Button>
            </CardHeader>
            <CardContent>
              {materiaPrima.pops.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum POP vinculado a esta matéria-prima
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materiaPrima.pops.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-mono">{link.pop.codigo}</TableCell>
                        <TableCell>{link.pop.titulo}</TableCell>
                        <TableCell>
                          <Badge variant={link.pop.status === "ATIVO" ? "success" : "secondary"}>
                            {link.pop.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {link.quantidade ? `${link.quantidade} ${materiaPrima.unidadeMedida}` : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {link.observacoes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/dashboard/pops/${link.pop.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUnlinkPop(link.pop.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MpFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchMateriaPrima}
        editingMp={materiaPrima}
      />

      <Dialog open={linkPopDialogOpen} onOpenChange={setLinkPopDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular POP</DialogTitle>
            <DialogDescription>
              Vincule um POP a esta matéria-prima
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>POP *</Label>
              <Select value={selectedPopId} onValueChange={setSelectedPopId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um POP" />
                </SelectTrigger>
                <SelectContent>
                  {availablePops.map((pop) => (
                    <SelectItem key={pop.id} value={pop.id}>
                      {pop.codigo} - {pop.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade utilizada</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={linkQuantidade}
                  onChange={(e) => setLinkQuantidade(e.target.value)}
                  placeholder="0.00"
                />
                <span className="text-sm text-muted-foreground">{materiaPrima.unidadeMedida}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={linkObservacoes}
                onChange={(e) => setLinkObservacoes(e.target.value)}
                placeholder="Observações sobre o uso neste POP"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkPopDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkPop} disabled={linkLoading || !selectedPopId}>
              {linkLoading ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
