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
import { CATEGORIAS_MP, UNIDADES_MEDIDA, STATUS_MATERIA_PRIMA_LABELS } from "@/lib/types";
import toast from "react-hot-toast";

interface Fornecedor {
  id: string;
  nome: string;
}

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
  fornecedorId?: string;
}

interface MpFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingMp?: MateriaPrima | null;
}

export function MpFormDialog({ open, onOpenChange, onSuccess, editingMp }: MpFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    descricao: "",
    casNumber: "",
    dci: "",
    categoria: "",
    unidadeMedida: "g",
    estoqueMinimo: "",
    fornecedorId: "",
    status: "ATIVO",
    // Especificações físico-químicas
    aspecto: "",
    cor: "",
    odor: "",
    ph: "",
    densidade: "",
    solubilidade: "",
    pontoFusao: "",
    teor: "",
    umidade: "",
    outrasEspecificacoes: "",
  });

  useEffect(() => {
    if (open) {
      fetchFornecedores();
      if (editingMp) {
        const specs = editingMp.especificacoes || {};
        setFormData({
          codigo: editingMp.codigo,
          nome: editingMp.nome,
          descricao: editingMp.descricao || "",
          casNumber: editingMp.casNumber || "",
          dci: editingMp.dci || "",
          categoria: editingMp.categoria || "",
          unidadeMedida: editingMp.unidadeMedida,
          estoqueMinimo: editingMp.estoqueMinimo?.toString() || "",
          fornecedorId: editingMp.fornecedorId || "",
          status: editingMp.status,
          aspecto: specs.aspecto || "",
          cor: specs.cor || "",
          odor: specs.odor || "",
          ph: specs.ph || "",
          densidade: specs.densidade || "",
          solubilidade: specs.solubilidade || "",
          pontoFusao: specs.pontoFusao || "",
          teor: specs.teor || "",
          umidade: specs.umidade || "",
          outrasEspecificacoes: specs.outrasEspecificacoes || "",
        });
      } else {
        setFormData({
          codigo: "",
          nome: "",
          descricao: "",
          casNumber: "",
          dci: "",
          categoria: "",
          unidadeMedida: "g",
          estoqueMinimo: "",
          fornecedorId: "",
          status: "ATIVO",
          aspecto: "",
          cor: "",
          odor: "",
          ph: "",
          densidade: "",
          solubilidade: "",
          pontoFusao: "",
          teor: "",
          umidade: "",
          outrasEspecificacoes: "",
        });
      }
    }
  }, [open, editingMp]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const especificacoes = {
        aspecto: formData.aspecto,
        cor: formData.cor,
        odor: formData.odor,
        ph: formData.ph,
        densidade: formData.densidade,
        solubilidade: formData.solubilidade,
        pontoFusao: formData.pontoFusao,
        teor: formData.teor,
        umidade: formData.umidade,
        outrasEspecificacoes: formData.outrasEspecificacoes,
      };

      const payload = {
        codigo: formData.codigo,
        nome: formData.nome,
        descricao: formData.descricao || null,
        casNumber: formData.casNumber || null,
        dci: formData.dci || null,
        categoria: formData.categoria || null,
        unidadeMedida: formData.unidadeMedida,
        estoqueMinimo: formData.estoqueMinimo || null,
        fornecedorId: formData.fornecedorId || null,
        status: formData.status,
        especificacoes,
      };

      const url = editingMp ? `/api/materias-primas/${editingMp.id}` : "/api/materias-primas";
      const method = editingMp ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar");
      }

      toast.success(editingMp ? "Matéria-prima atualizada!" : "Matéria-prima criada!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar matéria-prima");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingMp ? "Editar Matéria-Prima" : "Nova Matéria-Prima"}
          </DialogTitle>
          <DialogDescription>
            {editingMp ? "Atualize os dados da matéria-prima" : "Cadastre uma nova matéria-prima"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="MP-001"
                required
                disabled={!!editingMp}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da matéria-prima"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="casNumber">CAS Number</Label>
              <Input
                id="casNumber"
                value={formData.casNumber}
                onChange={(e) => setFormData({ ...formData, casNumber: e.target.value })}
                placeholder="00000-00-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dci">DCI</Label>
              <Input
                id="dci"
                value={formData.dci}
                onChange={(e) => setFormData({ ...formData, dci: e.target.value })}
                placeholder="Denominação Comum Internacional"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_MP.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade de Medida *</Label>
              <Select
                value={formData.unidadeMedida}
                onValueChange={(value) => setFormData({ ...formData, unidadeMedida: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((un) => (
                    <SelectItem key={un} value={un}>
                      {un}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                step="0.01"
                value={formData.estoqueMinimo}
                onChange={(e) => setFormData({ ...formData, estoqueMinimo: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fornecedor Principal</Label>
              <Select
                value={formData.fornecedorId}
                onValueChange={(value) => setFormData({ ...formData, fornecedorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
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
                  {Object.entries(STATUS_MATERIA_PRIMA_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da matéria-prima"
              rows={2}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Especificações Físico-Químicas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aspecto">Aspecto</Label>
                <Input
                  id="aspecto"
                  value={formData.aspecto}
                  onChange={(e) => setFormData({ ...formData, aspecto: e.target.value })}
                  placeholder="Ex: Pó branco cristalino"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Input
                  id="cor"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  placeholder="Ex: Branco"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odor">Odor</Label>
                <Input
                  id="odor"
                  value={formData.odor}
                  onChange={(e) => setFormData({ ...formData, odor: e.target.value })}
                  placeholder="Ex: Inodoro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ph">pH</Label>
                <Input
                  id="ph"
                  value={formData.ph}
                  onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                  placeholder="Ex: 5.0 - 7.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="densidade">Densidade</Label>
                <Input
                  id="densidade"
                  value={formData.densidade}
                  onChange={(e) => setFormData({ ...formData, densidade: e.target.value })}
                  placeholder="Ex: 1.2 g/mL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="solubilidade">Solubilidade</Label>
                <Input
                  id="solubilidade"
                  value={formData.solubilidade}
                  onChange={(e) => setFormData({ ...formData, solubilidade: e.target.value })}
                  placeholder="Ex: Solúvel em água"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pontoFusao">Ponto de Fusão</Label>
                <Input
                  id="pontoFusao"
                  value={formData.pontoFusao}
                  onChange={(e) => setFormData({ ...formData, pontoFusao: e.target.value })}
                  placeholder="Ex: 135-137°C"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teor">Teor</Label>
                <Input
                  id="teor"
                  value={formData.teor}
                  onChange={(e) => setFormData({ ...formData, teor: e.target.value })}
                  placeholder="Ex: 99.0 - 101.0%"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="umidade">Umidade</Label>
                <Input
                  id="umidade"
                  value={formData.umidade}
                  onChange={(e) => setFormData({ ...formData, umidade: e.target.value })}
                  placeholder="Ex: Máx. 0.5%"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="outrasEspecificacoes">Outras Especificações</Label>
              <Textarea
                id="outrasEspecificacoes"
                value={formData.outrasEspecificacoes}
                onChange={(e) => setFormData({ ...formData, outrasEspecificacoes: e.target.value })}
                placeholder="Outras especificações relevantes"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingMp ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
