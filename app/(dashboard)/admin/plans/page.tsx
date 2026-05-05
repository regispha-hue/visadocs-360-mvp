"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Users,
  FileText,
  HardDrive,
  Check,
  X,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: {
    maxUsers: number;
    maxPOPs: number;
    maxStorage: number;
  };
  stripePriceId: string | null;
  mpPriceId: string | null;
  active: boolean;
  sortOrder: number;
  _count?: {
    subscriptions: number;
  };
}

const defaultLimits = {
  maxUsers: 5,
  maxPOPs: 50,
  maxStorage: 1024,
};

const defaultFeatures = [
  "Gestão de POPs",
  "Treinamentos",
  "Quiz básico",
  "Certificados",
  "Suporte por email",
];

export default function AdminPlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceMonthly: "",
    priceYearly: "",
    features: defaultFeatures.join("\n"),
    maxUsers: "5",
    maxPOPs: "50",
    maxStorage: "1024",
    stripePriceId: "",
    mpPriceId: "",
    sortOrder: "0",
    active: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user && (session.user as any).role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchPlans();
  }, [session, status, router]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/plans");
      if (!response.ok) throw new Error("Erro ao carregar");

      const data = await response.json();
      setPlans(data.plans);
    } catch (error) {
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description,
      priceMonthly: parseFloat(formData.priceMonthly),
      priceYearly: parseFloat(formData.priceYearly),
      features: formData.features.split("\n").filter((f) => f.trim()),
      limits: {
        maxUsers: parseInt(formData.maxUsers) || -1,
        maxPOPs: parseInt(formData.maxPOPs) || -1,
        maxStorage: parseInt(formData.maxStorage) || -1,
      },
      stripePriceId: formData.stripePriceId || null,
      mpPriceId: formData.mpPriceId || null,
      sortOrder: parseInt(formData.sortOrder) || 0,
      active: formData.active,
    };

    try {
      const url = editingPlan
        ? `/api/admin/plans/${editingPlan.id}`
        : "/api/admin/plans";
      const method = editingPlan ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Erro ao salvar");

      toast.success(editingPlan ? "Plano atualizado" : "Plano criado");
      setDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error("Erro ao salvar plano");
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Deseja ${plan._count?.subscriptions ? "desativar" : "excluir"} o plano "${plan.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir");

      const data = await response.json();
      toast.success(data.message);
      fetchPlans();
    } catch (error) {
      toast.error("Erro ao excluir plano");
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      priceMonthly: plan.priceMonthly.toString(),
      priceYearly: plan.priceYearly.toString(),
      features: plan.features.join("\n"),
      maxUsers: plan.limits?.maxUsers?.toString() || "5",
      maxPOPs: plan.limits?.maxPOPs?.toString() || "50",
      maxStorage: plan.limits?.maxStorage?.toString() || "1024",
      stripePriceId: plan.stripePriceId || "",
      mpPriceId: plan.mpPriceId || "",
      sortOrder: plan.sortOrder.toString(),
      active: plan.active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priceMonthly: "",
      priceYearly: "",
      features: defaultFeatures.join("\n"),
      maxUsers: "5",
      maxPOPs: "50",
      maxStorage: "1024",
      stripePriceId: "",
      mpPriceId: "",
      sortOrder: "0",
      active: true,
    });
  };

  const calculateDiscount = (monthly: number, yearly: number) => {
    const monthlyTotal = monthly * 12;
    const savings = monthlyTotal - yearly;
    const percent = monthlyTotal > 0 ? Math.round((savings / monthlyTotal) * 100) : 0;
    return { savings, percent };
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-teal-600" />
            Planos e Preços
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os planos disponíveis para assinatura
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingPlan(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? "Editar Plano" : "Criar Novo Plano"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Professional"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Ordem de Exibição</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição do plano..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceMonthly">Preço Mensal (R$) *</Label>
                  <Input
                    id="priceMonthly"
                    type="number"
                    step="0.01"
                    value={formData.priceMonthly}
                    onChange={(e) =>
                      setFormData({ ...formData, priceMonthly: e.target.value })
                    }
                    placeholder="99.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceYearly">Preço Anual (R$) *</Label>
                  <Input
                    id="priceYearly"
                    type="number"
                    step="0.01"
                    value={formData.priceYearly}
                    onChange={(e) =>
                      setFormData({ ...formData, priceYearly: e.target.value })
                    }
                    placeholder="999.00"
                    required
                  />
                </div>
              </div>

              {/* Desconto calculado */}
              {formData.priceMonthly && formData.priceYearly && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <span className="font-medium">Desconto anual: </span>
                  {(() => {
                    const { savings, percent } = calculateDiscount(
                      parseFloat(formData.priceMonthly),
                      parseFloat(formData.priceYearly)
                    );
                    return `Economia de R$ ${savings.toFixed(2)} (${percent}%)`;
                  })()}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">
                    <Users className="h-4 w-4 inline mr-1" />
                    Máx. Usuários (-1 = ∞)
                  </Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUsers: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPOPs">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Máx. POPs (-1 = ∞)
                  </Label>
                  <Input
                    id="maxPOPs"
                    type="number"
                    value={formData.maxPOPs}
                    onChange={(e) =>
                      setFormData({ ...formData, maxPOPs: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStorage">
                    <HardDrive className="h-4 w-4 inline mr-1" />
                    Storage MB (-1 = ∞)
                  </Label>
                  <Input
                    id="maxStorage"
                    type="number"
                    value={formData.maxStorage}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStorage: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (uma por linha)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) =>
                    setFormData({ ...formData, features: e.target.value })
                  }
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stripePriceId">Stripe Price ID</Label>
                  <Input
                    id="stripePriceId"
                    value={formData.stripePriceId}
                    onChange={(e) =>
                      setFormData({ ...formData, stripePriceId: e.target.value })
                    }
                    placeholder="price_123..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mpPriceId">MercadoPago Price ID</Label>
                  <Input
                    id="mpPriceId"
                    value={formData.mpPriceId}
                    onChange={(e) =>
                      setFormData({ ...formData, mpPriceId: e.target.value })
                    }
                    placeholder="..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
                <Label htmlFor="active">Plano Ativo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPlan ? "Salvar Alterações" : "Criar Plano"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Planos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const discount = calculateDiscount(plan.priceMonthly, plan.priceYearly);
          return (
            <Card
              key={plan.id}
              className={!plan.active ? "opacity-60" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(plan)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(plan)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {plan._count?.subscriptions ? "Desativar" : "Excluir"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description || "Sem descrição"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preços */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      R$ {plan.priceMonthly}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      ou R$ {plan.priceYearly}/ano
                    </span>
                    {discount.percent > 0 && (
                      <Badge variant="secondary" className="text-green-600">
                        -{discount.percent}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Limits */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-muted rounded">
                    <Users className="h-4 w-4 mx-auto mb-1" />
                    <p className="font-medium">
                      {plan.limits?.maxUsers === -1
                        ? "∞"
                        : plan.limits?.maxUsers}
                    </p>
                    <p className="text-xs text-muted-foreground">Usuários</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <FileText className="h-4 w-4 mx-auto mb-1" />
                    <p className="font-medium">
                      {plan.limits?.maxPOPs === -1
                        ? "∞"
                        : plan.limits?.maxPOPs}
                    </p>
                    <p className="text-xs text-muted-foreground">POPs</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <HardDrive className="h-4 w-4 mx-auto mb-1" />
                    <p className="font-medium">
                      {plan.limits?.maxStorage === -1
                        ? "∞"
                        : `${Math.round(
                            (plan.limits?.maxStorage || 0) / 1024
                          )}GB`}
                    </p>
                    <p className="text-xs text-muted-foreground">Storage</p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-1">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="text-sm space-y-1">
                    {plan.features.slice(0, 5).map((feature, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-xs text-muted-foreground">
                        +{plan.features.length - 5} mais...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Status e Contadores */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    {plan.active ? (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <X className="h-3 w-3" />
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan._count?.subscriptions || 0} assinaturas
                  </p>
                </div>

                {/* Stripe Status */}
                {plan.stripePriceId && (
                  <Badge variant="outline" className="w-full justify-center">
                    Stripe: {plan.stripePriceId.substring(0, 20)}...
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhum plano cadastrado</p>
          <p className="text-sm">Clique em "Novo Plano" para começar</p>
        </div>
      )}
    </div>
  );
}
