"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Search,
  Download,
  Printer,
  FolderOpen,
  FolderClosed,
  FileText,
  ChevronRight,
  Library,
} from "lucide-react";
import { SETORES } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";

interface Pop {
  id: string;
  codigo: string;
  titulo: string;
  setor: string;
  versao: string;
  status: string;
  dataRevisao: string;
  responsavel: string;
}

const FOLDER_ICONS: Record<string, string> = {
  "Gest\u00e3o da Qualidade e Documenta\u00e7\u00e3o": "\ud83d\udccb",
  "Recursos Humanos e Pessoal": "\ud83d\udc65",
  "Qualifica\u00e7\u00e3o de Fornecedores e Prestadores": "\ud83e\udd1d",
  "Infraestrutura e Seguran\u00e7a": "\ud83c\udfe2",
  "Equipamentos e Calibra\u00e7\u00e3o": "\u2699\ufe0f",
  "Limpeza e Higieniza\u00e7\u00e3o": "\ud83e\uddf9",
  "Atendimento e Dispensa\u00e7\u00e3o": "\ud83d\udc8a",
  "Escritura\u00e7\u00e3o e Rastreabilidade": "\ud83d\udcdd",
  "Controle de Qualidade": "\ud83d\udd2c",
  "Almoxarifado e Estoque": "\ud83d\udce6",
  "\u00c1rea de Manipula\u00e7\u00e3o": "\u2697\ufe0f",
  "\u00c1gua Purificada": "\ud83d\udca7",
};

export default function BibliotecaPopsPage() {
  const [pops, setPops] = useState<Pop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPops();
  }, []);

  async function fetchPops() {
    try {
      const res = await fetch("/api/pops?status=ATIVO");
      const data = await res.json();
      setPops(data.pops || []);
    } catch {
      toast.error("Erro ao carregar POPs");
    } finally {
      setLoading(false);
    }
  }

  const filteredPops = pops.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.codigo.toLowerCase().includes(q) ||
      p.titulo.toLowerCase().includes(q) ||
      p.setor.toLowerCase().includes(q)
    );
  });

  // Group by setor
  const grouped: Record<string, Pop[]> = {};
  for (const s of SETORES) {
    const items = filteredPops.filter((p) => p.setor === s);
    if (items.length > 0) {
      grouped[s] = items.sort((a, b) => a.codigo.localeCompare(b.codigo));
    }
  }
  // Also group any POPs with sectors not in SETORES
  const knownSetores = new Set(SETORES as readonly string[]);
  const otherPops = filteredPops.filter((p) => !knownSetores.has(p.setor));
  if (otherPops.length > 0) {
    grouped["Outros"] = otherPops.sort((a, b) => a.codigo.localeCompare(b.codigo));
  }

  const toggleFolder = (setor: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(setor)) {
        next.delete(setor);
      } else {
        next.add(setor);
      }
      return next;
    });
  };

  const expandAll = () => setOpenFolders(new Set(Object.keys(grouped)));
  const collapseAll = () => setOpenFolders(new Set());

  async function handleDownload(pop: Pop) {
    setDownloadingId(pop.id);
    try {
      const res = await fetch(`/api/pops/${pop.id}/docx`);
      if (!res.ok) throw new Error("Erro");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pop.codigo} - ${pop.titulo}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao gerar DOCX");
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  const totalFolders = Object.keys(grouped).length;
  const totalPops = filteredPops.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca de POPs"
        description={`${totalPops} procedimentos organizados em ${totalFolders} pastas`}
      />

      {/* Search and controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por c\u00f3digo, t\u00edtulo ou pasta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <FolderOpen className="h-4 w-4 mr-1" /> Expandir tudo
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <FolderClosed className="h-4 w-4 mr-1" /> Recolher tudo
          </Button>
        </div>
      </div>

      {/* Folders */}
      {Object.keys(grouped).length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <Library className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum POP encontrado{search ? " para esta busca" : ""}.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([setor, items]) => {
            const isOpen = openFolders.has(setor);
            const icon = FOLDER_ICONS[setor] || "\ud83d\udcc1";
            return (
              <div key={setor} className="border rounded-lg bg-white overflow-hidden">
                {/* Folder header */}
                <button
                  onClick={() => toggleFolder(setor)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-gray-900">{setor}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {items.length} POP{items.length !== 1 ? "s" : ""}
                  </Badge>
                </button>

                {/* Folder content */}
                {isOpen && (
                  <div className="border-t divide-y">
                    {items.map((pop) => (
                      <div
                        key={pop.id}
                        className="flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-gray-50 group"
                      >
                        <FileText className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/dashboard/pops/${pop.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-teal-600 truncate block"
                          >
                            <span className="text-teal-600 font-mono text-xs mr-2">
                              {pop.codigo}
                            </span>
                            {pop.titulo}
                          </Link>
                          <p className="text-xs text-gray-400">
                            {pop.versao}
                            {pop.dataRevisao &&
                              ` \u2022 ${format(new Date(pop.dataRevisao), "dd/MM/yyyy", { locale: ptBR })}`}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(pop);
                            }}
                            disabled={downloadingId === pop.id}
                            title="Download DOCX"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(pop);
                            }}
                            title="Imprimir"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
