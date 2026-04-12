"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import toast from "react-hot-toast";

interface Alternativa {
  id?: string;
  texto: string;
  correta: boolean;
  ordem: number;
}

interface Questao {
  id?: string;
  pergunta: string;
  ordem: number;
  alternativas: Alternativa[];
}

interface Quiz {
  id: string;
  popId: string;
  titulo: string;
  descricao?: string;
  notaMinima: number;
  ativo: boolean;
  questoes: Questao[];
  _count?: { tentativas: number };
  pop?: { codigo: string; titulo: string };
}

export default function QuizManagementPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const popId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pop, setPop] = useState<any>(null);
  const [existingQuiz, setExistingQuiz] = useState<Quiz | null>(null);

  // Form state
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [notaMinima, setNotaMinima] = useState(70);
  const [ativo, setAtivo] = useState(true);
  const [questoes, setQuestoes] = useState<Questao[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [popRes, quizRes] = await Promise.all([
        fetch(`/api/pops/${popId}`),
        fetch(`/api/quizzes/by-pop/${popId}`),
      ]);
      const popData = await popRes.json();
      const quizData = await quizRes.json();

      if (popData?.pop) setPop(popData.pop);

      if (quizData?.quiz) {
        const q = quizData.quiz;
        setExistingQuiz(q);
        setTitulo(q.titulo);
        setDescricao(q.descricao || "");
        setNotaMinima(q.notaMinima);
        setAtivo(q.ativo);
        setQuestoes(
          q.questoes.map((quest: any) => ({
            id: quest.id,
            pergunta: quest.pergunta,
            ordem: quest.ordem,
            alternativas: quest.alternativas.map((alt: any) => ({
              id: alt.id,
              texto: alt.texto,
              correta: alt.correta,
              ordem: alt.ordem,
            })),
          }))
        );
      } else {
        // Initialize with default title
        if (popData?.pop) {
          setTitulo(`Avaliação - ${popData.pop.codigo}`);
        }
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [popId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addQuestao = () => {
    setQuestoes((prev) => [
      ...prev,
      {
        pergunta: "",
        ordem: prev.length + 1,
        alternativas: [
          { texto: "", correta: true, ordem: 1 },
          { texto: "", correta: false, ordem: 2 },
          { texto: "", correta: false, ordem: 3 },
          { texto: "", correta: false, ordem: 4 },
        ],
      },
    ]);
  };

  const removeQuestao = (index: number) => {
    setQuestoes((prev) => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, ordem: i + 1 })));
  };

  const updateQuestao = (index: number, field: string, value: string) => {
    setQuestoes((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const addAlternativa = (questaoIndex: number) => {
    setQuestoes((prev) =>
      prev.map((q, i) =>
        i === questaoIndex
          ? {
              ...q,
              alternativas: [
                ...q.alternativas,
                { texto: "", correta: false, ordem: q.alternativas.length + 1 },
              ],
            }
          : q
      )
    );
  };

  const removeAlternativa = (questaoIndex: number, altIndex: number) => {
    setQuestoes((prev) =>
      prev.map((q, i) =>
        i === questaoIndex
          ? {
              ...q,
              alternativas: q.alternativas
                .filter((_, ai) => ai !== altIndex)
                .map((a, ai) => ({ ...a, ordem: ai + 1 })),
            }
          : q
      )
    );
  };

  const updateAlternativa = (questaoIndex: number, altIndex: number, field: string, value: any) => {
    setQuestoes((prev) =>
      prev.map((q, i) =>
        i === questaoIndex
          ? {
              ...q,
              alternativas: q.alternativas.map((a, ai) => {
                if (ai === altIndex) {
                  return { ...a, [field]: value };
                }
                // If setting correta=true, unmark others
                if (field === "correta" && value === true) {
                  return { ...a, correta: false };
                }
                return a;
              }),
            }
          : q
      )
    );
  };

  const handleSave = async () => {
    // Validate
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (questoes.length === 0) {
      toast.error("Adicione pelo menos uma questão");
      return;
    }
    for (let i = 0; i < questoes.length; i++) {
      const q = questoes[i];
      if (!q.pergunta.trim()) {
        toast.error(`Questão ${i + 1}: preencha a pergunta`);
        return;
      }
      const validAlts = q.alternativas.filter((a) => a.texto.trim());
      if (validAlts.length < 2) {
        toast.error(`Questão ${i + 1}: mínimo 2 alternativas`);
        return;
      }
      if (!q.alternativas.some((a) => a.correta && a.texto.trim())) {
        toast.error(`Questão ${i + 1}: marque uma alternativa como correta`);
        return;
      }
    }

    setSaving(true);
    try {
      // Filter out empty alternatives
      const cleanQuestoes = questoes.map((q) => ({
        pergunta: q.pergunta,
        alternativas: q.alternativas
          .filter((a) => a.texto.trim())
          .map((a) => ({ texto: a.texto, correta: a.correta })),
      }));

      if (existingQuiz) {
        // Update
        const res = await fetch(`/api/quizzes/${existingQuiz.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo, descricao, notaMinima, ativo, questoes: cleanQuestoes }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao atualizar quiz");
        }
        toast.success("Quiz atualizado com sucesso!");
      } else {
        // Create
        const res = await fetch("/api/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ popId, titulo, descricao, notaMinima, questoes: cleanQuestoes }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao criar quiz");
        }
        toast.success("Quiz criado com sucesso!");
      }

      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar quiz");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingQuiz) return;
    if (!confirm("Tem certeza que deseja excluir este quiz? Todas as tentativas serão removidas.")) return;

    try {
      const res = await fetch(`/api/quizzes/${existingQuiz.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Quiz excluído!");
      router.push(`/dashboard/pops/${popId}`);
    } catch {
      toast.error("Erro ao excluir quiz");
    }
  };

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
        title={existingQuiz ? "Editar Quiz" : "Criar Quiz"}
        description={pop ? `${pop.codigo} - ${pop.titulo}` : ""}
      >
        <Button variant="outline" onClick={() => router.push(`/dashboard/pops/${popId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao POP
        </Button>
      </PageHeader>

      {/* Quiz Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-teal-600" />
            Configurações do Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="titulo">Título do Quiz *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Avaliação - POP.001"
              />
            </div>
            <div>
              <Label htmlFor="notaMinima">Nota Mínima (%) *</Label>
              <Input
                id="notaMinima"
                type="number"
                min={0}
                max={100}
                value={notaMinima}
                onChange={(e) => setNotaMinima(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Instruções para o colaborador..."
              rows={2}
            />
          </div>
          {existingQuiz && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={ativo ? "success" : "secondary"}>
                  {ativo ? "Ativo" : "Inativo"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAtivo(!ativo)}
                >
                  {ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {existingQuiz._count?.tentativas ?? 0} tentativa(s) registrada(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-600" />
            Questões ({questoes.length})
          </h3>
          <Button onClick={addQuestao} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Questão
          </Button>
        </div>

        {questoes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma questão adicionada.</p>
              <p className="text-sm mt-1">Clique em "Adicionar Questão" para começar.</p>
            </CardContent>
          </Card>
        )}

        {questoes.map((questao, qIndex) => (
          <Card key={qIndex} className="border-l-4 border-l-teal-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <Label className="text-base font-semibold">
                    Questão {qIndex + 1}
                  </Label>
                  <Textarea
                    value={questao.pergunta}
                    onChange={(e) => updateQuestao(qIndex, "pergunta", e.target.value)}
                    placeholder="Digite a pergunta..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestao(qIndex)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 ml-4">
                <Label className="text-sm text-muted-foreground">Alternativas (marque a correta)</Label>
                {questao.alternativas.map((alt, aIndex) => (
                  <div key={aIndex} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateAlternativa(qIndex, aIndex, "correta", true)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        alt.correta
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-gray-300 hover:border-teal-400"
                      }`}
                    >
                      {alt.correta && <CheckCircle className="h-4 w-4" />}
                    </button>
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {String.fromCharCode(65 + aIndex)})
                    </span>
                    <Input
                      value={alt.texto}
                      onChange={(e) => updateAlternativa(qIndex, aIndex, "texto", e.target.value)}
                      placeholder={`Alternativa ${String.fromCharCode(65 + aIndex)}`}
                      className={`flex-1 ${alt.correta ? "border-emerald-300 bg-emerald-50" : ""}`}
                    />
                    {questao.alternativas.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAlternativa(qIndex, aIndex)}
                        className="text-red-400 hover:text-red-600 h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {questao.alternativas.length < 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addAlternativa(qIndex)}
                    className="text-teal-600 hover:text-teal-800 ml-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Alternativa
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pb-8">
        <div>
          {existingQuiz && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Quiz
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/pops/${popId}`)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {existingQuiz ? "Salvar Alterações" : "Criar Quiz"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
