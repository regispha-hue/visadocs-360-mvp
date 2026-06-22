"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/loading-spinner";
import { DocumentLibraryItemDialog } from "@/components/document-library-item-dialog";
import {
  CanonicalPopDraftDialog,
  type CanonicalDraftChunkSummary,
} from "@/components/canonical-pop-draft-dialog";
import {
  Search,
  Download,
  Printer,
  FolderOpen,
  FolderClosed,
  FileText,
  ChevronRight,
  Eye,
  Library,
  Wand2,
  FilePlus2,
} from "lucide-react";
import { SETORES } from "@/lib/types";
import {
  DEFAULT_DOCUMENT_FOLDER,
  formatFolderLabel,
  isPopLibraryFolder,
  normalizeFolderPath,
} from "@/lib/document-folders";
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

interface LibraryItem {
  id: string;
  type: string;
  title: string;
  code?: string;
  category?: string;
  status: string;
  version?: string;
  source?: string | null;
}

interface CanonicalDocument {
  id: string;
  title: string;
  code?: string | null;
  kind: string;
  status: string;
  sourceType: string;
  sourceId: string;
  libraryItemId?: string | null;
  category?: string | null;
  version?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CanonicalIngestionJob {
  id: string;
  sourceType: string;
  sourceId: string;
  status: string;
  canonicalDocumentId?: string | null;
  requestedByUserName?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CanonicalChunk {
  id: string;
  chunkIndex: number;
  heading?: string | null;
  text: string;
  tokenEstimate: number;
  semanticRole: string;
  sourceHash: string;
  createdAt: string;
  updatedAt: string;
}

interface CanonicalRetrievalChunk {
  id: string;
  canonicalDocumentId: string;
  chunkIndex: number;
  heading?: string | null;
  text: string;
  tokenEstimate: number;
  semanticRole: string;
  sourceHash: string;
  canonicalDocument?: {
    id: string;
    title: string;
    code?: string | null;
    status: string;
    kind: string;
  };
}

interface FolderTreeNode<T> {
  path: string;
  label: string;
  children: FolderTreeNode<T>[];
  items: T[];
  count: number;
  needsReview: boolean;
}

const FOLDER_ICONS: Record<string, string> = {
  "Gestão da Qualidade e Documentação": "\ud83d\udccb",
  "Recursos Humanos e Pessoal": "\ud83d\udc65",
  "Qualificação de Fornecedores e Prestadores": "\ud83e\udd1d",
  "Infraestrutura e Segurança": "\ud83c\udfe2",
  "Equipamentos e Calibração": "\u2699\ufe0f",
  "Limpeza e Higienização": "\ud83e\uddf9",
  "Atendimento e Dispensação": "\ud83d\udc8a",
  "Escrituração e Rastreabilidade": "\ud83d\udcdd",
  "Controle de Qualidade": "\ud83d\udd2c",
  "Almoxarifado e Estoque": "\ud83d\udce6",
  "Área de Manipulação": "\u2697\ufe0f",
  "Água Purificada": "\ud83d\udca7",
};

const CANONICAL_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  ARCHIVED: "Arquivado",
  CHUNKED: "Trechos gerados",
  DRAFT: "Rascunho",
  INACTIVE: "Inativo",
  PENDING: "Pendente",
  PENDING_REVIEW: "Pendente de revisão",
  PROCESSING: "Em processamento",
  QUEUED: "Na fila",
};

const SEMANTIC_ROLE_LABELS: Record<string, string> = {
  UNKNOWN: "Não classificado",
};

function formatCanonicalStatus(status?: string | null) {
  if (!status) return "Sem status";
  return CANONICAL_STATUS_LABELS[status] ?? status;
}

function formatCanonicalJobStatus(status?: string | null) {
  if (!status) return "Processamento sem status";
  return `Processamento ${formatCanonicalStatus(status).toLowerCase()}`;
}

function formatSemanticRole(role?: string | null) {
  if (!role) return "Não classificado";
  return SEMANTIC_ROLE_LABELS[role] ?? role;
}

function buildFolderTree<T>(items: T[], getCategory: (item: T) => string | null | undefined) {
  const roots: FolderTreeNode<T>[] = [];
  const nodes = new Map<string, FolderTreeNode<T>>();

  function getOrCreateNode(path: string, label: string) {
    const existing = nodes.get(path);
    if (existing) return existing;

    const node: FolderTreeNode<T> = {
      path,
      label,
      children: [],
      items: [],
      count: 0,
      needsReview: path === DEFAULT_DOCUMENT_FOLDER,
    };
    nodes.set(path, node);
    return node;
  }

  for (const item of items) {
    const folderPath = normalizeFolderPath(getCategory(item));
    const parts = folderPath.split("/").map((part) => part.trim()).filter(Boolean);
    let currentPath = "";
    let parent: FolderTreeNode<T> | null = null;

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const node = getOrCreateNode(currentPath, part);
      node.count += 1;

      if (!parent && !roots.includes(node)) roots.push(node);
      if (parent && !parent.children.includes(node)) parent.children.push(node);
      parent = node;
    }

    const targetNode = parent || getOrCreateNode(DEFAULT_DOCUMENT_FOLDER, DEFAULT_DOCUMENT_FOLDER);
    if (!parent && !roots.includes(targetNode)) roots.push(targetNode);
    targetNode.items.push(item);
  }

