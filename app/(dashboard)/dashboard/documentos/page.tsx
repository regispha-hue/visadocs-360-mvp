"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  BookOpen,
  Paperclip,
  FolderOpen,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
} from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";

interface Documento {
  id: string;
  codigo: string;
  titulo: string;
  tipo: "RQ" | "MBP" | "ANEXO";
  categoria: string;
  conteudo: string;
  versao: string;
  pop?: {
    id: string;
    codigo: string;
    titulo: string;
  } | null;
}

const TIPO_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  RQ: { label: "Registros da Qualidade", icon: "\ud83d\udccb", color: "bg-blue-50 text-blue-700 border-blue-200" },
  MBP: { label: "Manual de Boas Pr\u00e1ticas", icon: "\ud83d\udcd6", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ANEXO: { label: "Anexos", icon: "\ud83d\udcce", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [viewingDoc, setViewingDoc] = useState<Documento | null>(null);

  useEffect(() => {
    fetch("/api/documentos")
      .then((res) => res.json())
      .then((data) => {
        setDocumentos(data.documentos || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = documentos.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.codigo.toLowerCase().includes(s) ||
      d.titulo.toLowerCase().includes(s) ||
      d.pop?.codigo?.toLowerCase().includes(s) ||
      d.pop?.titulo?.toLowerCase().includes(s) ||
      false
    );
  });

  // Group by tipo then by POP or categoria
  const grouped: Record<string, Record<string, Documento[]>> = {};
  for (const doc of filtered) {
    if (!grouped[doc.tipo]) grouped[doc.tipo] = {};
    const cat = doc.pop ? `POP ${doc.pop.codigo} - ${doc.pop.titulo}` : doc.categoria;
    if (!grouped[doc.tipo][cat]) grouped[doc.tipo][cat] = [];
    grouped[doc.tipo][cat].push(doc);
  }

  const toggleFolder = (key: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    for (const tipo of Object.keys(grouped)) {
      all.add(tipo);
      for (const cat of Object.keys(grouped[tipo])) {
        all.add(`${tipo}:${cat}`);
      }
    }
    setOpenFolders(all);
  };

  const collapseAll = () => setOpenFolders(new Set());

  if (loading) return <LoadingSpinner />;

  const totalRQs = documentos.filter((d) => d.tipo === "RQ").length;
  const totalMBP = documentos.filter((d) => d.tipo === "MBP").length;
  const totalAnexos = documentos.filter((d) => d.tipo === "ANEXO").length;

  return (
    <div>
      <PageHeader
        title="Biblioteca de Documentos"
        description="Registros da Qualidade (RQ's), Manual de Boas Pr\u00e1ticas e Anexos"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">\ud83d\udccb</span>
              <div>
                <p className="text-2xl font-bold">{totalRQs}</p>
                <p className="text-sm text-muted-foreground">Registros da Qualidade</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">\ud83d\udcd6</span>
              <div>
                <p className="text-2xl font-bold">{totalMBP}</p>
                <p className="text-sm text-muted-foreground">Manual de Boas Pr\u00e1ticas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">\ud83d\udcce</span>
              <div>
                <p className="text-2xl font-bold">{totalAnexos}</p>
                <p className="text-sm text-muted-foreground">Anexos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por c\u00f3digo, t\u00edtulo ou POP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronsUpDown className="h-4 w-4 mr-1" /> Expandir tudo
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronsDownUp className="h-4 w-4 mr-1" /> Recolher tudo
          </Button>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-lg">
                  <span className="font-mono text-teal-600">{viewingDoc.codigo}</span>{" "}
                  {viewingDoc.titulo}
                </h3>
                {viewingDoc.pop && (
                  <p className="text-sm text-muted-foreground">
                    Vinculado: {viewingDoc.pop.codigo} - {viewingDoc.pop.titulo}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}>
                \u2715
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {viewingDoc.conteudo}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Folder Tree */}
      <div className="space-y-4">
        {(["RQ", "MBP", "ANEXO"] as const).map((tipo) => {
          const cats = grouped[tipo];
          if (!cats) return null;
          const config = TIPO_CONFIG[tipo];
          const isOpen = openFolders.has(tipo);
          const totalInTipo = Object.values(cats).reduce((s, arr) => s + arr.length, 0);

          return (
            <Card key={tipo} className="overflow-hidden">
              <button
                onClick={() => toggleFolder(tipo)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors ${config.color} border-b`}
              >
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 flex-shrink-0" />
                )}
                <span className="text-xl">{config.icon}</span>
                <span className="font-semibold text-base flex-1">{config.label}</span>
                <Badge variant="secondary">{totalInTipo}</Badge>
              </button>

              {isOpen && (
                <div className="divide-y">
                  {Object.entries(cats)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([cat, docs]) => {
                      const catKey = `${tipo}:${cat}`;
                      const isCatOpen = openFolders.has(catKey);

                      return (
                        <div key={catKey}>
                          <button
                            onClick={() => toggleFolder(catKey)}
                            className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-muted/30 transition-colors"
                          >
                            {isCatOpen ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <FolderOpen className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium flex-1 truncate">{cat}</span>
                            <Badge variant="outline" className="text-xs">
                              {docs.length}
                            </Badge>
                          </button>

                          {isCatOpen && (
                            <div className="bg-muted/10">
                              {docs.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center gap-3 px-10 py-2.5 hover:bg-muted/20 transition-colors group"
                                >
                                  {doc.tipo === "RQ" && (
                                    <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                  )}
                                  {doc.tipo === "MBP" && (
                                    <BookOpen className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                  )}
                                  {doc.tipo === "ANEXO" && (
                                    <Paperclip className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                  )}
                                  <span className="font-mono text-xs text-teal-600 flex-shrink-0">
                                    {doc.codigo}
                                  </span>
                                  <span className="text-sm flex-1 truncate">{doc.titulo}</span>
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {doc.versao}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7"
                                    onClick={() => setViewingDoc(doc)}
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum documento encontrado.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
