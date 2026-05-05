/**
 * Kit Catalog - Catálogo de 12 Kits de Treinamento
 * Alinhados com RDC 67/2007
 */

export interface Kit {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  setores: string[];
  ordem: number;
  tags: string[];
}

// 12 Kits de Treinamento
export const KIT_CATALOG: Kit[] = [
  {
    id: "kit-qualidade",
    nome: "Gestão da Qualidade",
    descricao: "Procedimentos operacionais para gestão da qualidade e documentação conforme RDC 67/2007",
    icone: "📋",
    cor: "#0d9488",
    setores: ["Gestão da Qualidade e Documentação"],
    ordem: 1,
    tags: ["Obrigatório", "RDC 67"],
  },
  {
    id: "kit-rh",
    nome: "Recursos Humanos",
    descricao: "Treinamento de pessoal, cargos, funções e responsabilidades",
    icone: "👥",
    cor: "#8b5cf6",
    setores: ["Recursos Humanos e Pessoal"],
    ordem: 2,
    tags: ["Obrigatório"],
  },
  {
    id: "kit-fornecedores",
    nome: "Fornecedores e Prestadores",
    descricao: "Qualificação, avaliação e monitoramento de fornecedores e prestadores de serviço",
    icone: "🤝",
    cor: "#f59e0b",
    setores: ["Qualificação de Fornecedores e Prestadores"],
    ordem: 3,
    tags: ["Obrigatório"],
  },
  {
    id: "kit-infraestrutura",
    nome: "Infraestrutura e Segurança",
    descricao: "Instalações físicas, layouts, fluxos e segurança",
    icone: "🏢",
    cor: "#3b82f6",
    setores: ["Infraestrutura e Segurança"],
    ordem: 4,
    tags: ["Obrigatório"],
  },
  {
    id: "kit-equipamentos",
    nome: "Equipamentos e Calibração",
    descricao: "Qualificação, calibração e manutenção de equipamentos conforme RDC 67/2007",
    icone: "⚙️",
    cor: "#64748b",
    setores: ["Equipamentos e Calibração"],
    ordem: 5,
    tags: ["Obrigatório", "RDC 67"],
  },
  {
    id: "kit-limpeza",
    nome: "Limpeza e Higienização",
    descricao: "Procedimentos de limpeza, desinfecção e higienização de ambientes e equipamentos",
    icone: "🧹",
    cor: "#10b981",
    setores: ["Limpeza e Higienização"],
    ordem: 6,
    tags: ["Obrigatório"],
  },
  {
    id: "kit-atendimento",
    nome: "Atendimento e Dispensação",
    descricao: "Procedimentos de atendimento ao cliente e dispensação de medicamentos conforme Portaria 344",
    icone: "💊",
    cor: "#ef4444",
    setores: ["Atendimento e Dispensação"],
    ordem: 7,
    tags: ["Obrigatório", "Portaria 344"],
  },
  {
    id: "kit-escrituracao",
    nome: "Escrituração e Rastreabilidade",
    descricao: "Registros, documentação e rastreabilidade conforme Portaria 344",
    icone: "📝",
    cor: "#6366f1",
    setores: ["Escrituração e Rastreabilidade"],
    ordem: 8,
    tags: ["Obrigatório", "Portaria 344"],
  },
  {
    id: "kit-controle-qualidade",
    nome: "Controle de Qualidade",
    descricao: "Procedimentos de CQ, testes e análises conforme RDC 67/2007",
    icone: "🔬",
    cor: "#06b6d4",
    setores: ["Controle de Qualidade"],
    ordem: 9,
    tags: ["Obrigatório", "RDC 67"],
  },
  {
    id: "kit-almoxarifado",
    nome: "Almoxarifado e Estoque",
    descricao: "Gestão de estoque, armazenamento e controle de matérias-primas",
    icone: "📦",
    cor: "#d97706",
    setores: ["Almoxarifado e Estoque"],
    ordem: 10,
    tags: ["Obrigatório"],
  },
  {
    id: "kit-manipulacao",
    nome: "Área de Manipulação",
    descricao: "Procedimentos de manipulação, preparo e acondicionamento conforme RDC 67/2007",
    icone: "⚗️",
    cor: "#7c3aed",
    setores: ["Área de Manipulação"],
    ordem: 11,
    tags: ["Obrigatório", "RDC 67"],
  },
  {
    id: "kit-agua",
    nome: "Água Purificada",
    descricao: "Geração, armazenamento e controle de água purificada conforme RDC 67/2007",
    icone: "💧",
    cor: "#0ea5e9",
    setores: ["Água Purificada"],
    ordem: 12,
    tags: ["Obrigatório", "RDC 67"],
  },
];

// Get kit by ID
export function getKitById(id: string): Kit | undefined {
  return KIT_CATALOG.find((kit) => kit.id === id);
}

// Get kits by setor
export function getKitsBySetor(setor: string): Kit[] {
  return KIT_CATALOG.filter((kit) => kit.setores.includes(setor));
}

// Get all setores from kits
export function getAllSetores(): string[] {
  const setores = new Set<string>();
  KIT_CATALOG.forEach((kit) => {
    kit.setores.forEach((setor) => setores.add(setor));
  });
  return Array.from(setores).sort();
}

// Get kits ordered
export function getKitsOrdered(): Kit[] {
  return [...KIT_CATALOG].sort((a, b) => a.ordem - b.ordem);
}

// Count POPs per kit (mock function - should query database)
export function getKitPopCounts(tenantId: string): Record<string, number> {
  // This should query the database for actual counts
  // For now, returning mock data
  return KIT_CATALOG.reduce((acc, kit) => {
    acc[kit.id] = 0; // Should be populated from DB
    return acc;
  }, {} as Record<string, number>);
}
