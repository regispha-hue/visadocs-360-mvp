"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ChevronDown,
  Scale,
  HelpCircle,
  FileText,
  Search,
  Bell,
  BookOpen,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Skill {
  slug: string;
  title: string;
  description: string;
  status: string;
  category: string;
  icon?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  skillUsed?: string;
  timestamp: Date;
}

const iconMap: Record<string, any> = {
  scale: Scale,
  "help-circle": HelpCircle,
  "file-text": FileText,
  search: Search,
  bell: Bell,
  "book-open": BookOpen,
  droplet: HelpCircle, // Placeholder - usar ícone de gota
  cat: HelpCircle, // Placeholder - usar ícone de animal
  "shield-alert": Search, // Placeholder - usar ícone de alerta
  "heart-pulse": HelpCircle, // Placeholder - usar ícone de saúde
};

export function AIAssistantDialog() {
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carregar skills disponíveis
  useEffect(() => {
    fetchSkills();
  }, []);

  // Scroll para o final quando mensagens mudam
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchSkills = async () => {
    try {
      setLoadingSkills(true);
      const response = await fetch("/api/ai/chat");
      if (!response.ok) throw new Error("Erro ao carregar skills");
      const data = await response.json();
      setSkills(data.skills || []);
      
      // Selecionar skill padrão (guia-visadocs ou primeira)
      const defaultSkill = data.skills?.find((s: Skill) => s.slug === "guia-visadocs") || 
                          data.skills?.[0];
      if (defaultSkill) {
        setSelectedSkill(defaultSkill);
      }
    } catch (error) {
      toast.error("Erro ao carregar especialistas");
    } finally {
      setLoadingSkills(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedSkill || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          useSkill: true,
          skillSlug: selectedSkill.slug,
          history: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro na resposta");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        skillUsed: data.skillUsed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar mensagem");
      
      const errorMessage: Message = {
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente ou escolha outro especialista.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSkillIcon = (iconName?: string) => {
    const Icon = iconMap[iconName || "bot"] || Bot;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Normas: "bg-blue-100 text-blue-800",
      Treinamento: "bg-green-100 text-green-800",
      Documentação: "bg-purple-100 text-purple-800",
      Qualidade: "bg-orange-100 text-orange-800",
      Regulatório: "bg-red-100 text-red-800",
      Suporte: "bg-teal-100 text-teal-800",
      Homeopatia: "bg-amber-100 text-amber-800",
      Veterinária: "bg-pink-100 text-pink-800",
      "Manipulação Especial": "bg-rose-100 text-rose-800",
      Serviços: "bg-cyan-100 text-cyan-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const quickPrompts = [
    { text: "O que há de novo na ANVISA?", skill: "monitor-anvisa" },
    { text: "Como criar um POP?", skill: "guia-visadocs" },
    { text: "Explique BPF", skill: "assistente-rdc67" },
    { text: "Gerar quiz sobre estéreis", skill: "gerador-quiz-pop" },
    { text: "Como manipular homeopatia?", skill: "especialista-homeopatia" },
    { text: "EPIs para citostáticos", skill: "especialista-citostaticos" },
    { text: "Serviços farmacêuticos", skill: "especialista-servicos" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-teal-600 hover:bg-teal-700 text-white border-0"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg h-[600px] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-teal-600" />
              Assistente VISADOCS
            </DialogTitle>
            <Badge variant="outline" className="text-xs">
              Powered by OpenRouter
            </Badge>
          </div>
          
          {/* Seletor de Skill */}
          {!loadingSkills && skills.length > 0 && (
            <div className="mt-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      {selectedSkill && getSkillIcon(selectedSkill.icon)}
                      <span>{selectedSkill?.title || "Escolher especialista"}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                  {skills.map((skill) => (
                    <DropdownMenuItem
                      key={skill.slug}
                      onClick={() => setSelectedSkill(skill)}
                      className="flex items-start gap-2 py-2"
                    >
                      {getSkillIcon(skill.icon)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{skill.title}</span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getCategoryColor(skill.category)}`}
                          >
                            {skill.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {skill.description}
                        </p>
                      </div>
                      {skill.status === "CANON" && (
                        <Badge variant="outline" className="text-xs">
                          CANON
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </DialogHeader>

        {/* Área de Mensagens */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              {/* Boas-vindas */}
              <div className="text-center space-y-2">
                <Bot className="h-12 w-12 mx-auto text-teal-600" />
                <h3 className="font-semibold">Como posso ajudar?</h3>
                <p className="text-sm text-muted-foreground">
                  Escolha um especialista acima e faça sua pergunta
                </p>
              </div>

              {/* Prompts Rápidos */}
              <div className="grid grid-cols-1 gap-2">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Sugestões:
                </p>
                {quickPrompts.map((prompt) => (
                  <Button
                    key={prompt.text}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2"
                    onClick={() => {
                      const skill = skills.find((s) => s.slug === prompt.skill);
                      if (skill) setSelectedSkill(skill);
                      setInput(prompt.text);
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-2 text-teal-600" />
                    {prompt.text}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "user"
                        ? "bg-teal-600 text-white"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      getSkillIcon(
                        skills.find((s) => s.slug === message.skillUsed)?.icon
                      )
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      message.role === "user"
                        ? "bg-teal-600 text-white"
                        : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.skillUsed && message.role === "assistant" && (
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <Badge variant="secondary" className="text-xs">
                          via{" "}
                          {skills.find((s) => s.slug === message.skillUsed)
                            ?.title || message.skillUsed}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    Pensando...
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder={`Pergunte a ${selectedSkill?.title || "Assistente"}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading || !selectedSkill}
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {selectedSkill?.description}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
