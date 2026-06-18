"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/page-header";
import { DocumentLibraryItemDialog } from "@/components/document-library-item-dialog";
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
import { formatFolderLabel, normalizeFolderPath } from "@/lib/document-folders";

interface Documento {
  id: string;
  codigo: string;
  titulo: string;
  tipo: "RQ" | "MBP" | "ANEXO";
  categoria: string;
  conteudo: string;
  versao: string;
  source?: "documentos" | "document-library";
  pop?: {
    id: string;
    codigo: string;
    titulo: string;
  } | null;
}

interface LibraryItem {
  id: string;
  type: string;
  title: string;
  code?: string | null;
  category?: string | null;
  status: string;
  version?: string | null;
  source?: string | null;
}

interface FolderTreeNode<T> {
  path: string;
  label: string;
  children: FolderTreeNode<T>[];
  items: T[];
  count: number;
  needsReview: boolean;
}

const TIPO_CONFIG = {
  RQ: {
    label: "Registros da Qualidade",
    icon: FileText,
    color: "border-blue-200 bg-blue-50 text-blue-700",
    itemIcon: "text-blue-500",
  },
  MBP: {
    label: "Manual de Boas Praticas",
    icon: BookOpen,
    color: "border-emerald-200 bg-emerald-50 text-emerald-700",
    itemIcon: "text-emerald-500",
  },
  ANEXO: {
    label: "Anexos",
    icon: Paperclip,
    color: "border-amber-200 bg-amber-50 text-amber-700",
    itemIcon: "text-amber-500",
  },
} satisfies Record<
  Documento["tipo"],
  {
    label: string;
    icon: typeof FileText;
    color: string;
    itemIcon: string;
  }
>;

const DEFAULT_RQ_MBP_FOLDER = "RQ's e MBP/Sem pasta/Revisar";

function isRqMbpLibraryItem(item: LibraryItem) {
  const folder = normalizeFolderPath(item.category);
  return (
    folder.startsWith("RQ's e MBP/") ||
    item.type === "RQ" ||
    item.type === "MANUAL" ||
    (item.type === "REFERENCIA" && folder.includes("/Anexos")) ||
    (item.type === "REFERENCIA" && folder.includes("/Indice"))
  );
}

function mapLibraryItemType(item: LibraryItem): Documento["tipo"] {
  if (item.type === "RQ") return "RQ";
  if (item.type === "MANUAL") return "MBP";
  return "ANEXO";
}

function mapLibraryItemToDocumento(item: LibraryItem): Documento {
  return {
    id: `library:${item.id}`,
    codigo: item.code || item.id.slice(0, 8),
    titulo: item.title,
    tipo: mapLibraryItemType(item),
    categoria: normalizeFolderPath(item.category),
    conteudo: "Fonte documental importada. O conteudo textual fica disponivel na camada de consulta interna e na preparacao canonica.",
    versao: item.version || "sem versao",
    source: "document-library",
    pop: null,
  };
}

function getDocumentFolder(documento: Documento) {
  if (documento.categoria?.trim()) return normalizeFolderPath(documento.categoria);
  if (documento.pop) return `RQ's e MBP/Vinculados a POP/${documento.pop.codigo} - ${documento.pop.titulo}`;
  return DEFAULT_RQ_MBP_FOLDER;
}

function buildDocumentTree(documentos: Documento[]) {
  const roots: FolderTreeNode<Documento>[] = [];
  const nodes = new Map<string, FolderTreeNode<Documento>>();

  function getOrCreateNode(path: string, label: string) {
    const existing = nodes.get(path);
    if (existing) return existing;

    const node: FolderTreeNode<Documento> = {
      path,
      label,
      children: [],
      items: [],
      count: 0,
      needsReview: path === DEFAULT_RQ_MBP_FOLDER || path.includes("/Sem pasta/"),
    };
    nodes.set(path, node);
    return node;
  }

  for (const documento of documentos) {
    const folderPath = getDocumentFolder(documento);
    const parts = folderPath.split("/").map((part) => part.trim()).filter(Boolean);
    let currentPath = "";
    let parent: FolderTreeNode<Documento> | null = null;

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const node = getOrCreateNode(currentPath, part);
      node.count += 1;

      if (!parent && !roots.includes(node)) roots.push(node);
      if (parent && !parent.children.includes(node)) parent.children.push(node);
      parent = node;
    }

    const targetNode = parent || getOrCreateNode(DEFAULT_RQ_MBP_FOLDER, DEFAULT_RQ_MBP_FOLDER);
    if (!parent && !roots.includes(targetNode)) roots.push(targetNode);
    targetNode.items.push(documento);
  }

  const sortNodes = (treeNodes: FolderTreeNode<Documento>[]) => {
    treeNodes.sort((a, b) => {
      if (a.needsReview && !b.needsReview) return 1;
      if (!a.needsReview && b.needsReview) return -1;
      return a.label.localeCompare(b.label);
    });
    for (const node of treeNodes) {
      node.items.sort((a, b) => a.codigo.localeCompare(b.codigo));
      node.children = sortNodes(node.children);
    }
    return treeNodes;
  };

  return sortNodes(roots);
}

