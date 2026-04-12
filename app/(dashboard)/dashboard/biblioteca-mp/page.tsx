"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Package, Download, Search, FolderOpen, Eye } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { CATEGORIAS_MP } from "@/lib/types";

interface MateriaPrima {
  id: string;
  codigo: string;
  nome: string;
  casNumber?: string;
  categoria?: string;
  unidadeMedida: string;
  status: string;
  fornecedor?: { nome: string };
}

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "secondary"; label: string }> = {
  ATIVO: { variant: "success", label: "Ativo" },
  INATIVO: { variant: "warning", label: "Inativo" },
  DESCONTINUADO: { variant: "secondary", label: "Descontinuado" },
};

export default function BibliotecaMpPage() {
  const [mps, setMps] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchMps = async () => {
    try {
      const params = new URLSearchParams();
      if (categoriaFilter) params.set("categoria", categoriaFilter);
      const res = await fetch(`/api/materias-primas?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMps(data);
      }
    } catch (error) {
      toast.error("Erro ao carregar fichas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMps();
  }, [categoriaFilter]);

  const handleDownloadDocx = async (mp: MateriaPrima) => {
    setDownloading(mp.id);
    try {
      const res = await fetch(`/api/materias-primas/${mp.id}/docx`);
      if (!res.ok) throw new Error("Falha ao gerar documento");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FICHA MP - ${mp.codigo} - ${mp.nome}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Ficha gerada com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar ficha DOCX");
    } finally {
      setDownloading(null);
    }
  };

  const filtered = mps.filter(
    (mp) =>
      !search ||
      mp.nome.toLowerCase().includes(search.toLowerCase()) ||
      mp.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (mp.casNumber && mp.casNumber.includes(search))
  );

  // Group by categoria
  const grouped = filtered.reduce((acc, mp) => {
    const key = mp.categoria || "Sem Categoria";
    if (!acc[key]) acc[key] = [];
    acc[key].push(mp);
    return acc;
  }, {} as Record<string, MateriaPrima[]>);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Fichas de Mat\u00e9rias-Primas"
        description="Biblioteca de especifica\u00e7\u00f5es de mat\u00e9rias-primas em formato Word"
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, c\u00f3digo ou CAS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoriaFilter} onValueChange={(v) => setCategoriaFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIAS_MP.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma mat\u00e9ria-prima encontrada</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([categoria, catMps]) => (
          <div key={categoria} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">{categoria}</h3>
              <Badge variant="secondary">{catMps.length} fichas</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {catMps.map((mp) => (
                <Card key={mp.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-teal-600" />
                        <span className="text-sm font-mono text-teal-700">{mp.codigo}</span>
                      </div>
                      <Badge variant={STATUS_BADGES[mp.status]?.variant || "secondary"}>
                        {STATUS_BADGES[mp.status]?.label || mp.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{mp.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground mb-3">
                      {mp.casNumber && <p>CAS: {mp.casNumber}</p>}
                      <p>Unidade: {mp.unidadeMedida}</p>
                      {mp.fornecedor && <p>Fornecedor: {mp.fornecedor.nome}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/materias-primas/${mp.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> Ver
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocx(mp)}
                        disabled={downloading === mp.id}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {downloading === mp.id ? "Gerando..." : "Baixar DOCX"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
