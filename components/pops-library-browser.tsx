"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  GraduationCap,
  Plus,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Kit {
  folder: string;
  name: string;
  category: string;
  found_pops: number;
  description?: string;
  is_main_kit?: boolean;
}

interface Pop {
  id: string;
  codigo: string;
  titulo: string;
  categoria: string;
  kit: string;
  kitName: string;
}

export function POPsLibraryBrowser() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedKit, setSelectedKit] = useState<string | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPop, setSelectedPop] = useState<Pop | null>(null);
  const [creatingTraining, setCreatingTraining] = useState(false);

  useEffect(() => {
    loadKits();
  }, []);

  useEffect(() => {
    if (selectedKit) {
      loadKitPops(selectedKit);
    }
  }, [selectedKit]);

  const loadKits = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pops-library");
      const data = await response.json();
      
      if (data.kits) {
        // Ordenar: kit principal primeiro, depois por prioridade
        const sorted = data.kits.sort((a: Kit, b: Kit) => {
          if (a.is_main_kit) return -1;
          if (b.is_main_kit) return 1;
    // @ts-ignore
          return a.priority - b.priority;
        });
        setKits(sorted);
      }
    } catch (error) {
      toast.error("Erro ao carregar biblioteca de POPs");
    } finally {
      setLoading(false);
    }
  };

  const loadKitPops = async (kitFolder: string) => {
    try {
      const response = await fetch(`/api/pops-library?kit=${kitFolder}`);
      const data = await response.json();
      
      if (data.pops) {
        setPops(data.pops.map((p: any) => ({
          ...p,
          kit: kitFolder,
          kitName: data.kit?.name || kitFolder
        })));
      }
    } catch (error) {
      toast.error("Erro ao carregar POPs do kit");
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/pops-library?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      
      if (data.results) {
        setPops(data.results);
        setSelectedKit(null);
      }
    } catch (error) {
      toast.error("Erro na busca");
    } finally {
      setLoading(false);
    }
  };

  const createTrainingFromPop = async (pop: Pop) => {
    try {
      setCreatingTraining(true);
      setSelectedPop(pop);
      
      const response = await fetch("/api/pops-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kitFolder: pop.kit,
          popId: pop.id,
          tenantId: "tenant_id_aqui", // Pegar do contexto
          generateMaterials: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`POP ${pop.codigo} importado! ${data.treinamentosCriados} treinamentos criados.`);
      } else {
        toast.error(data.error || "Erro ao criar treinamento");
      }
    } catch (error) {
      toast.error("Erro ao criar treinamento");
    } finally {
      setCreatingTraining(false);
      setSelectedPop(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Farmácia de Manipulação - Principal": "bg-blue-100 text-blue-800",
      "Manipulação Especial": "bg-red-100 text-red-800",
      "Homeopatia": "bg-amber-100 text-amber-800",
      "Veterinária": "bg-pink-100 text-pink-800",
      "Serviços Farmacêuticos": "bg-cyan-100 text-cyan-800",
      "Compliance": "bg-purple-100 text-purple-800",
      "Fiscalização": "bg-orange-100 text-orange-800",
      "Regulatório": "bg-teal-100 text-teal-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (loading && kits.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-teal-600" />
            Biblioteca de POPs
          </h2>
          <p className="text-muted-foreground">
            {kits.reduce((acc, k) => acc + k.found_pops, 0)} POPs disponíveis para treinamento
          </p>
        </div>
        
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Buscar POP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-64"
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Kits Grid */}
      {!selectedKit && !search && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kits.map((kit) => (
            <Card
              key={kit.folder}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                kit.is_main_kit ? "border-teal-500 border-2" : ""
              }`}
              onClick={() => setSelectedKit(kit.folder)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-teal-600" />
                    <CardTitle className="text-base">{kit.name}</CardTitle>
                  </div>
                  {kit.is_main_kit && (
                    <Badge variant="default" className="bg-teal-600">
                      Principal
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Badge className={getCategoryColor(kit.category)}>
                  {kit.category}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {kit.found_pops} POPs
                </p>
                {kit.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {kit.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* POPs List */}
      {(selectedKit || search) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedKit(null);
                  setSearch("");
                  setPops([]);
                }}
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Voltar
              </Button>
              <CardTitle className="text-lg">
                {search ? `Resultados para "${search}"` : pops[0]?.kitName}
              </CardTitle>
            </div>
            <Badge variant="secondary">{pops.length} POPs</Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {pops.map((pop) => (
                  <div
                    key={pop.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-teal-600 mt-0.5" />
                      <div>
                        <div className="font-medium">{pop.codigo}</div>
                        <div className="text-sm text-muted-foreground">
                          {pop.titulo}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {pop.categoria}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {pop.kitName}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => setSelectedPop(pop)}
                          disabled={creatingTraining && selectedPop?.id === pop.id}
                        >
                          {creatingTraining && selectedPop?.id === pop.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <GraduationCap className="h-4 w-4 mr-1" />
                              Treinar
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Treinamento</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="font-medium">{pop.codigo}</div>
                            <div className="text-sm">{pop.titulo}</div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            Ao criar o treinamento:
                          </p>
                          <ul className="text-sm space-y-1 list-disc list-inside">
                            <li>POP será importado para o sistema</li>
                            <li>Materiais de treinamento serão gerados</li>
                            <li>Funcionários poderão ser matriculados</li>
                            <li>Certificados serão emitidos após conclusão</li>
                          </ul>
                          
                          <Button 
                            onClick={() => createTrainingFromPop(pop)}
                            className="w-full"
                            disabled={creatingTraining}
                          >
                            {creatingTraining ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Criando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar e Criar Treinamento
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
