"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/loading-spinner";
import { DocumentLibraryItemDialog } from "@/components/document-library-item-dialog";
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
  const { data: session } = useSession();
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [canonicalSendingId, setCanonicalSendingId] = useState<string | null>(null);
  const [chunkingDocumentId, setChunkingDocumentId] = useState<string | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [popsError, setPopsError] = useState<string | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [canonicalError, setCanonicalError] = useState<string | null>(null);

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const canManageCanonicalContent = userRole === "ADMIN" || userRole === "RT";

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
      setCanonicalError("Não foi possível carregar a Biblioteca Canônica.");
    }

    setLoading(false);
  }

  const filteredLibraryItems = libraryItems.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.code || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q)
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
        toast.success("Documento enviado para revisão canônica.");
        await fetchPops();
        return;
      }

      if (res.status === 409) {
        toast.error("Este item já possui ingestão canônica ativa.");
        return;
      }

      if (res.status === 401 || res.status === 403) {
        toast.error("Você não tem permissão para enviar este item à Biblioteca Canônica.");
        return;
      }

      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Erro ao enviar documento para revisão canônica.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao enviar documento para revisão canônica.";
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
        toast.success(`Chunks gerados para ${document.title}.`);
        setSelectedCanonicalDocumentId(document.id);
        setChunkSearch("");
        await fetchPops();
        await fetchCanonicalChunks(document.id, { query: "" });
        return;
      }

      if (res.status === 409) {
        toast.error("Chunks já gerados para este documento.");
        setSelectedCanonicalDocumentId(document.id);
        await fetchCanonicalChunks(document.id, { query: "" });
        return;
      }

      if (res.status === 422) {
        toast.error(data?.error || "Documento sem texto suficiente para gerar chunks.");
        return;
      }

      if (res.status === 401 || res.status === 403) {
        toast.error("Você não tem permissão para gerar chunks canônicos.");
        return;
      }

      throw new Error(data?.error || "Erro ao gerar chunks canônicos.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao gerar chunks canônicos.";
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
        throw new Error(data?.error || "Não foi possível carregar os chunks.");
      }

      const nextChunks = Array.isArray(data?.chunks) ? data.chunks : [];
      setCanonicalChunks((prev) => (options?.append ? [...prev, ...nextChunks] : nextChunks));
      setChunksNextCursor(typeof data?.pagination?.nextCursor === "number" ? data.pagination.nextCursor : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível carregar os chunks.";
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
      setRetrievalError("Digite pelo menos 2 caracteres para consultar o acervo canônico.");
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
          throw new Error("Você não tem permissão para consultar o acervo canônico.");
        }
        throw new Error(data?.error || "Não foi possível consultar o acervo canônico.");
      }

      setRetrievalResults(Array.isArray(data?.chunks) ? data.chunks : []);
      setRetrievalLogId(typeof data?.retrievalLogId === "string" ? data.retrievalLogId : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível consultar o acervo canônico.";
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca documental"
        description={`${libraryItems.length} itens de acervo e ${totalPops} POPs vigentes para consulta interna`}
      />

      <DocumentLibraryItemDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        onSuccess={fetchPops}
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
            <h3 className="text-sm font-medium text-gray-800">Consulta Canônica</h3>
            <p className="mt-1 text-xs text-gray-500">
              Consulta textual auditável sobre chunks canônicos. Cada consulta gera registro interno de recuperação.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_280px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Consultar texto no acervo canônico..."
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
              <option value="">Todos os documentos canônicos</option>
              {canonicalDocuments.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.code ? `${document.code} - ` : ""}{document.title}
                </option>
              ))}
            </select>

            <Button onClick={handleCanonicalRetrieval} disabled={retrievalLoading}>
              Consultar acervo canônico
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
                <span className="mt-2 block font-mono text-xs text-gray-400">Retrieval log: {retrievalLogId}</span>
              )}
            </div>
          ) : retrievalResults.length > 0 ? (
            <div className="space-y-3">
              {retrievalLogId && (
                <div className="rounded-md border bg-teal-50 p-3 text-xs text-teal-800">
                  Consulta registrada para auditoria: <span className="font-mono">{retrievalLogId}</span>
                </div>
              )}
              {retrievalResults.map((chunk) => (
                <div key={chunk.id} className="rounded-md border bg-white p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {chunk.canonicalDocument?.code ? `${chunk.canonicalDocument.code} - ` : ""}
                        {chunk.canonicalDocument?.title || chunk.canonicalDocumentId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Documento {chunk.canonicalDocumentId} · Chunk {chunk.chunkIndex + 1}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{chunk.semanticRole}</Badge>
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
              Informe um termo para consultar o acervo canônico.
            </div>
          )}
        </div>
      </Card>

      {/* Folders */}
      {filteredLibraryItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Acervo documental</h3>
          {filteredLibraryItems.slice(0, 12).map((item) => (
            <div key={item.id} className="flex items-center gap-3 border rounded-lg bg-white px-4 py-3">
              <Library className="h-4 w-4 text-teal-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.code ? `${item.code} - ` : ""}{item.title}</p>
                <p className="text-xs text-gray-500">
                  {item.type} · {item.category || "sem categoria"} · {item.version || "sem versão"}
                </p>
                {(canonicalByLibraryItemId.has(item.id) || activeCanonicalJobBySourceId.has(item.id)) && (
                  <p className="mt-1 text-xs text-teal-700">
                    Já enviado para revisão canônica
                  </p>
                )}
              </div>
              {canManageCanonicalContent && (
                <div className="flex flex-wrap justify-end gap-2">
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
                    Enviar para Biblioteca Canônica
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleGenerateDraft(item)} disabled={generatingId === item.id}>
                    <Wand2 className="h-4 w-4 mr-1" />
                    Minuta
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Biblioteca Canônica</h3>
        {canonicalDocuments.length === 0 && canonicalJobs.length === 0 ? (
          <Card className="p-5 text-sm text-gray-500">
            Nenhum documento enviado para revisão canônica.
          </Card>
        ) : (
          <div className="space-y-2">
            {canonicalDocuments.map((document) => {
              const job = canonicalJobs.find((item) => item.canonicalDocumentId === document.id);
              const isViewingChunks = selectedCanonicalDocumentId === document.id;
              return (
                <div key={document.id} className="rounded-lg border bg-white px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Library className="h-4 w-4 text-teal-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {document.code ? `${document.code} - ` : ""}
                        {document.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {document.kind} · {document.sourceType} · {document.version || "sem versão"} · atualizado em{" "}
                        {format(new Date(document.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{document.status}</Badge>
                      {job && <Badge variant="outline">Job {job.status}</Badge>}
                      {canManageCanonicalContent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateCanonicalChunks(document)}
                          disabled={chunkingDocumentId === document.id}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {chunkingDocumentId === document.id ? "Gerando..." : "Gerar chunks"}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleViewChunks(document.id)}>
                        <Eye className="h-4 w-4 mr-1" />
                        {isViewingChunks ? "Ocultar chunks" : "Ver chunks"}
                      </Button>
                    </div>
                  </div>

                  {isViewingChunks && (
                    <div className="mt-4 rounded-md border bg-gray-50 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar texto nos chunks..."
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
                        <Button size="sm" variant="outline" onClick={() => fetchCanonicalChunks(document.id)} disabled={chunksLoading}>
                          Buscar
                        </Button>
                      </div>

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
                          Nenhum chunk encontrado para este documento.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {canonicalChunks.map((chunk) => (
                            <div key={chunk.id} className="rounded-md border bg-white p-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline">Chunk {chunk.chunkIndex + 1}</Badge>
                                  <Badge variant="secondary">{chunk.semanticRole}</Badge>
                                  <span className="text-xs text-gray-500">{chunk.tokenEstimate} tokens estimados</span>
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
                              Carregar mais chunks
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
