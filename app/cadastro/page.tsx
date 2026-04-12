"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Loader2, Building2, User, Mail, Phone, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { validateCNPJ } from "@/lib/validations";

const cadastroSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cnpj: z.string().min(14, "CNPJ inválido").refine((val) => validateCNPJ(val), "CNPJ inválido"),
  responsavel: z.string().min(3, "Nome do responsável é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().length(2, "Estado deve ter 2 caracteres"),
  cep: z.string().min(8, "CEP deve ter 8 dígitos"),
  aceitaTermos: z.boolean().refine((val) => val === true, "Aceite os termos para continuar"),
});

type CadastroForm = z.infer<typeof cadastroSchema>;

export default function CadastroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CadastroForm>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      aceitaTermos: false,
    },
  });

  const aceitaTermos = watch("aceitaTermos");

  const onSubmit = async (data: CadastroForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/farmacias/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: data.nome,
          cnpj: data.cnpj.replace(/[^\d]/g, ""),
          responsavel: data.responsavel,
          email: data.email,
          telefone: data.telefone,
          endereco: {
            logradouro: data.logradouro,
            numero: data.numero,
            complemento: data.complemento || "",
            bairro: data.bairro,
            cidade: data.cidade,
            estado: data.estado.toUpperCase(),
            cep: data.cep.replace(/[^\d]/g, ""),
          },
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erro ao cadastrar");
      }

      setSuccess(true);
      toast.success("Cadastro realizado com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao realizar cadastro");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Cadastro Recebido!</h2>
              <p className="text-muted-foreground mb-6">
                Seu cadastro foi enviado com sucesso e está aguardando aprovação.
                Você receberá um email com as credenciais de acesso assim que for aprovado.
              </p>
              <Button asChild>
                <Link href="/">Voltar para a página inicial</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-600">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              VISADOCS
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Farmácia</CardTitle>
            <CardDescription>
              Preencha os dados da sua farmácia para solicitar acesso ao sistema.
              Após o cadastro, nossa equipe irá analisar e aprovar sua solicitação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados da Farmácia */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  Dados da Farmácia
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="nome">Nome da Farmácia</Label>
                    <Input
                      id="nome"
                      {...register("nome")}
                      placeholder="Farmácia de Manipulação XYZ"
                    />
                    {errors.nome && (
                      <p className="text-sm text-red-500 mt-1">{errors.nome.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      {...register("cnpj")}
                      placeholder="00.000.000/0000-00"
                    />
                    {errors.cnpj && (
                      <p className="text-sm text-red-500 mt-1">{errors.cnpj.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      {...register("telefone")}
                      placeholder="(00) 00000-0000"
                    />
                    {errors.telefone && (
                      <p className="text-sm text-red-500 mt-1">{errors.telefone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados do Responsável */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-teal-600" />
                  Responsável
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="responsavel">Nome do Responsável</Label>
                    <Input
                      id="responsavel"
                      {...register("responsavel")}
                      placeholder="Nome completo"
                    />
                    {errors.responsavel && (
                      <p className="text-sm text-red-500 mt-1">{errors.responsavel.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="email@farmacia.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-teal-600" />
                  Endereço
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      {...register("logradouro")}
                      placeholder="Rua, Avenida, etc."
                    />
                    {errors.logradouro && (
                      <p className="text-sm text-red-500 mt-1">{errors.logradouro.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      {...register("numero")}
                      placeholder="123"
                    />
                    {errors.numero && (
                      <p className="text-sm text-red-500 mt-1">{errors.numero.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      {...register("complemento")}
                      placeholder="Sala, Loja (opcional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      {...register("bairro")}
                      placeholder="Bairro"
                    />
                    {errors.bairro && (
                      <p className="text-sm text-red-500 mt-1">{errors.bairro.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      {...register("cidade")}
                      placeholder="Cidade"
                    />
                    {errors.cidade && (
                      <p className="text-sm text-red-500 mt-1">{errors.cidade.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      {...register("estado")}
                      placeholder="UF"
                      maxLength={2}
                    />
                    {errors.estado && (
                      <p className="text-sm text-red-500 mt-1">{errors.estado.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      {...register("cep")}
                      placeholder="00000-000"
                    />
                    {errors.cep && (
                      <p className="text-sm text-red-500 mt-1">{errors.cep.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Termos */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="aceitaTermos"
                    checked={aceitaTermos}
                    onCheckedChange={(checked) => setValue("aceitaTermos", checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="aceitaTermos"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Concordo com os termos de uso e política de privacidade
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Ao cadastrar, você concorda com o tratamento dos dados conforme a LGPD.
                    </p>
                  </div>
                </div>
                {errors.aceitaTermos && (
                  <p className="text-sm text-red-500">{errors.aceitaTermos.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando cadastro...
                  </>
                ) : (
                  "Solicitar Cadastro"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-teal-600 hover:underline font-medium">
                  Faça login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
