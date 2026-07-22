"use client";

import { useEffect, useState } from "react";
import { Award, Download, Filter, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Certificado {
  id: string;
  colaboradorNome?: string | null;
  usuarioNome?: string | null;
  treinamentoId: string;
  arquivoUrl: string;
  dataEmissao: string;
  validade?: string | null;
}

export default function MinhaPastaPage() {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [status, setStatus] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (status !== "todos") params.set("status", status);
        const res = await fetch(`/api/usuarios/me/certificados?${params.toString()}`);
        if (!res.ok) throw new Error("Erro ao carregar certificados");
        const data = await res.json();
        setCertificados(data.certificados || []);
      } catch {
        toast.error("Não foi possível carregar sua pasta.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status]);

  const download = (certificado: Certificado) => {
    const url = certificado.arquivoUrl || `/api/certificados/${certificado.id}/download`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha Pasta"
        description="Certificados e registros pessoais de treinamento"
      />

      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Documentos e certificados pessoais
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Use esta página para consultar e baixar seus certificados de treinamento
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Esta é a sua pasta individual no VISADOCS. Ela reúne certificados, registros pessoais de treinamento e
              evidências emitidas após conclusão de trilhas ou quizzes. Use-a para comprovar capacitação, verificar validade
              dos certificados e acessar seus documentos quando necessário.
            </p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 text-sm text-gray-600 shadow-sm md:max-w-xs">
            <strong className="block text-gray-900">Como usar</strong>
            Filtre por status para encontrar certificados válidos, vencidos ou pendentes. Abra ou baixe o documento quando
            precisar apresentar evidência de treinamento.
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-teal-600" />
            Filtrar certificados
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="valido">Válidos</SelectItem>
              <SelectItem value="vencido">Vencidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-3">
        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">Carregando certificados...</Card>
        ) : certificados.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">Nenhum certificado encontrado.</Card>
        ) : (
          certificados.map((certificado) => {
            const vencido = certificado.validade ? new Date(certificado.validade) < new Date() : false;
            return (
              <Card key={certificado.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Award className="h-5 w-5 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {certificado.colaboradorNome || certificado.usuarioNome || "Certificado de treinamento"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Emitido em {new Date(certificado.dataEmissao).toLocaleDateString("pt-BR")}
                      {certificado.validade
                        ? ` · validade ${new Date(certificado.validade).toLocaleDateString("pt-BR")}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant={vencido ? "destructive" : "success"}>{vencido ? "Vencido" : "Válido"}</Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => download(certificado)}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => download(certificado)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