  const sortNodes = (treeNodes: FolderTreeNode<T>[]) => {
    treeNodes.sort((a, b) => {
      if (a.path === DEFAULT_DOCUMENT_FOLDER) return 1;
      if (b.path === DEFAULT_DOCUMENT_FOLDER) return -1;
      return a.label.localeCompare(b.label);
    });
    for (const node of treeNodes) {
      node.children = sortNodes(node.children);
    }
    return treeNodes;
  };

  return sortNodes(roots);
}

function collectFolderTreeKeys<T>(scope: string, nodes: FolderTreeNode<T>[]) {
  const keys: string[] = [];
  const visit = (node: FolderTreeNode<T>) => {
    keys.push(folderKey(scope, node.path));
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return keys;
}

function getPopDisplayFolderPath(path?: string | null) {
  const parts = normalizeFolderPath(path).split("/").map((part) => part.trim()).filter(Boolean);

  if (parts[0] !== "Biblioteca de POPs") {
    return parts.join("/");
  }

  if (parts[1] === "Acervo Drogarias" && parts[2] === "POPs") {
    return ["POP Drogarias", ...parts.slice(3)].join("/");
  }

  if (parts[1] === "Acervo LGPD") {
    return ["POP LGPD", ...parts.slice(2)].join("/");
  }

  if (
    parts[1] === "Acervo Manipulacao" ||
    parts[1] === "Acervo Manipulação" ||
    parts[1] === "POPs para Farmacias de Manipulacao" ||
    parts[1] === "POPs para Farmácias de Manipulação"
  ) {
    const rest = parts.slice(2);
    if (rest[0] === "POPs") rest.shift();
    return ["POPs para Farmácias de Manipulação", ...rest].join("/");
  }
  if (parts[1] === "Gerados sob demanda") {
    return ["POPs sob demanda", ...parts.slice(2)].join("/");
  }

  return parts.slice(1).join("/");
}

function folderKey(scope: string, folderPath: string) {
  return `${scope}:${folderPath}`;
}

function normalizeQaSignal(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hasQaMarker(value?: string | null) {
  const normalized = normalizeQaSignal(value);
  return (
    normalized.startsWith("qa") ||
    normalized.startsWith("qa-") ||
    normalized.includes("qa ") ||
    normalized.includes("qa-p0") ||
    normalized.includes("qa-p1") ||
    normalized.includes("p0c") ||
    normalized.includes("p1a") ||
    normalized.includes("p1b") ||
    normalized.includes("p1c")
  );
}

function isQaLibraryItem(item: LibraryItem) {
  return (
    hasQaMarker(item.category) ||
    hasQaMarker(item.title) ||
    hasQaMarker(item.code) ||
    hasQaMarker(item.source)
  );
}

function isQaCanonicalDocument(document: CanonicalDocument) {
  return (
    hasQaMarker(document.category) ||
    hasQaMarker(document.title) ||
    hasQaMarker(document.code) ||
    normalizeFolderPath(document.category).toLowerCase().startsWith("qa")
  );
}

function isPopLibraryItem(item: LibraryItem) {
  return item.type === "POP" || isPopLibraryFolder(item.category);
}

function isPopCanonicalDocument(document: CanonicalDocument) {
  return isPopLibraryFolder(document.category);
}

export default function BibliotecaPopsPage() {
  const { data: session } = useSession() || {};
  const [pops, setPops] = useState<Pop[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [canonicalDocuments, setCanonicalDocuments] = useState<CanonicalDocument[]>([]);
  const [canonicalJobs, setCanonicalJobs] = useState<CanonicalIngestionJob[]>([]);
  const [selectedCanonicalDocumentId, setSelectedCanonicalDocumentId] = useState<string | null>(null);
  const [canonicalChunks, setCanonicalChunks] = useState<CanonicalChunk[]>([]);
  const [chunkSearch, setChunkSearch] = useState("");
  const [chunksLoading, setChunksLoading] = useState(false);
  const [chunksError, setChunksError] = useState<string | null>(null);
  const [chunksNextCursor, setChunksNextCursor] = useState<number | null>(null);
  const [retrievalQuery, setRetrievalQuery] = useState("");
  const [retrievalDocumentId, setRetrievalDocumentId] = useState("");
  const [retrievalLoading, setRetrievalLoading] = useState(false);
  const [retrievalError, setRetrievalError] = useState<string | null>(null);
  const [retrievalLogId, setRetrievalLogId] = useState<string | null>(null);
  const [retrievalResults, setRetrievalResults] = useState<CanonicalRetrievalChunk[]>([]);
  const [retrievalSearched, setRetrievalSearched] = useState(false);
  const [selectedCanonicalChunks, setSelectedCanonicalChunks] = useState<CanonicalDraftChunkSummary[]>([]);
  const [canonicalDraftDialogOpen, setCanonicalDraftDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [canonicalSendingId, setCanonicalSendingId] = useState<string | null>(null);
  const [chunkingDocumentId, setChunkingDocumentId] = useState<string | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [editingLibraryItemId, setEditingLibraryItemId] = useState<string | null>(null);
  const [showQaArtifacts, setShowQaArtifacts] = useState(false);
  const [popsError, setPopsError] = useState<string | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [canonicalError, setCanonicalError] = useState<string | null>(null);

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const canManageCanonicalContent = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "RT";
  const selectedCanonicalChunkIds = selectedCanonicalChunks.map((chunk) => chunk.id);
  const selectedRetrievalLogIds = new Set(
    selectedCanonicalChunks.map((chunk) => chunk.retrievalLogId).filter(Boolean)
  );
  const selectedDraftRetrievalLogId =
    selectedCanonicalChunks.length > 0 &&
    selectedCanonicalChunks.every((chunk) => chunk.retrievalLogId) &&
    selectedRetrievalLogIds.size === 1
      ? selectedCanonicalChunks[0].retrievalLogId || null
      : null;

  useEffect(() => {
    fetchPops();
  }, []);

  async function fetchPops() {
    setLoading(true);
    setPopsError(null);
    setLibraryError(null);
    setCanonicalError(null);

    const [popsResult, libraryResult, canonicalResult] = await Promise.allSettled([
      fetch("/api/pops?status=VIGENTE"),
      fetch("/api/document-library?status=ACTIVE"),
      fetch("/api/canonical/ingestion-jobs"),
    ]);

    if (popsResult.status === "fulfilled" && popsResult.value.ok) {
      const data = await popsResult.value.json();
      setPops(Array.isArray(data?.pops) ? data.pops : []);
    } else {
      setPops([]);
      setPopsError("Não foi possível carregar POPs vigentes.");
    }

    if (libraryResult.status === "fulfilled" && libraryResult.value.ok) {
      const libraryData = await libraryResult.value.json();
      setLibraryItems(Array.isArray(libraryData?.items) ? libraryData.items : []);
    } else {
      setLibraryItems([]);
      setLibraryError("Não foi possível carregar o acervo documental.");
    }

    if (canonicalResult.status === "fulfilled" && canonicalResult.value.ok) {
      const canonicalData = await canonicalResult.value.json();
      setCanonicalDocuments(Array.isArray(canonicalData?.documents) ? canonicalData.documents : []);
      setCanonicalJobs(Array.isArray(canonicalData?.jobs) ? canonicalData.jobs : []);
    } else {
      setCanonicalDocuments([]);
      setCanonicalJobs([]);
      setCanonicalError("Não foi possível carregar os documentos preparados para consulta.");
    }

    setLoading(false);
  }

  const popLibraryItems = libraryItems.filter(isPopLibraryItem);
  const popCanonicalDocuments = canonicalDocuments.filter(isPopCanonicalDocument);
  const visibleLibraryItems = showQaArtifacts
    ? popLibraryItems
    : popLibraryItems.filter((item) => !isQaLibraryItem(item));
  const visibleCanonicalDocuments = showQaArtifacts
    ? popCanonicalDocuments
    : popCanonicalDocuments.filter((document) => !isQaCanonicalDocument(document));
  const hiddenQaLibraryItemsCount = popLibraryItems.length - visibleLibraryItems.length;
  const hiddenQaCanonicalDocumentsCount = popCanonicalDocuments.length - visibleCanonicalDocuments.length;
  const hiddenQaArtifactsCount = hiddenQaLibraryItemsCount + hiddenQaCanonicalDocumentsCount;

  const filteredLibraryItems = visibleLibraryItems.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.code || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q)
    );
  });

  const filteredCanonicalDocuments = visibleCanonicalDocuments.filter((document) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      document.title.toLowerCase().includes(q) ||
      (document.code || "").toLowerCase().includes(q) ||
      (document.category || "").toLowerCase().includes(q)
    );
  });

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

  const libraryItemTree = buildFolderTree(filteredLibraryItems, (item) => getPopDisplayFolderPath(item.category));
  const canonicalDocumentTree = buildFolderTree(filteredCanonicalDocuments, (document) =>
    getPopDisplayFolderPath(document.category)
  );

  const toggleFolder = (key: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () =>
    setOpenFolders(
      new Set([
        ...collectFolderTreeKeys("library", libraryItemTree),
        ...collectFolderTreeKeys("canonical", canonicalDocumentTree),
        ...Object.keys(grouped).map((setor) => folderKey("pop", setor)),
      ])
    );
  const collapseAll = () => setOpenFolders(new Set());

  const canonicalByLibraryItemId = new Map<string, CanonicalDocument>();
  for (const document of canonicalDocuments) {
    const libraryItemId = document.libraryItemId || document.sourceId;
    if (libraryItemId) canonicalByLibraryItemId.set(libraryItemId, document);
  }

  const activeCanonicalJobBySourceId = new Map<string, CanonicalIngestionJob>();
  for (const job of canonicalJobs) {
    if (["PENDING", "QUEUED", "PROCESSING"].includes(job.status)) {
      activeCanonicalJobBySourceId.set(job.sourceId, job);
    }
  }

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

  async function handlePrintLibraryItem(item: LibraryItem, tipo: "final" | "editavel") {
    const actionId = `${item.id}:${tipo}`;
    setDownloadingId(actionId);
    try {
      const res = await fetch(`/api/biblioteca/${item.id}/imprimir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro ao gerar arquivo" }));
        throw new Error(err.error || "Erro ao gerar arquivo");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const extension = tipo === "editavel" ? "docx" : "pdf";
      a.href = url;
      a.download = `${item.code ? `${item.code} - ` : ""}${item.title}.${extension}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(tipo === "editavel" ? "Versão editável gerada" : "Versão final gerada");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao gerar impressão controlada");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleGenerateDraft(item: LibraryItem) {
    setGeneratingId(item.id);
    try {
      const res = await fetch("/api/pops/assisted-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Minuta - ${item.title}`,
          code: `MIN-${Date.now()}`,
          sourceIds: [item.id],
          objective: "Gerar minuta auxiliar para revisão do Responsável Técnico.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao gerar minuta");
      toast.success("Minuta assistida criada para revisão do RT");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao gerar minuta assistida");
    } finally {
      setGeneratingId(null);
    }
  }

  function toggleCanonicalChunkSelection(chunk: CanonicalDraftChunkSummary, checked: boolean) {
    setSelectedCanonicalChunks((current) => {
      if (!checked) return current.filter((item) => item.id !== chunk.id);
      if (current.some((item) => item.id === chunk.id)) return current;
      return [...current, chunk];
    });
  }

  function isCanonicalChunkSelected(chunkId: string) {
    return selectedCanonicalChunks.some((chunk) => chunk.id === chunkId);
  }

  async function handleCreateCanonicalPopDraft(values: {
    title: string;
    code: string;
    objective?: string;
    chunkIds: string[];
    retrievalLogId?: string | null;
  }) {
    const res = await fetch("/api/pops/assisted-drafts/from-canonical-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        code: values.code,
        objective: values.objective,
        chunkIds: values.chunkIds,
        retrievalLogId: values.retrievalLogId || undefined,
      }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 400) throw new Error("Revise os dados da minuta e selecione ao menos um trecho.");
      if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.");
      if (res.status === 403) throw new Error("Você não tem permissão para criar minuta POP.");
      if (res.status === 404) throw new Error("Trecho ou consulta não encontrado para este tenant.");
      if (res.status === 409) {
        throw new Error("Já existe POP com este código neste tenant. Escolha outro código para a minuta.");
      }
      throw new Error(data?.error || "Erro ao criar minuta POP.");
    }

    setSelectedCanonicalChunks([]);
    await fetchPops();
    return { popId: data?.pop?.id || null, draftId: data?.draft?.id || null };
  }

  async function handleSendToCanonicalLibrary(item: LibraryItem) {
    setCanonicalSendingId(item.id);
    try {
      const res = await fetch("/api/canonical/ingestion-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentaryLibraryItemId: item.id,
          sourceType: "DOCUMENTARY_LIBRARY_ITEM",
        }),
      });

      if (res.status === 201) {
        toast.success("Documento enviado para preparação.");
        await fetchPops();
        return;
      }

      if (res.status === 409) {
        toast.error("Este item já possui ingestão canônica ativa.");
        return;
      }

      if (res.status === 401 || res.status === 403) {
        toast.error("Você não tem permissão para preparar este documento para consulta.");
        return;
      }

      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Erro ao preparar documento para consulta.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao preparar documento para consulta.";
      toast.error(message);
    } finally {
      setCanonicalSendingId(null);
    }
  }

  async function handleGenerateCanonicalChunks(document: CanonicalDocument) {
    setChunkingDocumentId(document.id);
    try {
      const res = await fetch(`/api/canonical/documents/${document.id}/chunks`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (res.status === 201) {
        toast.success(`Trechos preparados para ${document.title}.`);
        setSelectedCanonicalDocumentId(document.id);
        setChunkSearch("");
        await fetchPops();
        await fetchCanonicalChunks(document.id, { query: "" });
        return;
      }

      if (res.status === 409) {
        toast.error("Os trechos deste documento já foram preparados.");
        setSelectedCanonicalDocumentId(document.id);
        await fetchCanonicalChunks(document.id, { query: "" });
        return;
      }

      if (res.status === 422) {
        toast.error(data?.error || "Documento sem texto suficiente para preparar trechos.");
        return;
      }

      if (res.status === 401 || res.status === 403) {
        toast.error("Você não tem permissão para preparar trechos deste documento.");
        return;
      }

      throw new Error(data?.error || "Erro ao preparar trechos do documento.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao preparar trechos do documento.";
      toast.error(message);
    } finally {
      setChunkingDocumentId(null);
    }
  }

  async function fetchCanonicalChunks(
    documentId: string,
    options?: { cursor?: number | null; append?: boolean; query?: string }
  ) {
    setChunksLoading(true);
    setChunksError(null);
    try {
      const params = new URLSearchParams({ limit: "20" });
      const query = options?.query ?? chunkSearch;
      if (query.trim()) params.set("q", query.trim());
      if (options?.cursor !== undefined && options.cursor !== null) params.set("cursor", String(options.cursor));

      const res = await fetch(`/api/canonical/documents/${documentId}/chunks?${params.toString()}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível carregar os trechos.");
      }

      const nextChunks = Array.isArray(data?.chunks) ? data.chunks : [];
      setCanonicalChunks((prev) => (options?.append ? [...prev, ...nextChunks] : nextChunks));
      setChunksNextCursor(typeof data?.pagination?.nextCursor === "number" ? data.pagination.nextCursor : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível carregar os trechos.";
      setCanonicalChunks((prev) => (options?.append ? prev : []));
      setChunksNextCursor(null);
      setChunksError(message);
    } finally {
      setChunksLoading(false);
    }
  }

  function handleViewChunks(documentId: string) {
    setChunkSearch("");
    setCanonicalChunks([]);
    setChunksNextCursor(null);
    setChunksError(null);
    setSelectedCanonicalDocumentId((current) => (current === documentId ? null : documentId));
    if (selectedCanonicalDocumentId !== documentId) {
      fetchCanonicalChunks(documentId, { query: "" });
    }
  }

  async function handleCanonicalRetrieval() {
    const query = retrievalQuery.trim();
    if (query.length < 2) {
      setRetrievalError("Digite pelo menos 2 caracteres para buscar nos documentos.");
      setRetrievalResults([]);
      setRetrievalLogId(null);
      setRetrievalSearched(true);
      return;
    }

    setRetrievalLoading(true);
    setRetrievalError(null);
    setRetrievalLogId(null);
    setRetrievalSearched(true);

    try {
      const res = await fetch("/api/canonical/retrievals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: query,
          documentId: retrievalDocumentId || undefined,
          purpose: "CANONICAL_SEARCH",
          limit: 10,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Você não tem permissão para buscar nos documentos.");
        }
        throw new Error(data?.error || "Não foi possível buscar nos documentos.");
      }

      setRetrievalResults(Array.isArray(data?.chunks) ? data.chunks : []);
      setRetrievalLogId(typeof data?.retrievalLogId === "string" ? data.retrievalLogId : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível buscar nos documentos.";
      setRetrievalResults([]);
      setRetrievalError(message);
    } finally {
      setRetrievalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  const totalPops = filteredPops.length;
  const selectedCanonicalChunksCount = selectedCanonicalChunkIds.length;
  const selectedCanonicalChunksCta =
    canManageCanonicalContent && selectedCanonicalChunksCount > 0 ? (
      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">
              {selectedCanonicalChunksCount}{" "}
              {selectedCanonicalChunksCount === 1
                ? "trecho selecionado"
                : "trechos selecionados"}
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Crie uma minuta auxiliar para revisão do RT a partir dos trechos
              selecionados.
            </p>
          </div>
          <Button size="sm" onClick={() => setCanonicalDraftDialogOpen(true)}>
            <Wand2 className="h-4 w-4 mr-1" />
            Criar minuta POP
          </Button>
        </div>
      </div>
    ) : null;

  const renderLibraryFolderNode = (node: FolderTreeNode<LibraryItem>, depth = 0) => {
    const key = folderKey("library", node.path);
    const isOpen = openFolders.has(key);

    return (
      <div key={key} className="overflow-hidden border-t first:border-t-0">
        <button
          type="button"
          onClick={() => toggleFolder(key)}
          className="flex w-full items-center gap-3 py-3 pr-4 text-left transition-colors hover:bg-gray-50"
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          <ChevronRight
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
          {isOpen ? (
            <FolderOpen className="h-4 w-4 text-amber-500" />
          ) : (
            <FolderClosed className="h-4 w-4 text-amber-500" />
          )}
          <span className="flex-1 truncate text-sm font-medium text-gray-900">{node.label}</span>
          {node.needsReview && <Badge variant="outline">Revisar</Badge>}
          <Badge variant="secondary">{node.count}</Badge>
        </button>

        {isOpen && (
          <div className="bg-white">
            {node.children.map((child) => renderLibraryFolderNode(child, depth + 1))}
            {node.items.length > 0 && (
              <div className="divide-y bg-gray-50">
                {node.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-white py-3 pr-4"
                    style={{ paddingLeft: `${52 + depth * 20}px` }}
                  >
                    <Library className="h-4 w-4 flex-shrink-0 text-teal-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.code ? `${item.code} - ` : ""}
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.type} · {formatFolderLabel(item.category)} · {item.version || "sem versão"}
                      </p>
                      {(canonicalByLibraryItemId.has(item.id) || activeCanonicalJobBySourceId.has(item.id)) && (
                        <p className="mt-1 text-xs text-teal-700">Já preparado para consulta</p>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintLibraryItem(item, "final")}
                        disabled={downloadingId === `${item.id}:final`}
                        title="Gerar versão final PDF"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintLibraryItem(item, "editavel")}
                        disabled={downloadingId === `${item.id}:editavel`}
                        title="Gerar versão editável DOCX"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        DOCX
                      </Button>
                    </div>
                    {canManageCanonicalContent && (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingLibraryItemId(item.id);
                            setDocumentDialogOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendToCanonicalLibrary(item)}
                          disabled={
                            canonicalSendingId === item.id ||
                            canonicalByLibraryItemId.has(item.id) ||
                            activeCanonicalJobBySourceId.has(item.id)
                          }
                        >
                          <Library className="h-4 w-4 mr-1" />
                          Preparar para consulta
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateDraft(item)}
                          disabled={generatingId === item.id}
                        >
                          <Wand2 className="h-4 w-4 mr-1" />
                          Minuta simples
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCanonicalDocumentCard = (document: CanonicalDocument) => {
    const job = canonicalJobs.find((item) => item.canonicalDocumentId === document.id);
    const isViewingChunks = selectedCanonicalDocumentId === document.id;

    return (
      <div key={document.id} className="rounded-lg border bg-white px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Library className="h-4 w-4 flex-shrink-0 text-teal-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {document.code ? `${document.code} - ` : ""}
              {document.title}
            </p>
            <p className="text-xs text-gray-500">
              {document.kind} · {document.sourceType} · {document.version || "sem versão"} ·{" "}
              {formatFolderLabel(document.category)} · atualizado em{" "}
              {format(new Date(document.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{formatCanonicalStatus(document.status)}</Badge>
            {job && <Badge variant="outline">{formatCanonicalJobStatus(job.status)}</Badge>}
            {canManageCanonicalContent && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateCanonicalChunks(document)}
                disabled={chunkingDocumentId === document.id}
              >
                <FileText className="h-4 w-4 mr-1" />
                {chunkingDocumentId === document.id ? "Preparando..." : "Preparar trechos"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => handleViewChunks(document.id)}>
              <Eye className="h-4 w-4 mr-1" />
              {isViewingChunks ? "Ocultar trechos" : "Ver trechos"}
            </Button>
          </div>
        </div>

        {isViewingChunks && (
          <div className="mt-4 rounded-md border bg-gray-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar texto nos trechos..."
                  value={chunkSearch}
                  onChange={(event) => setChunkSearch(event.target.value)}
                  className="pl-10"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      fetchCanonicalChunks(document.id);
                    }
                  }}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchCanonicalChunks(document.id)}
                disabled={chunksLoading}
              >
                Buscar
              </Button>
            </div>

            {selectedCanonicalChunksCta && <div className="mt-3">{selectedCanonicalChunksCta}</div>}

            {!canManageCanonicalContent && (
              <div className="mt-3 rounded-md border bg-white p-3 text-sm text-gray-600">
                A criação de minuta POP está disponível apenas para Administradores e Responsáveis Técnicos.
              </div>
            )}

            {chunksError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {chunksError}
              </div>
            )}

            {chunksLoading && canonicalChunks.length === 0 ? (
              <div className="mt-4 flex justify-center py-6">
                <LoadingSpinner />
              </div>
            ) : canonicalChunks.length === 0 && !chunksError ? (
              <div className="mt-3 rounded-md border bg-white p-4 text-sm text-gray-500">
                Nenhum trecho encontrado para este documento.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {canonicalChunks.map((chunk) => (
                  <div key={chunk.id} className="rounded-md border bg-white p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-3">
                        {canManageCanonicalContent && (
                          <Checkbox
                            checked={isCanonicalChunkSelected(chunk.id)}
                            onCheckedChange={(checked) =>
                              toggleCanonicalChunkSelection(
                                {
                                  id: chunk.id,
                                  chunkIndex: chunk.chunkIndex,
                                  documentTitle: document.title,
                                  documentCode: document.code,
                                  heading: chunk.heading,
                                  text: chunk.text,
                                  retrievalLogId: null,
                                },
                                checked === true
                              )
                            }
                            aria-label={`Selecionar trecho ${chunk.chunkIndex + 1}`}
                            className="mt-1"
                          />
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">Trecho {chunk.chunkIndex + 1}</Badge>
                          <Badge variant="secondary">{formatSemanticRole(chunk.semanticRole)}</Badge>
                          <span className="text-xs text-gray-500">{chunk.tokenEstimate} tokens estimados</span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-gray-400">
                        {chunk.sourceHash.slice(0, 12)}
                      </span>
                    </div>
                    {chunk.heading && (
                      <p className="mt-2 text-sm font-medium text-gray-800">{chunk.heading}</p>
                    )}
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {chunk.text.length > 700 ? `${chunk.text.slice(0, 700)}...` : chunk.text}
                    </p>
                  </div>
                ))}
                {chunksNextCursor !== null && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchCanonicalChunks(document.id, { cursor: chunksNextCursor, append: true })}
                    disabled={chunksLoading}
                  >
                    Carregar mais trechos
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCanonicalFolderNode = (node: FolderTreeNode<CanonicalDocument>, depth = 0) => {
    const key = folderKey("canonical", node.path);
    const isOpen = openFolders.has(key);

    return (
      <div key={key} className="overflow-hidden border-t first:border-t-0">
        <button
          type="button"
          onClick={() => toggleFolder(key)}
          className="flex w-full items-center gap-3 py-3 pr-4 text-left transition-colors hover:bg-gray-50"
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          <ChevronRight
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
          {isOpen ? (
            <FolderOpen className="h-4 w-4 text-amber-500" />
          ) : (
            <FolderClosed className="h-4 w-4 text-amber-500" />
          )}
          <span className="flex-1 truncate text-sm font-medium text-gray-900">{node.label}</span>
          {node.needsReview && <Badge variant="outline">Revisar</Badge>}
          <Badge variant="secondary">{node.count}</Badge>
        </button>

        {isOpen && (
          <div className="bg-white">
            {node.children.map((child) => renderCanonicalFolderNode(child, depth + 1))}
            {node.items.length > 0 && (
              <div className="space-y-2 border-t bg-gray-50 p-3">
                {node.items.map((document) => renderCanonicalDocumentCard(document))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca de POPs"
        description={`${visibleLibraryItems.length} itens organizados em pastas e ${totalPops} POPs vigentes na esteira operacional`}
      />

      <DocumentLibraryItemDialog
        open={documentDialogOpen}
        onOpenChange={(open) => {
          setDocumentDialogOpen(open);
          if (!open) setEditingLibraryItemId(null);
        }}
        onSuccess={fetchPops}
        editingItemId={editingLibraryItemId}
      />

      <CanonicalPopDraftDialog
        open={canonicalDraftDialogOpen}
        onOpenChange={setCanonicalDraftDialogOpen}
        chunks={selectedCanonicalChunks}
        retrievalLogId={selectedDraftRetrievalLogId}
        onSubmit={handleCreateCanonicalPopDraft}
      />

      <div className="rounded-lg border bg-amber-50 p-3 text-sm text-amber-900">
        Geração assistida cria apenas minuta auxiliar. Uso operacional depende de revisão e aprovação do Responsável Técnico.
      </div>

      {(libraryError || popsError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {libraryError || popsError}
        </div>
      )}

      {canonicalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {canonicalError}
        </div>
      )}

      {hiddenQaArtifactsCount > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border bg-slate-50 p-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Itens de teste ocultos: {hiddenQaArtifactsCount}
            {hiddenQaLibraryItemsCount > 0 && ` · acervo ${hiddenQaLibraryItemsCount}`}
            {hiddenQaCanonicalDocumentsCount > 0 && ` · preparados ${hiddenQaCanonicalDocumentsCount}`}
          </span>
          {canManageCanonicalContent && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQaArtifacts((current) => !current)}
            >
              {showQaArtifacts ? "Ocultar itens de teste" : "Mostrar itens de teste"}
            </Button>
          )}
        </div>
      )}

      {/* Search and controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por código, título ou pasta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {canManageCanonicalContent && (
            <Button variant="outline" size="sm" onClick={() => setDocumentDialogOpen(true)}>
              <FilePlus2 className="h-4 w-4 mr-1" /> Novo item documental
            </Button>
          )}
          {canManageCanonicalContent && selectedCanonicalChunkIds.length > 0 && (
            <Button size="sm" onClick={() => setCanonicalDraftDialogOpen(true)}>
              <Wand2 className="h-4 w-4 mr-1" />
              Criar minuta POP ({selectedCanonicalChunkIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={expandAll}>
            <FolderOpen className="h-4 w-4 mr-1" /> Expandir tudo
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <FolderClosed className="h-4 w-4 mr-1" /> Recolher tudo
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-800">Busca nos documentos de referência</h3>
            <p className="mt-1 text-xs text-gray-500">
              Pesquise nos trechos preparados dos documentos. Cada busca gera um registro interno para auditoria.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_280px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar texto nos documentos de referência..."
                value={retrievalQuery}
                onChange={(event) => setRetrievalQuery(event.target.value)}
                className="pl-10"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleCanonicalRetrieval();
                  }
                }}
              />
            </div>

            <select
              value={retrievalDocumentId}
              onChange={(event) => setRetrievalDocumentId(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todos os documentos de referência</option>
              {visibleCanonicalDocuments.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.code ? `${document.code} - ` : ""}{document.title}
                </option>
              ))}
            </select>

            <Button onClick={handleCanonicalRetrieval} disabled={retrievalLoading}>
              Buscar nos documentos
            </Button>
          </div>

          {retrievalError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {retrievalError}
            </div>
          )}

          {retrievalLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : retrievalSearched && retrievalResults.length === 0 && !retrievalError ? (
            <div className="rounded-md border bg-gray-50 p-4 text-sm text-gray-500">
              Nenhum trecho encontrado para esta consulta textual.
              {retrievalLogId && (
                <span className="mt-2 block font-mono text-xs text-gray-400">Registro da busca: {retrievalLogId}</span>
              )}
            </div>
          ) : retrievalResults.length > 0 ? (
            <div className="space-y-3">
              {retrievalLogId && (
                <div className="rounded-md border bg-teal-50 p-3 text-xs text-teal-800">
                  Consulta registrada para auditoria: <span className="font-mono">{retrievalLogId}</span>
                  {canManageCanonicalContent && (
                    <span className="mt-1 block text-teal-700">
                      Selecione trechos para criar uma minuta POP rastreável.
                    </span>
                  )}
                </div>
              )}
              {retrievalResults.map((chunk) => (
                <div key={chunk.id} className="rounded-md border bg-white p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      {canManageCanonicalContent && (
                        <Checkbox
                          checked={isCanonicalChunkSelected(chunk.id)}
                          onCheckedChange={(checked) =>
                            toggleCanonicalChunkSelection(
                              {
                                id: chunk.id,
                                chunkIndex: chunk.chunkIndex,
                                documentTitle: chunk.canonicalDocument?.title || chunk.canonicalDocumentId,
                                documentCode: chunk.canonicalDocument?.code,
                                heading: chunk.heading,
                                text: chunk.text,
                                retrievalLogId,
                              },
                              checked === true
                            )
                          }
                          aria-label={`Selecionar trecho ${chunk.chunkIndex + 1}`}
                          className="mt-1"
                        />
                      )}
                      <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {chunk.canonicalDocument?.code ? `${chunk.canonicalDocument.code} - ` : ""}
                        {chunk.canonicalDocument?.title || chunk.canonicalDocumentId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Documento {chunk.canonicalDocumentId} · Trecho {chunk.chunkIndex + 1}
                      </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{formatSemanticRole(chunk.semanticRole)}</Badge>
                      <Badge variant="outline">{chunk.tokenEstimate} tokens estimados</Badge>
                    </div>
                  </div>
                  {chunk.heading && <p className="mt-2 text-sm font-medium text-gray-800">{chunk.heading}</p>}
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {chunk.text.length > 700 ? `${chunk.text.slice(0, 700)}...` : chunk.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-gray-50 p-4 text-sm text-gray-500">
              Informe um termo para buscar nos documentos.
            </div>
          )}
        </div>
      </Card>

      {/* Folders */}
      {filteredLibraryItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Acervo de POPs</h3>
          <div className="overflow-hidden rounded-lg border bg-white">
            {libraryItemTree.map((node) => renderLibraryFolderNode(node))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">POPs preparados para consulta</h3>
        {filteredCanonicalDocuments.length === 0 && canonicalJobs.length === 0 ? (
          <Card className="p-5 text-sm text-gray-500">
            Nenhum POP preparado para consulta.
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-white">
            {canonicalDocumentTree.map((node) => renderCanonicalFolderNode(node))}
          </div>
        )}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <Library className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum POP encontrado{search ? " para esta busca" : ""}.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([setor, items]) => {
            const key = folderKey("pop", setor);
            const isOpen = openFolders.has(key);
            const icon = FOLDER_ICONS[setor] || "\ud83d\udcc1";
            return (
              <div key={setor} className="border rounded-lg bg-white overflow-hidden">
                {/* Folder header */}
                <button
                  onClick={() => toggleFolder(key)}
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

