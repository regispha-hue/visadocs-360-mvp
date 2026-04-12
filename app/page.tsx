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
            Gestão de POPs e Treinamentos para Farmácias de Manipulação
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Simplifique a gestão de Procedimentos Operacionais Padrão e controle de treinamentos da sua equipe em uma única plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/cadastro">
                Comece Agora - 14 dias grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Já tenho conta</Link>
            </Button>
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
              "Conformidade com RDC ANVISA",
              "Dados seguros e criptografados",
              "Relatórios prontos para fiscalização",
              "Busca rápida de POPs",
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
            14 dias de trial grátis. Sem cartão de crédito.
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
