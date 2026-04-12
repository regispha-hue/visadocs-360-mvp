"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Treinamento {
  id: string;
  dataTreinamento: Date;
  status: string;
  pop: { codigo: string; titulo: string };
  colaborador: { nome: string };
}

interface RecentActivityProps {
  treinamentos: Treinamento[];
}

export function RecentActivity({ treinamentos }: RecentActivityProps) {
  const safeTreinamentos = treinamentos ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-teal-600" />
          Treinamentos Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(safeTreinamentos?.length ?? 0) === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum treinamento registrado ainda
          </div>
        ) : (
          <div className="space-y-4">
            {safeTreinamentos?.map((t) => (
              <div
                key={t?.id}
                className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0">
                  {t?.status === "CONCLUIDO" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {t?.pop?.codigo ?? "N/A"} - {t?.pop?.titulo ?? "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {t?.colaborador?.nome ?? "N/A"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant={t?.status === "CONCLUIDO" ? "success" : "warning"}>
                    {t?.status === "CONCLUIDO" ? "Concluído" : "Pendente"}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t?.dataTreinamento
                      ? format(new Date(t.dataTreinamento), "dd/MM/yyyy", { locale: ptBR })
                      : "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
