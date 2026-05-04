"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  Trophy,
  AlertCircle,
  Clock,
  Loader2,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  pergunta: string;
  tipo: "multipla_escolha" | "verdadeiro_falso";
  alternativas: {
    id: string;
    texto: string;
    correta: boolean;
  }[];
  justificativa?: string;
}

interface QuizPlayerProps {
  quizId: string;
  popId: string;
  popTitulo: string;
  questions: QuizQuestion[];
  notaMinima?: number; // default 70%
  tempoLimite?: number; // em minutos, opcional
  onComplete?: (resultado: QuizResult) => void;
  onCancel?: () => void;
}

interface QuizResult {
  quizId: string;
  popId: string;
  totalQuestoes: number;
  acertos: number;
  nota: number;
  aprovado: boolean;
  respostas: Record<string, string>;
  dataConclusao: Date;
  tempoGasto: number; // em segundos
}

export function QuizPlayer({
  quizId,
  popId,
  popTitulo,
  questions,
  notaMinima = 70,
  tempoLimite,
  onComplete,
  onCancel,
}: QuizPlayerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [resultado, setResultado] = useState<QuizResult | null>(null);
  const [tempoInicio] = useState(Date.now());
  const [tempoRestante, setTempoRestante] = useState(tempoLimite ? tempoLimite * 60 : 0);
  const [submitting, setSubmitting] = useState(false);
  const [respostasReveladas, setRespostasReveladas] = useState<Record<string, boolean>>({});
  
  // Refs para evitar memory leaks e stale closures
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tempoRestanteRef = useRef(tempoRestante);
  
  // Sincronizar ref com state
  useEffect(() => {
    tempoRestanteRef.current = tempoRestante;
  }, [tempoRestante]);

  // Timer com cleanup seguro
  useEffect(() => {
    // Sempre limpar timer anterior
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Não iniciar timer se não há limite ou quiz já terminou
    if (!tempoLimite || mostrarResultado) return;
    
    timerRef.current = setInterval(() => {
      const currentTempo = tempoRestanteRef.current;
      
      if (currentTempo <= 1) {
        // Limpar timer antes de submit
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTempoRestante(0);
        handleSubmit();
      } else {
        setTempoRestante(currentTempo - 1);
      }
    }, 1000);

    // Cleanup garantido
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [tempoLimite, mostrarResultado]);

  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const handleResposta = (questaoId: string, alternativaId: string) => {
    setRespostas((prev) => ({
      ...prev,
      [questaoId]: alternativaId,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Verificar se respondeu todas
    const naoRespondidas = questions.filter((q) => !respostas[q.id]).length;
    if (naoRespondidas > 0 && !mostrarResultado) {
      toast.warning(`Você ainda tem ${naoRespondidas} questão(ões) sem resposta`);
      return;
    }

    setSubmitting(true);

    // Calcular resultado
    let acertos = 0;
    questions.forEach((questao) => {
      const respostaId = respostas[questao.id];
      const alternativa = questao.alternativas.find((a) => a.id === respostaId);
      if (alternativa?.correta) {
        acertos++;
      }
    });

    const nota = Math.round((acertos / questions.length) * 100);
    const tempoGasto = Math.floor((Date.now() - tempoInicio) / 1000);

    const quizResult: QuizResult = {
      quizId,
      popId,
      totalQuestoes: questions.length,
      acertos,
      nota,
      aprovado: nota >= notaMinima,
      respostas,
      dataConclusao: new Date(),
      tempoGasto,
    };

    // Simular envio para API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setResultado(quizResult);
    setMostrarResultado(true);
    setSubmitting(false);

    // Revelar respostas corretas
    const reveladas: Record<string, boolean> = {};
    questions.forEach((q) => {
      const respostaId = respostas[q.id];
      const alternativa = q.alternativas.find((a) => a.id === respostaId);
      reveladas[q.id] = alternativa?.correta || false;
    });
    setRespostasReveladas(reveladas);

    if (onComplete) {
      onComplete(quizResult);
    }

    if (quizResult.aprovado) {
      toast.success(`Parabéns! Você foi aprovado com ${nota}%`);
    } else {
      toast.error(`Você não atingiu a nota mínima (${notaMinima}%). Estude mais e tente novamente.`);
    }
  };

  const handleRevelarResposta = (questaoId: string) => {
    setRespostasReveladas((prev) => ({
      ...prev,
      [questaoId]: true,
    }));
  };

  // Tela de resultado
  if (mostrarResultado && resultado) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 mb-4">
            {resultado.aprovado ? (
              <Trophy className="w-16 h-16 text-yellow-500" />
            ) : (
              <AlertCircle className="w-16 h-16 text-orange-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {resultado.aprovado ? "Aprovado!" : "Não Aprovado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score */}
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              <span className={resultado.aprovado ? "text-green-600" : "text-red-600"}>
                {resultado.nota}%
              </span>
            </div>
            <p className="text-muted-foreground">
              Nota mínima para aprovação: {notaMinima}%
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {resultado.acertos}
              </div>
              <div className="text-sm text-muted-foreground">Acertos</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {resultado.totalQuestoes - resultado.acertos}
              </div>
              <div className="text-sm text-muted-foreground">Erros</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {Math.floor(resultado.tempoGasto / 60)}:{(resultado.tempoGasto % 60).toString().padStart(2, "0")}
              </div>
              <div className="text-sm text-muted-foreground">Tempo</div>
            </div>
          </div>

          {/* Feedback */}
          <Alert className={resultado.aprovado ? "bg-green-50" : "bg-orange-50"}>
            <AlertDescription>
              {resultado.aprovado
                ? "Parabéns! Você completou o treinamento com sucesso. Seu certificado está disponível."
                : "Você não atingiu a nota mínima necessária. Recomendamos revisar o conteúdo e refazer o quiz."}
            </AlertDescription>
          </Alert>

          {/* Review Questions */}
          <div className="space-y-4">
            <h3 className="font-semibold">Revisão das Questões:</h3>
            {questions.map((questao, index) => {
              const respostaId = respostas[questao.id];
              const alternativa = questao.alternativas.find((a) => a.id === respostaId);
              const correta = alternativa?.correta || false;

              return (
                <div
                  key={questao.id}
                  className={`p-4 rounded-lg border ${
                    correta ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {correta ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {index + 1}. {questao.pergunta}
                      </p>
                      <p className="text-sm mt-2">
                        <span className="text-muted-foreground">Sua resposta: </span>
                        <span className={correta ? "text-green-600" : "text-red-600"}>
                          {alternativa?.texto}
                        </span>
                      </p>
                      {!correta && (
                        <p className="text-sm mt-1">
                          <span className="text-muted-foreground">Resposta correta: </span>
                          <span className="text-green-600">
                            {questao.alternativas.find((a) => a.correta)?.texto}
                          </span>
                        </p>
                      )}
                      {questao.justificativa && (
                        <p className="text-sm mt-2 text-muted-foreground">
                          <strong>Justificativa:</strong> {questao.justificativa}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Fechar
          </Button>
          <div className="flex gap-2">
            {!resultado.aprovado && (
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarResultado(false);
                  setCurrentQuestion(0);
                  setRespostas({});
                  setRespostasReveladas({});
                }}
              >
                Tentar Novamente
              </Button>
            )}
            {resultado.aprovado && (
              <Button className="bg-teal-600 hover:bg-teal-700">
                <FileText className="w-4 h-4 mr-2" />
                Baixar Certificado
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  }

  const questao = questions[currentQuestion];
  const progresso = ((currentQuestion + 1) / questions.length) * 100;
  const respondeuAtual = !!respostas[questao.id];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="text-xs">
            Quiz do POP
          </Badge>
          {tempoLimite && (
            <div className={`flex items-center gap-1 text-sm ${
              tempoRestante < 60 ? "text-red-600" : "text-muted-foreground"
            }`}>
              <Clock className="w-4 h-4" />
              {formatarTempo(tempoRestante)}
            </div>
          )}
        </div>
        <CardTitle className="text-lg">{popTitulo}</CardTitle>
        <div className="flex items-center gap-4 mt-2">
          <Progress value={progresso} className="flex-1" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {currentQuestion + 1} de {questions.length}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Questão */}
        <div>
          <h3 className="text-lg font-medium mb-4">
            {currentQuestion + 1}. {questao.pergunta}
          </h3>

          <RadioGroup
            value={respostas[questao.id] || ""}
            onValueChange={(value) => handleResposta(questao.id, value)}
          >
            <div className="space-y-3">
              {questao.alternativas.map((alternativa) => (
                <div
                  key={alternativa.id}
                  className={`flex items-center space-x-2 p-4 rounded-lg border transition-colors ${
                    respostas[questao.id] === alternativa.id
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <RadioGroupItem value={alternativa.id} id={alternativa.id} />
                  <Label
                    htmlFor={alternativa.id}
                    className="flex-1 cursor-pointer"
                  >
                    {alternativa.texto}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!respondeuAtual}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Próxima
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!respondeuAtual || submitting}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Finalizar Quiz
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Resumo de respostas */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Respondidas: {Object.keys(respostas).length} de {questions.length}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                  idx === currentQuestion
                    ? "bg-teal-600 text-white"
                    : respostas[q.id]
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type { QuizQuestion, QuizResult, QuizPlayerProps };
