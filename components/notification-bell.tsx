"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, AlertTriangle, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Link from "next/link";

interface Lembrete {
  id: string;
  tipo: string;
  prioridade: string;
  titulo: string;
  mensagem: string;
  dataLimite: string;
  acao: string;
  popId?: string;
}

export function NotificationBell() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchLembretes();
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchLembretes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLembretes = async () => {
    try {
      const response = await fetch("/api/microlearning/lembretes");
      if (response.ok) {
        const data = await response.json();
        setLembretes(data.lembretes || []);
      }
    } catch (error) {
      console.error("Erro ao buscar lembretes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "TREINAMENTO_PENDENTE":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "CERTIFICADO_EXPIRANDO":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "CONQUISTA":
        return <Award className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "ALTA":
        return "bg-red-100 text-red-800";
      case "MEDIA":
        return "bg-amber-100 text-amber-800";
      case "BAIXA":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const naoLidos = lembretes.filter((l) => l.prioridade === "ALTA").length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidos > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {naoLidos}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            <Badge variant="secondary">{lembretes.length}</Badge>
          </div>
        </div>
        <ScrollArea className="h-64">
          {lembretes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {lembretes.map((lembrete) => (
                <Link
                  key={lembrete.id}
                  href={lembrete.acao}
                  onClick={() => setOpen(false)}
                  className="block p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getIcon(lembrete.tipo)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {lembrete.titulo}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getPrioridadeColor(
                            lembrete.prioridade
                          )}`}
                        >
                          {lembrete.prioridade}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lembrete.mensagem}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Limite: {new Date(lembrete.dataLimite).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t bg-muted">
          <Link
            href="/dashboard/notifications"
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Ver todas
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
