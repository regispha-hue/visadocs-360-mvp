"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpenCheck, FileText, GraduationCap, Microscope, RefreshCw, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CqModule = {
  code: string;
  title: string;
  workload: string;
  tracks: string[];
  category: string;
};

type CqTrack = {
  name: string;
  audience: string;
  requiredModules: string[];
  optionalModules: string[];
};

type LibraryItem = {
  id: string;
  type: string;
  title: string;
  code?: string | null;
  category?: string | null;
  version?: string | null;
  updatedAt: string;
};

type ModulePop = {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
  versao: string;
};

type Quiz = {
  id: string;
  titulo: string;
  notaMinima: number;
  ativo: boolean;
  pop?: { id: string; codigo: string; titulo: string };
  _count?: { questoes: number; tentativas: number };
};

type Training = {
  id: string;
  status: string;
  dataTreinamento: string;
  notaQuiz?: number | null;
  aprovadoQuiz?: boolean | null;
  colaborador?: { nome: string; funcao?: string | null };
  pop?: { codigo: string; titulo: string };
};

type CqData = {
  modules: CqModule[];
  tracks: CqTrack[];
  libraryItems: LibraryItem[];
  modulePops: ModulePop[];
  quizzes: Quiz[];
  trainings: Training[];
  reorganizar: LibraryItem[];
  compliance: {
    acervo: number;
    modulos: number;
    quizzes: number;
    treinamentos: number;
    pendenciasReorganizacao: number;
  };
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function ControleQualidadePage() {
  const [data, setData] = useState<CqData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    const response = await fetch("/api/controle-qualidade");
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error || "Erro ao carregar Controle de Qualidade");
      setLoading(false);
      return;
    }
    setData(payload);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredLibrary = useMemo(() => {
    const items = data?.libraryItems || [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => [item.title, item.code, item.category, item.type].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [data?.libraryItems, search]);

  const quizByPopCode = useMemo(() => {
    const map = new Map<string, Quiz>();
    for (const quiz of data?.quizzes || []) {
      if (quiz.pop?.codigo) map.set(quiz.pop.codigo, quiz);
    }
    return map;
  }, [data?.quizzes]);

  const popByCode = useMemo(() => {
    const map = new Map<string, ModulePop>();
    for (const pop of data?.modulePops || []) map.set(pop.codigo, pop);
    return map;
  }, [data?.modulePops]);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle de Qualidade</h1>
          <p className="text-muted-foreground">
            Acervo técnico, trilhas de treinamento, quizzes e evidências de conformidade para BPM/CQ.
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Trilha técnica de controle de qualidade
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Use esta página para organizar módulos, acervo, quizzes e evidências de CQ
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Aqui ficam os materiais técnicos de Controle de Qualidade, distribuídos em trilhas por perfil de usuário.
              Consulte os módulos, confira se cada tema já possui POP e quiz, acesse o acervo técnico e acompanhe as
              pendências que ainda precisam ser organizadas para fins de conformidade.
            </p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 text-sm text-gray-600 shadow-sm md:max-w-xs">
            <strong className="block text-gray-900">Como usar</strong>
            Comece pela aba Trilha para ver os módulos por perfil. Use Acervo para localizar materiais, Quizzes para
            revisar provas e Conformidade para identificar o que ainda precisa de ajuste.
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric icon={FileText} label="Acervo CQ" value={data?.compliance.acervo || 0} />
        <Metric icon={BookOpenCheck} label="Módulos" value={data?.compliance.modulos || 0} />
        <Metric icon={GraduationCap} label="Quizzes" value={data?.compliance.quizzes || 0} />
        <Metric icon={ShieldCheck} label="Treinamentos" value={data?.compliance.treinamentos || 0} />
        <Metric icon={AlertTriangle} label="A organizar" value={data?.compliance.pendenciasReorganizacao || 0} />
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Carregando Controle de Qualidade...</CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="trilha" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trilha">Trilha</TabsTrigger>
            <TabsTrigger value="acervo">Acervo</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="conformidade">Conformidade</TabsTrigger>
          </TabsList>

          <TabsContent value="trilha" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {(data?.tracks || []).map((track) => (
                <Card key={track.name}>
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <h2 className="font-semibold">{track.name}</h2>
                      <p className="text-sm text-muted-foreground">{track.audience}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {track.requiredModules.map((code) => <Badge key={code} variant="outline">{code}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {(data?.modules || []).map((module) => {
                    const pop = popByCode.get(module.code);
                    const quiz = quizByPopCode.get(module.code);
                    return (
                      <div key={module.code} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{module.code}</span>
                            <Badge variant={pop ? "default" : "outline"}>{pop ? "POP módulo criado" : "Aguardando POP módulo"}</Badge>
                            <Badge variant={quiz ? "default" : "outline"}>{quiz ? `${quiz._count?.questoes || 0} questões` : "Quiz pendente"}</Badge>
                          </div>
                          <h3 className="mt-1 font-medium">{module.title}</h3>
                          <p className="text-sm text-muted-foreground">{module.workload} - {module.tracks.join(", ")}</p>
                        </div>
                        {pop && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/treinamentos?popId=${pop.id}`}>Treinamentos</Link>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acervo" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar no acervo de Controle de Qualidade..." />
            </div>
            <Card>
              <CardContent className="p-0">
                {filteredLibrary.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Nenhum item de Controle de Qualidade encontrado.</div>
                ) : (
                  <div className="divide-y">
                    {filteredLibrary.map((item) => (
                      <div key={item.id} className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{item.type}</Badge>
                          {item.code && <span className="text-sm font-semibold">{item.code}</span>}
                          <span className="text-xs text-muted-foreground">Atualizado em {formatDate(item.updatedAt)}</span>
                        </div>
                        <h3 className="mt-1 font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.category || "Sem pasta"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {(data?.quizzes || []).length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Nenhum quiz de Controle de Qualidade criado ainda.</div>
                ) : (
                  <div className="divide-y">
                    {(data?.quizzes || []).map((quiz) => (
                      <div key={quiz.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                          <h3 className="font-medium">{quiz.titulo}</h3>
                          <p className="text-sm text-muted-foreground">
                            {quiz.pop?.codigo} - nota mínima {quiz.notaMinima}% - {quiz._count?.questoes || 0} questões - {quiz._count?.tentativas || 0} tentativas
                          </p>
                        </div>
                        <Badge variant={quiz.ativo ? "default" : "outline"}>{quiz.ativo ? "Ativo" : "Inativo"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conformidade" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {(data?.trainings || []).length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Nenhum treinamento CQ concluído/registrado ainda.</div>
                ) : (
                  <div className="divide-y">
                    {(data?.trainings || []).map((training) => (
                      <div key={training.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                          <h3 className="font-medium">{training.colaborador?.nome || "Colaborador"}</h3>
                          <p className="text-sm text-muted-foreground">
                            {training.pop?.codigo || "CQ"} - {training.pop?.titulo || "Treinamento CQ"} - {formatDate(training.dataTreinamento)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {typeof training.notaQuiz === "number" && <Badge variant="outline">{training.notaQuiz}%</Badge>}
                          <Badge variant={training.aprovadoQuiz ? "default" : "outline"}>{training.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {(data?.reorganizar || []).length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2 font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Itens que parecem ser CQ mas ainda estão fora da pasta principal
                  </div>
                  {(data?.reorganizar || []).slice(0, 8).map((item) => (
                    <p key={item.id} className="text-sm text-amber-900">{item.title} - {item.category || "Sem pasta"}</p>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Microscope; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-7 w-7 text-teal-600" />
      </CardContent>
    </Card>
  );
}

