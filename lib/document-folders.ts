export const DEFAULT_DOCUMENT_FOLDER = "Sem pasta / Revisar";

export const DOCUMENT_FOLDER_OPTIONS = [
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
  "RQ's e MBP/Registros da Qualidade/Formularios",
  "RQ's e MBP/Registros da Qualidade/Checklists",
  "RQ's e MBP/Registros da Qualidade/Planilhas",
  "RQ's e MBP/Registros da Qualidade/Evidencias",
  "RQ's e MBP/Anexos",
  "RQ's e MBP/Listas Mestras",
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
  DEFAULT_DOCUMENT_FOLDER,
] as const;

export function normalizeFolderPath(path?: string | null) {
  const normalized = (path || "").replace(/\\/g, "/").replace(/\/{2,}/g, "/").trim();
  return normalized || DEFAULT_DOCUMENT_FOLDER;
}

export function formatFolderLabel(path?: string | null) {
  return normalizeFolderPath(path).replace(/\//g, " / ");
}
