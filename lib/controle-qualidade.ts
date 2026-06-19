export const CONTROLE_QUALIDADE_ROOT = "Controle de Qualidade";

export const CQ_TRAIL_MODULES = [
  {
    code: "CQ-M01",
    title: "Fundamentos das Boas Práticas de Manipulação",
    workload: "1h30min",
    tracks: ["Operacional", "Técnica", "Gestão"],
    category: "Controle de Qualidade/Treinamentos/BPM e Controle de Qualidade/Módulo 1",
  },
  {
    code: "CQ-M02",
    title: "Higiene Pessoal e Ambiental",
    workload: "1h",
    tracks: ["Operacional", "Técnica", "Gestão"],
    category: "Controle de Qualidade/Treinamentos/BPM e Controle de Qualidade/Módulo 2",
  },
  {
    code: "CQ-M03",
    title: "Instalações, Ambientes e Fluxos",
    workload: "1h",
    tracks: ["Operacional", "Técnica", "Gestão"],
    category: "Controle de Qualidade/Treinamentos/BPM e Controle de Qualidade/Módulo 3",
  },
  {
    code: "CQ-M04",
    title: "Documentação, Registros e Rastreabilidade",
    workload: "1h",
    tracks: ["Operacional", "Técnica", "Gestão"],
    category: "Controle de Qualidade/Treinamentos/BPM e Controle de Qualidade/Módulo 4",
  },
  {
    code: "CQ-M05",
    title: "Controle de Qualidade de Insumos e Preparações",
    workload: "1h30min",
    tracks: ["Operacional", "Técnica", "Gestão"],
    category: "Controle de Qualidade/Treinamentos/BPM e Controle de Qualidade/Módulo 5",
  },
  {
    code: "CQ-M06",
    title: "Equipamentos, Calibração e Qualificação",
    workload: "1h",
    tracks: ["Técnica", "Gestão"],
    category: "Controle de Qualidade/Treinamentos/BPM e Controle de Qualidade/Módulo 6",
  },
  {
    code: "CQ-M07",
    title: "Não Conformidades, CAPA (Ação Corretiva e Preventiva) e Desvios",
    workload: "1h",
    tracks: ["Técnica", "Gestão"],
    category: "Controle de Qualidade/Treinamentos/BPM e Controle de Qualidade/Módulo 7",
  },
  {
    code: "CQ-M08",
    title: "Auditoria, Autoinspeção e Fiscalização",
    workload: "1h",
    tracks: ["Técnica", "Gestão"],
    category: "Controle de Qualidade/Treinamentos/BPM e Controle de Qualidade/Módulo 8",
  },
  {
    code: "CQ-M09",
    title: "Gestão da Qualidade e Melhoria Contínua",
    workload: "1h",
    tracks: ["Gestão"],
    category: "Controle de Qualidade/Treinamentos/BPM e Controle de Qualidade/Módulo 9",
  },
];

export const CQ_TRACKS = [
  {
    name: "Operacional",
    audience: "Atendente, Auxiliar de Farmácia",
    requiredModules: ["CQ-M01", "CQ-M02", "CQ-M03", "CQ-M04"],
    optionalModules: ["CQ-M05"],
  },
  {
    name: "Técnica",
    audience: "Técnico em Farmácia, Manipulador",
    requiredModules: ["CQ-M01", "CQ-M02", "CQ-M03", "CQ-M04", "CQ-M05", "CQ-M06", "CQ-M07"],
    optionalModules: ["CQ-M08"],
  },
  {
    name: "Gestão",
    audience: "Farmacêutico RT, Coordenador de Qualidade",
    requiredModules: CQ_TRAIL_MODULES.map((module) => module.code),
    optionalModules: [],
  },
];

export function isControleQualidadeCategory(category?: string | null) {
  return Boolean(category?.trim().startsWith(`${CONTROLE_QUALIDADE_ROOT}/`));
}

export function shouldBelongToControleQualidade(item: { title?: string | null; code?: string | null; category?: string | null; type?: string | null }) {
  const haystack = [item.title, item.code, item.category, item.type].filter(Boolean).join(" ").toLowerCase();
  return (
    haystack.includes("controle de qualidade") ||
    haystack.includes("qualidade") && (haystack.includes("cq") || haystack.includes("laudo") || haystack.includes("calibra"))
  );
}
