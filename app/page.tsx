import Link from "next/link";
import { FileText, Users, GraduationCap, Shield, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-600">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              VISADOCS
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/cadastro">Cadastrar Farmácia</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Inteligência regulatória para farmácias de manipulação
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            O software que mantém os POPs sempre atualizados com a ANVISA — e a farmácia sempre pronta para a fiscalização.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/cadastro">
                Comece Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* A Solução (estilo dark) */}
      <section className="py-20 px-4 bg-[#0A0F1E]">
        <div className="max-w-6xl mx-auto">
          <span className="inline-block rounded-md border border-blue-500/60 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-300">
            A Solução
          </span>
          <h2 className="mt-5 text-3xl md:text-4xl font-bold text-white max-w-3xl">
            De repositório de documentos a motor de conformidade viva
          </h2>
          <p className="mt-3 text-base md:text-lg text-slate-400 max-w-3xl">
            O VISADOCS conecta POPs, treinamento e regulação num só fluxo — e avisa quando a regra muda.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "1", accent: "bg-teal-400 text-[#0A0F1E]", title: "Radar ANVISA", desc: "Monitora publicações da ANVISA/DOU e alerta quais POPs precisam ser revisados quando a norma muda." },
              { n: "2", accent: "bg-blue-500 text-white", title: "POPs vivos", desc: "Criação, versionamento e aprovação pelo RT. O POP aprovado entra automático na biblioteca oficial." },
              { n: "3", accent: "bg-teal-400 text-[#0A0F1E]", title: "Treino que dispara", desc: "Mudou o POP → a equipe é convocada para re-treinar, com quiz e certificado. Trilha por colaborador." },
              { n: "4", accent: "bg-blue-500 text-white", title: "Pronto p/ fiscalização", desc: "Dashboard de conformidade e dossiê de auditoria gerado em 1 clique. Fim do desespero na visita." },
            ].map((card) => (
              <div
                key={card.n}
                className="rounded-2xl bg-[#11182E] p-6 border border-white/5 transition-shadow hover:shadow-xl hover:shadow-blue-900/30"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${card.accent}`}>
                  {card.n}
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Tudo que você precisa em um só lugar</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-teal-50 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-teal-500 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão de POPs</h3>
              <p className="text-muted-foreground">
                Cadastre, organize e controle todos os Procedimentos Operacionais Padrão da sua farmácia por setor.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-blue-50 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Colaboradores</h3>
              <p className="text-muted-foreground">
                Gerencie sua equipe, controle funções, setores e mantenha o histórico de cada colaborador.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-emerald-50 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Treinamentos</h3>
              <p className="text-muted-foreground">
                Registre treinamentos, acompanhe quem foi treinado em cada POP e gere relatórios completos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Por que escolher o VISADOCS?</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              "Apoio à gestão documental da qualidade",
              "Organização documental com controle de acesso",
              "Relatórios internos para apoio à fiscalização",
              "Busca rápida de POPs",
              "Ferramenta auxiliar do Responsável Técnico",
              "Histórico completo de treinamentos",
              "Suporte especializado",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-white shadow-sm">
                <CheckCircle className="h-6 w-6 text-teal-500 flex-shrink-0" />
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Comece a usar hoje mesmo</h2>
          <p className="text-xl opacity-90 mb-8">
            Cadastre sua farmácia para iniciar a gestão documental.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/cadastro">
              Cadastrar minha farmácia
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            <span className="font-semibold">VISADOCS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 VISADOCS. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
