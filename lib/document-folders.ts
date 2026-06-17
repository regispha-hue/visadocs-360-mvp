export const DEFAULT_DOCUMENT_FOLDER = "Sem pasta / Revisar";

export const POP_LIBRARY_FOLDER_OPTIONS = [
  "Biblioteca de POPs/Acervo Drogarias/POPs",
  "Biblioteca de POPs/Acervo Drogarias/Atendimento e Dispensacao",
  "Biblioteca de POPs/Acervo Drogarias/Medicamentos Controlados",
  "Biblioteca de POPs/Acervo Drogarias/Recebimento e Armazenamento",
  "Biblioteca de POPs/Acervo Drogarias/Servicos Farmaceuticos",
  "Biblioteca de POPs/Acervo Drogarias/Higiene e Limpeza",
  "Biblioteca de POPs/Acervo LGPD/Farmacias de Manipulacao",
  "Biblioteca de POPs/Acervo Geral/Conteudo Modular",
  "Biblioteca de POPs/Gerados sob demanda/Rascunhos",
  "Biblioteca de POPs/Gerados sob demanda/Em revisao",
  "Biblioteca de POPs/Gerados sob demanda/Vigentes",
] as const;

export const RQ_MBP_FOLDER_OPTIONS = [
  "RQ's e MBP/Acervo Drogarias/MBP",
  "RQ's e MBP/Acervo Drogarias/RQs",
  "RQ's e MBP/Acervo Drogarias/Anexos",
  "RQ's e MBP/Acervo Manipulacao/MBP",
  "RQ's e MBP/Acervo Manipulacao/RQs",
  "RQ's e MBP/Acervo Manipulacao/Anexos",
  "RQ's e MBP/Acervo Geral/Indice",
  "RQ's e MBP/Acervo Geral/Conteudo Modular",
  "RQ's e MBP/Registros da Qualidade/Formularios",
  "RQ's e MBP/Registros da Qualidade/Checklists",
  "RQ's e MBP/Registros da Qualidade/Planilhas",
  "RQ's e MBP/Registros da Qualidade/Evidencias",
  "RQ's e MBP/Listas Mestras",
] as const;

export const LEGACY_DOCUMENT_FOLDER_OPTIONS = [
  "Farmacia de Manipulacao/00. Acervo Matriz Atualizado",
  "Farmacia de Manipulacao/01. Gestao da Qualidade",
  "Farmacia de Manipulacao/02. Boas Praticas de Manipulacao",
  "Farmacia de Manipulacao/03. Higiene, Limpeza e Sanitizacao",
  "Farmacia de Manipulacao/04. Recebimento e Armazenamento",
  "Farmacia de Manipulacao/05. Materias-primas e Fornecedores",
  "Farmacia de Manipulacao/06. Manipulacao",
  "Farmacia de Manipulacao/07. Controle de Qualidade",
  "Farmacia de Manipulacao/08. Equipamentos, Calibracao e Manutencao",
  "Farmacia de Manipulacao/09. Rotulagem, Conferencia e Dispensacao",
  "Farmacia de Manipulacao/10. Nao Conformidades, Reclamacoes e Recolhimento",
  "Farmacia de Manipulacao/11. Residuos e Seguranca",
  "Farmacia de Manipulacao/12. Treinamentos Operacionais",
  "RQ's e MBP/Manual de Boas Praticas",
  "RQ's e MBP/Anexos",
  "Drogarias/00. Acervo Matriz Drogarias 2022",
  "Drogarias/01. Dispensacao",
  "Drogarias/02. Medicamentos Controlados",
  "Drogarias/03. SNGPC e Controle Especial",
  "Drogarias/04. Recebimento e Armazenamento",
  "Drogarias/05. Termolabeis",
  "Drogarias/06. Servicos Farmaceuticos",
  "Drogarias/07. Higiene e Limpeza",
  "Drogarias/08. Farmacovigilancia",
  "Drogarias/09. Residuos",
  "Drogarias/10. LGPD aplicada a Drogarias",
  "Drogarias/11. Treinamentos Drogaria",
  "Treinamentos/Boas Praticas e Controle de Qualidade",
  "Treinamentos/Trilhas por funcao",
  "Treinamentos/Quizzes",
  "Treinamentos/Certificados internos",
  "Treinamentos/Reciclagens",
  "LGPD/Farmacias de Manipulacao",
] as const;

export const DOCUMENT_FOLDER_OPTIONS = [
  ...POP_LIBRARY_FOLDER_OPTIONS,
  ...RQ_MBP_FOLDER_OPTIONS,
  ...LEGACY_DOCUMENT_FOLDER_OPTIONS,
  DEFAULT_DOCUMENT_FOLDER,
] as const;

export const DEFAULT_POP_LIBRARY_FOLDER = POP_LIBRARY_FOLDER_OPTIONS[0];
export const DEFAULT_RQ_MBP_FOLDER = RQ_MBP_FOLDER_OPTIONS[0];

export function normalizeFolderPath(path?: string | null) {
  const normalized = (path || "").replace(/\\/g, "/").replace(/\/{2,}/g, "/").trim();
  return normalized || DEFAULT_DOCUMENT_FOLDER;
}

export function formatFolderLabel(path?: string | null) {
  return normalizeFolderPath(path).replace(/\//g, " / ");
}

export function isPopLibraryFolder(path?: string | null) {
  const normalized = normalizeFolderPath(path);
  return (
    normalized.startsWith("Biblioteca de POPs/") ||
    normalized.startsWith("Drogarias/") ||
    normalized.startsWith("LGPD/")
  );
}

export function isRqMbpFolder(path?: string | null) {
  const normalized = normalizeFolderPath(path);
  return (
    normalized.startsWith("RQ's e MBP/") ||
    normalized.startsWith("Farmacia de Manipulacao/")
  );
}
