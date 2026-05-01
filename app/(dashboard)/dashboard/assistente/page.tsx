"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Bot, Sparkles, BookOpen, Scale, Lightbulb, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AssistentePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Erro: ${data.error}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro de conexão. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="VISA Assistente"
        description="Assistente inteligente para legislação farmacêutica e suporte técnico"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 flex items-start gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Scale className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-900">Legislação</h4>
            <p className="text-xs text-gray-500 mt-1">
              RDCs, ANVISA, Vigilância Sanitária e normas
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
              POPs, treinamentos, matérias-primas e mais
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
              Melhorias, problemas ou suporte técnico
            </p>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
          <Bot className="h-5 w-5" />
          <span className="font-medium text-sm">Chat com VISA Assistente</span>
          <Sparkles className="h-4 w-4 ml-1 opacity-75" />
          <span className="ml-auto text-xs opacity-75">Powered by DeepSeek via OpenRouter</span>
        </div>

        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Olá! Sou o VISA Assistente.</p>
              <p className="text-xs mt-1">
                Pergunte sobre legislação ANVISA, POPs, ou como usar o VISADOCS.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                <span className="text-sm text-gray-500">Pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite sua pergunta..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}