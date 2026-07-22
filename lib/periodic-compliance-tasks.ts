export type ComplianceTaskFrequency = "DIARIA" | "SEMANAL" | "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

export interface PeriodicComplianceTaskTemplate {
  code: string;
  title: string;
  area: string;
  frequency: ComplianceTaskFrequency;
  evidence: string;
  acceptableRange?: string;
  regulatoryBasis: string[];
  ownerRole: string;
  priority: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
}

export const PERIODIC_COMPLIANCE_TASKS: PeriodicComplianceTaskTemplate[] = [
  {
    code: "BPM-TEMP-001",
    title: "Registrar temperatura e umidade ambiental",
    area: "Monitoramento ambiental",
    frequency: "DIARIA",
    evidence: "Registro diario assinado, com valor medido, horario e responsavel.",
    acceptableRange: "Conforme faixa definida pelo RT para cada ambiente e produto.",
    regulatoryBasis: ["RDC 67/2007", "Manual de Boas Praticas", "POP de monitoramento ambiental"],
    ownerRole: "Operador ou responsavel designado",
    priority: "ALTA",
  },
  {
    code: "BPM-FRIO-001",
    title: "Registrar temperatura de geladeira/refrigerador",
    area: "Armazenamento refrigerado",
    frequency: "DIARIA",
    evidence: "Planilha ou registro eletronico com leitura, desvio e acao tomada.",
    acceptableRange: "Conforme especificacao do produto armazenado.",
    regulatoryBasis: ["RDC 67/2007", "POP de armazenamento", "POP de cadeia fria"],
    ownerRole: "Operador ou responsavel designado",
    priority: "CRITICA",
  },
  {
    code: "BPM-LIMP-001",
    title: "Registrar limpeza de areas e bancadas",
    area: "Limpeza e sanitizacao",
    frequency: "DIARIA",
    evidence: "Checklist de limpeza com area, produto utilizado, responsavel e conferencia.",
    regulatoryBasis: ["RDC 67/2007", "POP de limpeza"],
    ownerRole: "Operador",
    priority: "ALTA",
  },
  {
    code: "CQ-AGUA-001",
    title: "Conferir registros de agua purificada/potavel",
    area: "Controle de qualidade da agua",
    frequency: "SEMANAL",
    evidence: "Registro de verificacao, limpeza e/ou resultado analitico aplicavel.",
    acceptableRange: "Conforme especificacao aprovada pelo RT/CQ.",
    regulatoryBasis: ["RDC 67/2007", "POP de agua potavel e purificada"],
    ownerRole: "CQ ou RT",
    priority: "CRITICA",
  },
  {
    code: "CQ-CAL-001",
    title: "Verificar validade de calibracao de balancas e equipamentos criticos",
    area: "Equipamentos e calibracao",
    frequency: "MENSAL",
    evidence: "Lista de equipamentos com certificado vigente, data de vencimento e acao para pendencias.",
    regulatoryBasis: ["RDC 67/2007", "POP de equipamentos e calibracao"],
    ownerRole: "CQ ou RT",
    priority: "CRITICA",
  },
  {
    code: "BPM-AUTO-001",
    title: "Executar autoinspecao interna",
    area: "Autoinspecao",
    frequency: "TRIMESTRAL",
    evidence: "Roteiro preenchido, nao conformidades abertas e plano CAPA quando aplicavel.",
    regulatoryBasis: ["RDC 67/2007", "POP de autoinspecao"],
    ownerRole: "RT ou qualidade",
    priority: "ALTA",
  },
  {
    code: "BPM-TREIN-001",
    title: "Revisar treinamentos pendentes por POP vigente",
    area: "Treinamentos",
    frequency: "SEMANAL",
    evidence: "Relatorio de pendencias, convocacao e certificado apos aprovacao.",
    regulatoryBasis: ["RDC 67/2007", "Manual de Boas Praticas", "Trilha de treinamento"],
    ownerRole: "RT ou administrador",
    priority: "ALTA",
  },
  {
    code: "REG-RADAR-001",
    title: "Triar alertas do Radar ANVISA/DOU",
    area: "Inteligencia regulatoria",
    frequency: "SEMANAL",
    evidence: "Alertas classificados, POPs impactados e decisao do RT registrada.",
    regulatoryBasis: ["Radar regulatorio VISADOCS", "Responsabilidade tecnica"],
    ownerRole: "RT ou administrador",
    priority: "CRITICA",
  },
];

export function getPeriodicComplianceTasks() {
  return PERIODIC_COMPLIANCE_TASKS;
}