function collectFolderTreeKeys(tipo: Documento["tipo"], nodes: FolderTreeNode<Documento>[]) {
  const keys: string[] = [];
  const visit = (node: FolderTreeNode<Documento>) => {
    keys.push(folderKey(tipo, node.path));
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return keys;
}

function folderKey(tipo: string, folderPath: string) {
  return `${tipo}:${folderPath}`;
}

export default function DocumentosPage() {
  const { data: session } = useSession();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [viewingDoc, setViewingDoc] = useState<Documento | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [editingLibraryItemId, setEditingLibraryItemId] = useState<string | null>(null);

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const canManageDocumentLibrary = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "RT";

  const loadDocuments = async () => {
    setLoading(true);
    Promise.all([fetch("/api/documentos"), fetch("/api/document-library?status=ACTIVE")])
      .then(async ([documentosRes, libraryRes]) => {
        const documentosData = documentosRes.ok ? await documentosRes.json() : { documentos: [] };
        const libraryData = libraryRes.ok ? await libraryRes.json() : { items: [] };
        const legacyDocuments = Array.isArray(documentosData.documentos)
          ? documentosData.documentos.map((documento: Documento) => ({ ...documento, source: "documentos" as const }))
          : [];
        const libraryDocuments = Array.isArray(libraryData.items)
          ? libraryData.items.filter(isRqMbpLibraryItem).map(mapLibraryItemToDocumento)
          : [];
        setDocumentos([...legacyDocuments, ...libraryDocuments]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filtered = documentos.filter((documento) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      documento.codigo.toLowerCase().includes(query) ||
      documento.titulo.toLowerCase().includes(query) ||
      documento.categoria?.toLowerCase().includes(query) ||
      documento.pop?.codigo?.toLowerCase().includes(query) ||
      documento.pop?.titulo?.toLowerCase().includes(query) ||
      false
    );
  });

  const groupedByType = useMemo(() => {
    const grouped = {
      RQ: [] as Documento[],
      MBP: [] as Documento[],
      ANEXO: [] as Documento[],
    };

    for (const documento of filtered) {
      grouped[documento.tipo]?.push(documento);
    }

    return {
      RQ: buildDocumentTree(grouped.RQ),
      MBP: buildDocumentTree(grouped.MBP),
      ANEXO: buildDocumentTree(grouped.ANEXO),
    };
  }, [filtered]);

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
    for (const tipo of Object.keys(groupedByType) as Documento["tipo"][]) {
      if (groupedByType[tipo].length > 0) all.add(tipo);
      collectFolderTreeKeys(tipo, groupedByType[tipo]).forEach((key) => all.add(key));
    }
    setOpenFolders(all);
  };

  const collapseAll = () => setOpenFolders(new Set());

  const editLibraryDocument = (documento: Documento) => {
    if (documento.source !== "document-library") return;
    setEditingLibraryItemId(documento.id.replace(/^library:/, ""));
    setDocumentDialogOpen(true);
  };

  const renderDocumentNode = (tipo: Documento["tipo"], node: FolderTreeNode<Documento>, depth = 0) => {
    const key = folderKey(tipo, node.path);
    const isFolderOpen = openFolders.has(key);

    return (
      <div key={key} className="border-t first:border-t-0">
        <button
          type="button"
          onClick={() => toggleFolder(key)}
          className="flex w-full items-center gap-3 py-3 pr-6 text-left transition-colors hover:bg-muted/30"
          style={{ paddingLeft: `${24 + depth * 20}px` }}
        >
          {isFolderOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <FolderOpen className="h-4 w-4 text-amber-500" />
          <span className="flex-1 truncate text-sm font-medium">{node.label}</span>
          {node.needsReview && <Badge variant="outline">Revisar</Badge>}
          <Badge variant="outline" className="text-xs">
            {node.count}
          </Badge>
        </button>

        {isFolderOpen && (
          <div className="bg-muted/10">
            {node.children.map((child) => renderDocumentNode(tipo, child, depth + 1))}
            {node.items.map((documento) => {
              const ItemIcon = TIPO_CONFIG[documento.tipo].icon;

              return (
                <div
                  key={documento.id}
                  className="group flex items-center gap-3 py-2.5 pr-6 transition-colors hover:bg-muted/20"
                  style={{ paddingLeft: `${60 + depth * 20}px` }}
                >
                  <ItemIcon
                    className={`h-4 w-4 flex-shrink-0 ${TIPO_CONFIG[documento.tipo].itemIcon}`}
                  />
                  <span className="flex-shrink-0 font-mono text-xs text-teal-600">
                    {documento.codigo}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{documento.titulo}</p>
                    {documento.pop && (
                      <p className="truncate text-xs text-muted-foreground">
                        POP vinculado: {documento.pop.codigo} - {documento.pop.titulo}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="flex-shrink-0 text-xs">
                    {documento.versao}
                  </Badge>
                  {documento.source === "document-library" && (
                    <Badge variant="secondary" className="flex-shrink-0 text-xs">
                      Acervo
                    </Badge>
                  )}
                  {canManageDocumentLibrary && documento.source === "document-library" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => editLibraryDocument(documento)}
                    >
                      Editar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => setViewingDoc(documento)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" /> Ver
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  const totalRQs = documentos.filter((documento) => documento.tipo === "RQ").length;
  const totalMBP = documentos.filter((documento) => documento.tipo === "MBP").length;
  const totalAnexos = documentos.filter((documento) => documento.tipo === "ANEXO").length;

  return (
    <div>
      <PageHeader
        title="RQ's e MBP"
        description="Registros, manuais e anexos organizados por pastas do acervo documental"
      />

      <DocumentLibraryItemDialog
        open={documentDialogOpen}
        onOpenChange={(open) => {
          setDocumentDialogOpen(open);
          if (!open) setEditingLibraryItemId(null);
        }}
        onSuccess={loadDocuments}
        editingItemId={editingLibraryItemId}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-blue-600" />
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
              <BookOpen className="h-7 w-7 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{totalMBP}</p>
                <p className="text-sm text-muted-foreground">Manual de Boas Praticas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Paperclip className="h-7 w-7 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{totalAnexos}</p>
                <p className="text-sm text-muted-foreground">Anexos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por codigo, titulo, pasta ou POP vinculado..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronsUpDown className="mr-1 h-4 w-4" /> Expandir tudo
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronsDownUp className="mr-1 h-4 w-4" /> Recolher tudo
          </Button>
        </div>
      </div>

      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="flex max-h-[85vh] w-full max-w-4xl flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold">
                  <span className="font-mono text-teal-600">{viewingDoc.codigo}</span> {viewingDoc.titulo}
                </h3>
                <p className="text-sm text-muted-foreground">{formatFolderLabel(getDocumentFolder(viewingDoc))}</p>
                {viewingDoc.source === "document-library" && (
                  <p className="text-sm text-muted-foreground">Fonte importada pelo acervo documental.</p>
                )}
                {viewingDoc.pop && (
                  <p className="text-sm text-muted-foreground">
                    Vinculado: {viewingDoc.pop.codigo} - {viewingDoc.pop.titulo}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}>
                Fechar
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">{viewingDoc.conteudo}</div>
            </div>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        {(["RQ", "MBP", "ANEXO"] as const).map((tipo) => {
          const groups = groupedByType[tipo];
          if (groups.length === 0) return null;
          const config = TIPO_CONFIG[tipo];
          const TypeIcon = config.icon;
          const isOpen = openFolders.has(tipo);
          const totalInTipo = groups.reduce((total, group) => total + group.count, 0);

          return (
            <Card key={tipo} className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleFolder(tipo)}
                className={`flex w-full items-center gap-3 border-b p-4 text-left transition-colors hover:bg-muted/50 ${config.color}`}
              >
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 flex-shrink-0" />
                )}
                <TypeIcon className="h-5 w-5" />
                <span className="flex-1 text-base font-semibold">{config.label}</span>
                <Badge variant="secondary">{totalInTipo}</Badge>
              </button>

              {isOpen && (
                <div className="divide-y">
                  {groups.map((group) => renderDocumentNode(tipo, group))}
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
