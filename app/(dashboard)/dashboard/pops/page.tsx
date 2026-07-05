"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Eye, Edit, Download, Info, X, Search, FolderOpen, Folder } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SETORES } from "@/lib/types";
import { PopFormDialog } from "./_components/pop-form-dialog";

interface Pop {
  id: string;
  codigo: string;
  titulo: string;
  setor: string;
  versao: string;
  dataRevisao: string;
  responsavel: string;
  status: string;
  arquivoUrl?: string;
  arquivoPublic?: boolean;
  createdAt: string;
}

const WORKFLOW_STATUSES = ["RASCUNHO", "EM_REVISAO", "REJEITADO"];

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "secondary"; label: string }> = {
  RASCUNHO: { variant: "secondary", label: "Rascunho" },
  EM_REVISAO: { variant: "warning", label: "Em revisão pelo RT" },
  REJEITADO: { variant: "warning", label: "Rejeitado pelo RT" },
  APROVADO: { variant: "success", label: "Aprovado pelo RT" },
  VIGENTE: { variant: "success", label: "Vigente para uso interno" },
  OBSOLETO: { variant: "secondary", label: "Obsoleto" },
  ATIVO: { variant: "success", label: "Ativo" },
  ARQUIVADO: { variant: "warning", label: "Arquivado" },
};

const STATUS_FOLDERS = [
  { status: "RASCUNHO", label: "Rascunhos" },
  { status: "EM_REVISAO", label: "Em revisão pelo RT" },
  { status: "REJEITADO", label: "Rejeitados" },
];

