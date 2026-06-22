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
