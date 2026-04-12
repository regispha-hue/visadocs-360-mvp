"use client";

import { PageHeader } from "@/components/page-header";
import { Bot, Sparkles, BookOpen, Scale, Lightbulb } from "lucide-react";

export default function AssistentePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="VISA Assistente"
        description="Seu assistente inteligente para legislação farmacêutica, uso do VISADOCS e suporte técnico"
      />

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 flex items-start gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Scale className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-900">Legislação</h4>
            <p className="text-xs text-gray-500 mt-1">
              Tire dúvidas sobre RDCs, ANVISA, Vigilância Sanitária e normas de manipulação
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-900">Uso do VISADOCS</h4>
            <p className="text-xs text-gray-500 mt-1">
              Aprenda a usar cada módulo: POPs, treinamentos, matérias-primas e mais
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-start gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Lightbulb className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-900">Sugestões & Suporte</h4>
            <p className="text-xs text-gray-500 mt-1">
              Envie sugestões de melhoria, reporte problemas ou solicite suporte técnico
            </p>
          </div>
        </div>
      </div>

      {/* Chatbot iframe */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
          <Bot className="h-5 w-5" />
          <span className="font-medium text-sm">Chat com VISA Assistente</span>
          <Sparkles className="h-4 w-4 ml-1 opacity-75" />
        </div>
        <iframe
          src="https://apps.abacus.ai/chatllm/?appId=116c3391f4&hideTopBar=2"
          className="w-full border-0"
          style={{ minHeight: "800px" }}
          title="VISA Assistente - Chat"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}