export default function PopsPage() {
  const [pops, setPops] = useState<Pop[]>([]);
  const [loading, setLoading] = useState(true);
  const [setorFilter, setSetorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPop, setEditingPop] = useState<Pop | null>(null);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);

  const fetchPops = async () => {
    try {
      const params = new URLSearchParams({ fase: "minuta" });
      if (setorFilter && setorFilter !== "all") params.append("setor", setorFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/pops?${params.toString()}`);
      const data = await res.json();
      if (data?.pops) {
        setPops(data.pops);
      }
    } catch (error) {
      toast.error("Erro ao carregar POPs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPops();
  }, [setorFilter, statusFilter]);

  useEffect(() => {
    setTutorialDismissed(localStorage.getItem("visadocs_pops_tutorial_dismissed") === "true");
  }, []);

  const dismissTutorial = () => {
    localStorage.setItem("visadocs_pops_tutorial_dismissed", "true");
    setTutorialDismissed(true);
  };

  const handleDownload = async (pop: Pop) => {
    if (!pop?.arquivoUrl) {
      toast.error("Arquivo não disponível");
      return;
    }
    try {
      const res = await fetch(`/api/pops/${pop.id}/download`);
      const data = await res.json();
      if (data?.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = pop.codigo + ".pdf";
        a.click();
      }
    } catch (error) {
      toast.error("Erro ao baixar arquivo");
    }
  };

  const filteredPops = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (pops ?? [])
      .filter((pop) => WORKFLOW_STATUSES.includes(pop.status))
      .filter((pop) => {
        if (!normalizedSearch) return true;
        return [pop.codigo, pop.titulo, pop.setor, pop.responsavel]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      });
  }, [pops, search]);

  const groupedBySetor = useMemo(() => {
    return filteredPops.reduce<Record<string, Pop[]>>((acc, pop) => {
      const setor = pop.setor || "Sem setor definido";
      acc[setor] = acc[setor] || [];
      acc[setor].push(pop);
      return acc;
    }, {});
  }, [filteredPops]);

  const sortedSetores = Object.keys(groupedBySetor).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const openSetores = search ? sortedSetores.map((setor) => `setor-${setor}`) : undefined;

  const renderActions = (item: Pop) => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild aria-label={`Visualizar POP ${item.codigo}`}>
        <Link href={`/dashboard/pops/${item.id}`}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar POP
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-label={`Editar POP ${item.codigo}`}
        onClick={() => {
          setEditingPop(item);
          setDialogOpen(true);
        }}
      >
        <Edit className="h-4 w-4 mr-2" />
        Editar POP
      </Button>
      {item?.arquivoUrl && (
        <Button
          variant="ghost"
          size="icon"
          title="Baixar arquivo"
          aria-label={`Baixar arquivo do POP ${item.codigo}`}
          onClick={() => handleDownload(item)}
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Criar POP"
        description="Área de trabalho para minutas, revisões e POPs sob demanda antes da publicação oficial"
      >
        <Button onClick={() => { setEditingPop(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo POP
        </Button>
      </PageHeader>

      {!tutorialDismissed && (
        <div className="mb-6 flex gap-3 rounded-md border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
          <p className="leading-relaxed">
            Nesta área você cria a minuta dos POPs que precisar gerar sob demanda. Após a aprovação da minuta pelo Responsável Técnico (RT), o POP é automaticamente incorporado à sua Biblioteca de POPs oficiais e disponibilizado na trilha de treinamento dos colaboradores/operadores. Enquanto o POP estiver em elaboração ou revisão, ele permanece listado aqui; assim que for aprovado e publicado, sai desta lista de trabalho e passa a viver na Biblioteca.
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2 h-7 w-7 shrink-0 text-teal-800 hover:bg-teal-100"
            aria-label="Ocultar aviso"
            onClick={dismissTutorial}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-[180px_220px_minmax(260px,480px)]">
        <Select value={setorFilter} onValueChange={setSetorFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {SETORES.map((setor) => (
              <SelectItem key={setor} value={setor}>{setor}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por fase da minuta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fases da minuta</SelectItem>
            <SelectItem value="RASCUNHO">Rascunho</SelectItem>
            <SelectItem value="EM_REVISAO">Em revisão pelo RT</SelectItem>
            <SelectItem value="REJEITADO">Rejeitado pelo RT</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, título, setor ou responsável..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {sortedSetores.length === 0 ? (
        <div className="rounded-md border p-10 text-center text-muted-foreground">
          Nenhuma minuta de POP encontrada nesta fase de criação/revisão.
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={openSetores} className="space-y-3">
          {sortedSetores.map((setor) => {
            const setorPops = groupedBySetor[setor];
            return (
              <AccordionItem key={setor} value={`setor-${setor}`} className="rounded-md border px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <FolderOpen className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-semibold">{setor}</p>
                      <p className="text-xs text-muted-foreground">{setorPops.length} POP(s) em criação ou revisão</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {STATUS_FOLDERS.map(({ status, label }) => {
                    const statusPops = setorPops.filter((pop) => pop.status === status);
                    if (statusPops.length === 0) return null;

                    return (
                      <div key={status} className="rounded-md border bg-muted/20">
                        <div className="flex items-center gap-2 border-b px-4 py-3">
                          <Folder className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">{label}</span>
                          <Badge variant="secondary">{statusPops.length}</Badge>
                        </div>
                        <div className="divide-y">
                          {statusPops.map((item) => {
                            const badge = STATUS_BADGES[item.status] ?? { variant: "secondary", label: item.status };
                            return (
                              <div key={item.id} className="grid gap-3 px-4 py-4 xl:grid-cols-[130px_minmax(260px,1fr)_110px_120px_minmax(260px,auto)] xl:items-center">
                                <span className="font-mono font-medium text-teal-600">{item.codigo ?? "N/A"}</span>
                                <div>
                                  <p className="font-medium">{item.titulo ?? "N/A"}</p>
                                  <p className="text-sm text-muted-foreground">{item.responsavel ?? "N/A"}</p>
                                </div>
                                <span className="text-sm">Versão {item.versao ?? "N/A"}</span>
                                <span className="text-sm">
                                  {item.dataRevisao ? format(new Date(item.dataRevisao), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                                </span>
                                <div className="flex flex-wrap items-center gap-3">
                                  <Badge variant={badge.variant}>{badge.label}</Badge>
                                  {renderActions(item)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <PopFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pop={editingPop}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingPop(null);
          fetchPops();
        }}
      />
    </div>
  );
}
