"use client";

import { useState } from "react";
import { Copy, Loader2, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UserRoleOption = "ADMIN" | "RT" | "OPERADOR";

interface CreatedCredentials {
  email: string;
  tempPassword: string;
}

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string;
  roles: UserRoleOption[];
  onSuccess: () => void;
}

const ROLE_LABELS: Record<UserRoleOption, string> = {
  ADMIN: "Administrador",
  RT: "Responsável Técnico",
  OPERADOR: "Operador",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function UserCreateDialog({ open, onOpenChange, tenantId, roles, onSuccess }: UserCreateDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRoleOption>(roles[0] ?? "OPERADOR");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole(roles[0] ?? "OPERADOR");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        role,
        ...(tenantId ? { tenantId } : {}),
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao criar usuário");
      }

      toast.success("Usuário criado com sucesso");
      resetForm();
      onOpenChange(false);
      onSuccess();

      if (data?.tempPassword) {
        setCredentials({ email: data?.user?.email || email, tempPassword: data.tempPassword });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao criar usuário"));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Copiado");
  };

  const closeCredentials = () => {
    setCredentials(null);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-600" />
              Novo usuário
            </DialogTitle>
            <DialogDescription>
              Crie um acesso vinculado ao tenant. A senha temporária será exibida apenas uma vez.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="user-name">Nome</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>

            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div>
              <Label>Papel</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRoleOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((roleOption) => (
                    <SelectItem key={roleOption} value={roleOption}>
                      {ROLE_LABELS[roleOption]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar usuário"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentials} onOpenChange={(nextOpen) => !nextOpen && closeCredentials()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Senha temporária</DialogTitle>
            <DialogDescription>
              Copie e entregue a senha temporária por canal seguro. Ela não será exibida novamente.
            </DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credentials.email)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="break-all font-mono text-sm">{credentials.email}</p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Senha temporária</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credentials.tempPassword)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="break-all font-mono text-sm">{credentials.tempPassword}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeCredentials}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
