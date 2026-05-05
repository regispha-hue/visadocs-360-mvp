"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Briefcase, Plus, Users, BookOpen, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/loading-spinner";
import { KIT_CATALOG } from "@/lib/kit-catalog";

interface Cargo {
  id: string;
  nome: string;
  descricao: string | null;
  kitIds: string[];
  funcaoPadrao: string | null;
  setorPadrao: string | null;
  ativo: boolean;
  _count: {
    colaboradores: number;
  };
}

const FUNCOES = ["RT", "ANALISTA_CQ", "MANIPULADOR", "OPERADOR", "AUXILIAR"];
const SETORES = [
  "Gestão Qualidade",
  "RH e Pessoal",
  "Fornecedores",
  "Infraestrutura",
  "Equipamentos",
  "Limpeza",
  "Atendimento",
  "Escrituração",
  "Controle Qualidade",
  "Almoxarifado",
  "Manipulação",
  "Água Purificada",
];

export default function CargosPage() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    kitIds: [] as string[],
    funcaoPadrao: "",
    setorPadrao: "",
  });

  const fetchCargos = async () => {
    try {
      const res = await fetch("/api/cargos");
      const data = await res.json();
      if (data.cargos) {
        setCargos(data.cargos);
      }
    } catch (error) {
      toast.error("Erro ao carregar cargos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.kitIds.length === 0) {
      toast.error("Selecione pelo menos um kit");
      return;
    }

    try {
      const url = editingCargo ? `/api/cargos/${editingCargo.id}` : "/api/cargos";
      const method = editingCargo ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingCargo ? "Cargo atualizado" : "Cargo criado");
        setDialogOpen(false);
        setEditingCargo(null);
        setFormData({ nome: "", descricao: "", kitIds: [], funcaoPadrao: "", setorPadrao: "" });
        fetchCargos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erro ao salvar");
      }
    } catch (error) {
      toast.error("Erro ao salvar cargo");
    }
  };

  const handleDelete = async (cargo: Cargo) => {
    if (!confirm(`Excluir cargo "${cargo.nome}"?`)) return;

    try {
      const res = await fetch(`/api/cargos/${cargo.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Cargo excluído");
        fetchCargos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erro ao excluir");
      }
    } catch (error) {
      toast.error("Erro ao excluir cargo");
    }
  };

  const columns = [
    {
      key: "nome",
      header: "Cargo",
      render: (cargo: Cargo) => (
        <div>
          <p className="font-medium">{cargo.nome}</p>
          {cargo.descricao && (
            <p className="text-sm text-muted-foreground">{cargo.descricao}</p>
          )}
        </div>
      ),
    },
    {
      key: "colaboradores",
      header: "Colaboradores",
      render: (cargo: Cargo) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{cargo._count.colaboradores}</span>
        </div>
      ),
    },
    {
      key: "kits",
      header: "Kits",
      render: (cargo: Cargo) => (
        <div className="flex flex-wrap gap-1">
          {cargo.kitIds.map((kitId) => {
            const kit = KIT_CATALOG.find((k) => k.id === kitId);
            return kit ? (
              <Badge key={kitId} variant="outline" className="text-xs">
                {kit.icone} {kit.nome}
              </Badge>
            ) : null;
          })}
        </div>
      ),
    },
    {
      key: "padrao",
      header: "Padrão",
      render: (cargo: Cargo) => (
        <div className="text-sm">
          {cargo.funcaoPadrao && <p>Função: {cargo.funcaoPadrao}</p>}
          {cargo.setorPadrao && <p>Setor: {cargo.setorPadrao}</p>}
        </div>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      render: (cargo: Cargo) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingCargo(cargo);
              setFormData({
                nome: cargo.nome,
                descricao: cargo.descricao || "",
                kitIds: cargo.kitIds,
                funcaoPadrao: cargo.funcaoPadrao || "",
                setorPadrao: cargo.setorPadrao || "",
              });
              setDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(cargo)}
            disabled={cargo._count.colaboradores > 0}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cargos e Trilhas"
        description="Gerencie cargos e associe kits de treinamento para onboarding automático"
      />

      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Card className="w-40">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{cargos.length}</p>
              <p className="text-sm text-muted-foreground">Cargos</p>
            </CardContent>
          </Card>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCargo(null); setFormData({ nome: "", descricao: "", kitIds: [], funcaoPadrao: "", setorPadrao: "" }); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cargo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCargo ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome do Cargo *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label>Kits de Treinamento *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {KIT_CATALOG.map((kit) => (
                    <div key={kit.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.kitIds.includes(kit.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, kitIds: [...formData.kitIds, kit.id] });
                          } else {
                            setFormData({ ...formData, kitIds: formData.kitIds.filter((id) => id !== kit.id) });
                          }
                        }}
                      />
                      <span className="text-sm">
                        {kit.icone} {kit.nome}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Função Padrão</Label>
                  <Select
                    value={formData.funcaoPadrao}
                    onValueChange={(value) => setFormData({ ...formData, funcaoPadrao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNCOES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Setor Padrão</Label>
                  <Select
                    value={formData.setorPadrao}
                    onValueChange={(value) => setFormData({ ...formData, setorPadrao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETORES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingCargo ? "Atualizar" : "Criar"} Cargo
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={cargos} />
    </div>
  );
}
