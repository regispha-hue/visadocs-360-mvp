import { PageHeader } from "@/components/page-header";
import { Bot, Sparkles, BookOpen, Scale, Lightbulb } from "lucide-react";

export default function AssistentePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistente documental"
        description="Módulo interno em revisão para apoio à consulta documental, uso da plataforma e suporte operacional."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 flex items-start gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Scale className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-900">Consulta documental</h4>
            <p className="text-xs text-gray-500 mt-1">
              Apoio à consulta de materiais internos, POPs, registros e evidências documentais.
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
              Orientação sobre módulos, fluxos de POPs, treinamentos, registros e organização documental.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 flex items-start gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Lightbulb className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-900">Apoio operacional</h4>
            <p className="text-xs text-gray-500 mt-1">
              Estrutura futura para perguntas guiadas com fontes rastreáveis e revisão do Responsável Técnico.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
          <Bot className="h-5 w-5" />
          <span className="font-medium text-sm">Assistente em revisão</span>
          <Sparkles className="h-4 w-4 ml-1 opacity-75" />
        </div>

        <div className="p-8">
          <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-teal-200 bg-teal-50/50 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <Bot className="h-6 w-6 text-teal-700" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900">
              Chat externo temporariamente desativado
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              O módulo de assistente está sendo reestruturado para operar sem dependência externa,
              com base em fontes controladas, rastreabilidade e governança documental do VISADOCS.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 text-left md:grid-cols-3">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-900">Sem iframe externo</p>
                <p className="mt-1 text-xs text-gray-500">
                  O carregamento de chat externo foi removido da interface.
                </p>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-900">Sem script global</p>
                <p className="mt-1 text-xs text-gray-500">
                  O script global externo foi removido do layout da aplicação.
                </p>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-900">Próxima etapa</p>
                <p className="mt-1 text-xs text-gray-500">
                  Implementar assistente interno com fontes aprovadas e revisão técnica.
                </p>
              </div>
            </div>

            <p className="mt-6 text-xs leading-5 text-gray-500">
              Este módulo é ferramenta auxiliar. Não substitui avaliação, adaptação ou aprovação do Responsável Técnico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}