"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  ClipboardList,
  Trophy,
  RotateCcw,
  Download,
  Loader2,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";

interface Alternativa {
  id: string;
  texto: string;
  correta: boolean;
  ordem: number;
}

interface Questao {
  id: string;
  pergunta: string;
  ordem: number;
  alternativas: Alternativa[];
}

interface Quiz {
  id: string;
  titulo: string;
  descricao?: string;
  notaMinima: number;
  questoes: Questao[];
  pop: { id: string; codigo: string; titulo: string; setor: string };
}

interface Resultado {
  tentativaId: string;
  nota: number;
  aprovado: boolean;
  acertos: number;
  totalQuestoes: number;
  notaMinima: number;
  codigoValidacao?: string;
  respostas: { questaoId: string; alternativaId: string; correta: boolean }[];
}

export default function QuizPage({ params }: { params: { treinamentoId: string } }) {
  const router = useRouter();
  const treinamentoId = params.treinamentoId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [treinamento, setTreinamento] = useState<any>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadingCert, setDownloadingCert] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch treinamento
      const treinRes = await fetch(`/api/treinamentos/${treinamentoId}`);
      const treinData = await treinRes.json();
      if (!treinData?.treinamento) {
        setErrorMsg("Treinamento não encontrado");
        return;
      }
      setTreinamento(treinData.treinamento);

      // Fetch quiz by popId
      const quizRes = await fetch(`/api/quizzes/by-pop/${treinData.treinamento.popId}`);
      const quizData = await quizRes.json();
      if (!quizData?.quiz) {
        setErrorMsg("Este POP não possui um quiz configurado");
        return;
      }
      if (!quizData.quiz.ativo) {
        setErrorMsg("O quiz deste POP está desativado");
        return;
      }
      setQuiz(quizData.quiz);
    } catch (error) {
      setErrorMsg("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [treinamentoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectResposta = (questaoId: string, alternativaId: string) => {
    if (resultado) return; // Don't allow changes after submission
    setRespostas((prev) => ({ ...prev, [questaoId]: alternativaId }));
  };

  const handleSubmit = async () => {
    if (!quiz || !treinamento) return;

    // Check all questions answered
    const unanswered = quiz.questoes.filter((q) => !respostas[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Responda todas as questões (${unanswered.length} sem resposta)`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        treinamentoId,
        colaboradorId: treinamento.colaboradorId,
        respostas: Object.entries(respostas).map(([questaoId, alternativaId]) => ({
          questaoId,
          alternativaId,
        })),
      };

      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar respostas");

      setResultado(data.resultado);

      if (data.resultado.aprovado) {
        toast.success("Parabéns! Você foi aprovado!");
      } else {
        toast.error("Nota insuficiente. Tente novamente.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar prova");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadCertificado = async (tentativaId: string) => {
    setDownloadingCert(true);
    try {
      const res = await fetch(`/api/certificados/${tentativaId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro ao gerar certificado" }));
        throw new Error(err.error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificado_${quiz?.pop?.codigo || "POP"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificado baixado!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao baixar certificado");
    } finally {
      setDownloadingCert(false);
    }
  };

  const handleRetry = () => {
    setResultado(null);
    setRespostas({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <p className="text-lg font-medium">{errorMsg}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/treinamentos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Treinamentos
        </Button>
      </div>
    );
  }

  if (!quiz) return null;

  const answeredCount = Object.keys(respostas).length;
  const totalCount = quiz.questoes.length;
  const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  return (
    <div>
      <PageHeader
        title={quiz.titulo}
        description={`${quiz.pop.codigo} - ${quiz.pop.titulo}`}
      >
        <Button variant="outline" onClick={() => router.push("/dashboard/treinamentos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </PageHeader>

      {/* Result Banner */}
      {resultado && (
        <Card className={`mb-6 border-2 ${resultado.aprovado ? "border-emerald-500 bg-emerald-50" : "border-red-400 bg-red-50"}`}>
          <CardContent className="py-8">
            <div className="text-center">
              {resultado.aprovado ? (
                <Trophy className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
              ) : (
                <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              )}
              <h2 className={`text-3xl font-bold mb-2 ${resultado.aprovado ? "text-emerald-700" : "text-red-700"}`}>
                {resultado.aprovado ? "Aprovado!" : "Reprovado"}
              </h2>
              <div className="flex items-center justify-center gap-6 text-lg">
                <div>
                  <span className="font-semibold">Nota: </span>
                  <span className={`text-2xl font-bold ${resultado.aprovado ? "text-emerald-600" : "text-red-600"}`}>
                    {resultado.nota.toFixed(1)}%
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {resultado.acertos} de {resultado.totalQuestoes} corretas
                </div>
                <div className="text-muted-foreground">
                  Mínimo: {resultado.notaMinima}%
                </div>
              </div>
              {!resultado.aprovado && (
                <Button onClick={handleRetry} className="mt-6" variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}
              {resultado.aprovado && (
                <div className="flex items-center gap-3 mt-6 flex-wrap justify-center">
                  <Button
                    onClick={() => handleDownloadCertificado(resultado.tentativaId)}
                    disabled={downloadingCert}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {downloadingCert ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando Certificado...
                      </>
                    ) : (
                      <>
                        <Award className="h-4 w-4 mr-2" />
                        Baixar Microcertificado
                      </>
                    )}
                  </Button>
                  <Button onClick={() => router.push("/dashboard/treinamentos")} variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Voltar aos Treinamentos
                  </Button>
                </div>
              )}
              {resultado.aprovado && resultado.codigoValidacao && (
                <p className="text-sm text-muted-foreground mt-3">
                  Código de validação: <strong className="font-mono">{resultado.codigoValidacao}</strong>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress & Info */}
      {!resultado && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-teal-600" />
                <span className="font-medium">{answeredCount} de {totalCount} respondidas</span>
              </div>
              <Badge variant="secondary">Nota mínima: {quiz.notaMinima}%</Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {quiz.descricao && (
              <p className="text-sm text-muted-foreground mt-3">{quiz.descricao}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-4 mb-6">
        {quiz.questoes.map((questao, qIndex) => {
          const selectedAlt = respostas[questao.id];
          const resultadoQuestao = resultado?.respostas.find((r) => r.questaoId === questao.id);

          return (
            <Card
              key={questao.id}
              className={`transition-all ${
                resultado
                  ? resultadoQuestao?.correta
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-red-300 bg-red-50/50"
                  : selectedAlt
                  ? "border-teal-300"
                  : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                    {qIndex + 1}
                  </span>
                  <p className="font-medium text-base leading-relaxed pt-1">{questao.pergunta}</p>
                  {resultado && (
                    resultadoQuestao?.correta ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                    )
                  )}
                </div>

                <div className="space-y-2 ml-11">
                  {questao.alternativas.map((alt, aIndex) => {
                    const isSelected = selectedAlt === alt.id;
                    const showCorrect = resultado && alt.correta;
                    const showWrong = resultado && isSelected && !alt.correta;

                    return (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => selectResposta(questao.id, alt.id)}
                        disabled={!!resultado}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          showCorrect
                            ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                            : showWrong
                            ? "border-red-500 bg-red-100 text-red-800"
                            : isSelected
                            ? "border-teal-500 bg-teal-50 text-teal-800"
                            : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/50"
                        } ${resultado ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                          showCorrect
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : showWrong
                            ? "bg-red-500 border-red-500 text-white"
                            : isSelected
                            ? "bg-teal-500 border-teal-500 text-white"
                            : "border-gray-300"
                        }`}>
                          {showCorrect ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : showWrong ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            String.fromCharCode(65 + aIndex)
                          )}
                        </span>
                        <span className="flex-1">{alt.texto}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit */}
      {!resultado && (
        <div className="flex justify-end pb-8">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || answeredCount < totalCount}
          >
            {submitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Enviar Respostas ({answeredCount}/{totalCount})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
