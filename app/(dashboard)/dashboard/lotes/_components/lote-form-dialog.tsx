"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LOTE_LABELS } from "@/lib/types";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface MateriaPrima {
  id: string;
  codigo: string;
  nome: string;
  unidadeMedida: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

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
  fornecedorId?: string;
  materiaPrima?: MateriaPrima;
}

interface LoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingLote?: any;
  preSelectedMpId?: string;
}

export function LoteFormDialog({ open, onOpenChange, onSuccess, editingLote, preSelectedMpId }: LoteFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [selectedMp, setSelectedMp] = useState<MateriaPrima | null>(null);
  const [formData, setFormData] = useState({
    numeroLote: "",
    loteInterno: "",
    dataFabricacao: "",
    dataValidade: "",
    dataRecebimento: format(new Date(), "yyyy-MM-dd"),
    quantidade: "",
    quantidadeAtual: "",
    precoUnitario: "",
    notaFiscal: "",
    observacoes: "",
    status: "QUARENTENA",
    materiaPrimaId: "",
    fornecedorId: "",
    // Análises
    aspectoResultado: "",
    aspectoConformidade: "",
    phResultado: "",
    phConformidade: "",
    densidadeResultado: "",
    densidadeConformidade: "",
    teorResultado: "",
    teorConformidade: "",
    umidadeResultado: "",
    umidadeConformidade: "",
  });

  useEffect(() => {
    if (open) {
      fetchMateriasPrimas();
      fetchFornecedores();

      if (editingLote) {
        const analises = editingLote.analises || {};
        setFormData({
          numeroLote: editingLote.numeroLote,
          loteInterno: editingLote.loteInterno || "",
          dataFabricacao: editingLote.dataFabricacao ? format(new Date(editingLote.dataFabricacao), "yyyy-MM-dd") : "",
          dataValidade: format(new Date(editingLote.dataValidade), "yyyy-MM-dd"),
          dataRecebimento: format(new Date(editingLote.dataRecebimento), "yyyy-MM-dd"),
          quantidade: editingLote.quantidade.toString(),
          quantidadeAtual: editingLote.quantidadeAtual.toString(),
          precoUnitario: editingLote.precoUnitario?.toString() || "",
          notaFiscal: editingLote.notaFiscal || "",
          observacoes: editingLote.observacoes || "",
          status: editingLote.status,
          materiaPrimaId: editingLote.materiaPrimaId,
          fornecedorId: editingLote.fornecedorId || "",
          aspectoResultado: analises.aspecto?.resultado || "",
          aspectoConformidade: analises.aspecto?.conformidade || "",
          phResultado: analises.ph?.resultado || "",
          phConformidade: analises.ph?.conformidade || "",
          densidadeResultado: analises.densidade?.resultado || "",
          densidadeConformidade: analises.densidade?.conformidade || "",
          teorResultado: analises.teor?.resultado || "",
          teorConformidade: analises.teor?.conformidade || "",
          umidadeResultado: analises.umidade?.resultado || "",
          umidadeConformidade: analises.umidade?.conformidade || "",
        });
        if (editingLote.materiaPrima) {
          setSelectedMp(editingLote.materiaPrima);
        }
      } else {
        setFormData({
          numeroLote: "",
          loteInterno: "",
          dataFabricacao: "",
          dataValidade: "",
          dataRecebimento: format(new Date(), "yyyy-MM-dd"),
          quantidade: "",
          quantidadeAtual: "",
          precoUnitario: "",
          notaFiscal: "",
          observacoes: "",
          status: "QUARENTENA",
          materiaPrimaId: preSelectedMpId || "",
          fornecedorId: "",
          aspectoResultado: "",
          aspectoConformidade: "",
          phResultado: "",
          phConformidade: "",
          densidadeResultado: "",
          densidadeConformidade: "",
          teorResultado: "",
          teorConformidade: "",
          umidadeResultado: "",
          umidadeConformidade: "",
        });
        setSelectedMp(null);
      }
    }
  }, [open, editingLote, preSelectedMpId]);

  const fetchMateriasPrimas = async () => {
    try {
      const res = await fetch("/api/materias-primas?status=ATIVO");
      const data = await res.json();
      if (data?.materiasPrimas) {
        setMateriasPrimas(data.materiasPrimas);
        if (preSelectedMpId) {
          const mp = data.materiasPrimas.find((m: MateriaPrima) => m.id === preSelectedMpId);
          if (mp) setSelectedMp(mp);
        }
      }
    } catch (error) {
      console.error("Error fetching matérias-primas:", error);
    }
  };

  const fetchFornecedores = async () => {
    try {
      const res = await fetch("/api/fornecedores?ativo=true");
      const data = await res.json();
      if (data?.fornecedores) {
        setFornecedores(data.fornecedores);
      }
    } catch (error) {
      console.error("Error fetching fornecedores:", error);
    }
  };

  const handleMpChange = (mpId: string) => {
    setFormData({ ...formData, materiaPrimaId: mpId });
    const mp = materiasPrimas.find((m) => m.id === mpId);
    setSelectedMp(mp || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const analises = {
        aspecto: { resultado: formData.aspectoResultado, conformidade: formData.aspectoConformidade },
        ph: { resultado: formData.phResultado, conformidade: formData.phConformidade },
        densidade: { resultado: formData.densidadeResultado, conformidade: formData.densidadeConformidade },
        teor: { resultado: formData.teorResultado, conformidade: formData.teorConformidade },
        umidade: { resultado: formData.umidadeResultado, conformidade: formData.umidadeConformidade },
      };

      const payload = {
        numeroLote: formData.numeroLote,
        loteInterno: formData.loteInterno || null,
        dataFabricacao: formData.dataFabricacao || null,
        dataValidade: formData.dataValidade,
        dataRecebimento: formData.dataRecebimento,
        quantidade: formData.quantidade,
        quantidadeAtual: formData.quantidadeAtual || formData.quantidade,
        precoUnitario: formData.precoUnitario || null,
        notaFiscal: formData.notaFiscal || null,
        observacoes: formData.observacoes || null,
        status: formData.status,
        materiaPrimaId: formData.materiaPrimaId,
        fornecedorId: formData.fornecedorId || null,
        analises,
      };

      const url = editingLote ? `/api/lotes/${editingLote.id}` : "/api/lotes";
      const method = editingLote ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar");
      }

      toast.success(editingLote ? "Lote atualizado!" : "Lote criado!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar lote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLote ? "Editar Lote" : "Novo Lote"}
          </DialogTitle>
          <DialogDescription>
            {editingLote ? "Atualize os dados do lote" : "Cadastre um novo lote de matéria-prima"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Matéria-Prima *</Label>
              <Select
                value={formData.materiaPrimaId}
                onValueChange={handleMpChange}
                disabled={!!editingLote}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {materiasPrimas.map((mp) => (
                    <SelectItem key={mp.id} value={mp.id}>
                      {mp.codigo} - {mp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select
                value={formData.fornecedorId}
                onValueChange={(value) => setFormData({ ...formData, fornecedorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroLote">Nº Lote Fabricante *</Label>
              <Input
                id="numeroLote"
                value={formData.numeroLote}
                onChange={(e) => setFormData({ ...formData, numeroLote: e.target.value })}
                placeholder="ABC123"
                required
                disabled={!!editingLote}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loteInterno">Lote Interno</Label>
              <Input
                id="loteInterno"
                value={formData.loteInterno}
                onChange={(e) => setFormData({ ...formData, loteInterno: e.target.value })}
                placeholder="LI-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notaFiscal">Nota Fiscal</Label>
              <Input
                id="notaFiscal"
                value={formData.notaFiscal}
                onChange={(e) => setFormData({ ...formData, notaFiscal: e.target.value })}
                placeholder="NF-12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataFabricacao">Data Fabricação</Label>
              <Input
                id="dataFabricacao"
                type="date"
                value={formData.dataFabricacao}
                onChange={(e) => setFormData({ ...formData, dataFabricacao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataValidade">Data Validade *</Label>
              <Input
                id="dataValidade"
                type="date"
                value={formData.dataValidade}
                onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataRecebimento">Data Recebimento *</Label>
              <Input
                id="dataRecebimento"
                type="date"
                value={formData.dataRecebimento}
                onChange={(e) => setFormData({ ...formData, dataRecebimento: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade Recebida *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    quantidade: e.target.value,
                    quantidadeAtual: editingLote ? formData.quantidadeAtual : e.target.value,
                  })}
                  placeholder="0.00"
                  required
                />
                <span className="text-sm text-muted-foreground w-12">{selectedMp?.unidadeMedida || "un"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidadeAtual">Quantidade Atual</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quantidadeAtual"
                  type="number"
                  step="0.01"
                  value={formData.quantidadeAtual}
                  onChange={(e) => setFormData({ ...formData, quantidadeAtual: e.target.value })}
                  placeholder="0.00"
                />
                <span className="text-sm text-muted-foreground w-12">{selectedMp?.unidadeMedida || "un"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="precoUnitario">Preço Unitário (R$)</Label>
              <Input
                id="precoUnitario"
                type="number"
                step="0.01"
                value={formData.precoUnitario}
                onChange={(e) => setFormData({ ...formData, precoUnitario: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
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
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Análises de Recebimento</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aspecto - Resultado</Label>
                <Input
                  value={formData.aspectoResultado}
                  onChange={(e) => setFormData({ ...formData, aspectoResultado: e.target.value })}
                  placeholder="Conforme especificação"
                />
              </div>
              <div className="space-y-2">
                <Label>Aspecto - Conformidade</Label>
                <Select
                  value={formData.aspectoConformidade}
                  onValueChange={(value) => setFormData({ ...formData, aspectoConformidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">N/A</SelectItem>
                    <SelectItem value="CONFORME">Conforme</SelectItem>
                    <SelectItem value="NAO_CONFORME">Não Conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>pH - Resultado</Label>
                <Input
                  value={formData.phResultado}
                  onChange={(e) => setFormData({ ...formData, phResultado: e.target.value })}
                  placeholder="6.5"
                />
              </div>
              <div className="space-y-2">
                <Label>pH - Conformidade</Label>
                <Select
                  value={formData.phConformidade}
                  onValueChange={(value) => setFormData({ ...formData, phConformidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">N/A</SelectItem>
                    <SelectItem value="CONFORME">Conforme</SelectItem>
                    <SelectItem value="NAO_CONFORME">Não Conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teor - Resultado</Label>
                <Input
                  value={formData.teorResultado}
                  onChange={(e) => setFormData({ ...formData, teorResultado: e.target.value })}
                  placeholder="99.5%"
                />
              </div>
              <div className="space-y-2">
                <Label>Teor - Conformidade</Label>
                <Select
                  value={formData.teorConformidade}
                  onValueChange={(value) => setFormData({ ...formData, teorConformidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">N/A</SelectItem>
                    <SelectItem value="CONFORME">Conforme</SelectItem>
                    <SelectItem value="NAO_CONFORME">Não Conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações sobre o lote"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingLote ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
