"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Tenant {
  id: string;
  nome: string;
  cnpj: string;
  responsavel: string;
  email: string;
  createdAt: Date;
}

interface PendingFarmaciasProps {
  farmacias: Tenant[];
}

export function PendingFarmacias({ farmacias }: PendingFarmaciasProps) {
  const safeFarmacias = farmacias ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Farmácias Pendentes
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/farmacias?status=PENDENTE">
            Ver todas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {(safeFarmacias?.length ?? 0) === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Nenhuma farmácia pendente de aprovação
          </div>
        ) : (
          <div className="space-y-4">
            {safeFarmacias?.map((f) => (
              <div
                key={f?.id}
                className="flex items-start gap-4 p-3 rounded-lg bg-amber-50 hover:bg-amber-100/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{f?.nome ?? "N/A"}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {f?.responsavel ?? "N/A"} • {f?.email ?? "N/A"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {f?.createdAt
                      ? format(new Date(f.createdAt), "dd/MM/yyyy", { locale: ptBR })
                      : "N/A"}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href={`/admin/farmacias/${f?.id}`}>Analisar</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
