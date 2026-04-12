import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const POPS_LISTA_MESTRA: { codigo: string; titulo: string; setor: string }[] = [
  // === Gestão da Qualidade e Documentação ===
  { codigo: "POP.001", titulo: "Documentação Normativa", setor: "Gestão da Qualidade e Documentação" },
  { codigo: "POP.002", titulo: "Elaboração e Implantação de POPs", setor: "Gestão da Qualidade e Documentação" },
  { codigo: "POP.012", titulo: "Sistema da Qualidade", setor: "Gestão da Qualidade e Documentação" },
  { codigo: "POP.014", titulo: "Autoinspeções", setor: "Gestão da Qualidade e Documentação" },
  { codigo: "POP.015", titulo: "Inspeções pela Vigilância Sanitária", setor: "Gestão da Qualidade e Documentação" },
  { codigo: "POP.162", titulo: "Não Conformidades e Ações Preventivas", setor: "Gestão da Qualidade e Documentação" },

  // === Recursos Humanos e Pessoal ===
  { codigo: "POP.003", titulo: "Organograma", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.004", titulo: "Organização e Pessoal", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.005", titulo: "Recrutamento e Admissão", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.006", titulo: "PCMSO, Relatório Analítico e Exames Médicos", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.007", titulo: "LTCAT, PGR e EPIs", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.008", titulo: "Atribuições do Farmacêutico", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.009", titulo: "Atribuições da Gerência", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.010", titulo: "Atribuições do Representante da Gerência", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.011", titulo: "Atribuições dos Balconistas", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.013", titulo: "Treinamento dos Colaboradores", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.016", titulo: "Uso e Conservação de Uniformes", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.017", titulo: "Uso e Conservação de EPIs", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.018", titulo: "Higiene Pessoal", setor: "Recursos Humanos e Pessoal" },
  { codigo: "POP.019", titulo: "Higienização das Mãos", setor: "Recursos Humanos e Pessoal" },

  // === Qualificação de Fornecedores e Prestadores ===
  { codigo: "POP.020", titulo: "Qualificação de Prestadores de Serviço", setor: "Qualificação de Fornecedores e Prestadores" },
  { codigo: "POP.021", titulo: "Qualificação de Fornecedores", setor: "Qualificação de Fornecedores e Prestadores" },
  { codigo: "POP.022", titulo: "Qualificação de Transportadoras", setor: "Qualificação de Fornecedores e Prestadores" },
  { codigo: "POP.023", titulo: "Aquisição de Produtos Industrializados", setor: "Qualificação de Fornecedores e Prestadores" },

  // === Infraestrutura e Segurança ===
  { codigo: "POP.024", titulo: "Programa de Gerenciamento de Resíduos", setor: "Infraestrutura e Segurança" },
  { codigo: "POP.025", titulo: "Programa de Controle de Pragas", setor: "Infraestrutura e Segurança" },
  { codigo: "POP.026", titulo: "Manutenção Extintores de Incêndio", setor: "Infraestrutura e Segurança" },
  { codigo: "POP.027", titulo: "Limpeza das Caixas d\u2019água", setor: "Infraestrutura e Segurança" },
  { codigo: "POP.028", titulo: "Abastecimento de Água Potável", setor: "Infraestrutura e Segurança" },
  { codigo: "POP.029", titulo: "Instalações Físicas e Equipamentos", setor: "Infraestrutura e Segurança" },
  { codigo: "POP.077", titulo: "LGPD", setor: "Infraestrutura e Segurança" },

  // === Equipamentos e Calibração ===
  { codigo: "POP.030", titulo: "Manutenção e Calibração dos Equipamentos", setor: "Equipamentos e Calibração" },
  { codigo: "POP.031", titulo: "Manutenção Preventiva, Calibração e Aferição das Balanças", setor: "Equipamentos e Calibração" },
  { codigo: "POP.032", titulo: "Calibração Diária das Balanças", setor: "Equipamentos e Calibração" },
  { codigo: "POP.033", titulo: "Calibração de Vidrarias", setor: "Equipamentos e Calibração" },
  { codigo: "POP.034", titulo: "Calibração e Uso do Condutivímetro", setor: "Equipamentos e Calibração" },
  { codigo: "POP.035", titulo: "Calibração e Uso do pHmetro", setor: "Equipamentos e Calibração" },
  { codigo: "POP.036", titulo: "Calibração e Uso do Termo-higrômetro", setor: "Equipamentos e Calibração" },
  { codigo: "POP.037", titulo: "Manutenção e Uso da Estufa", setor: "Equipamentos e Calibração" },
  { codigo: "POP.038", titulo: "Manutenção e Uso da Geladeira", setor: "Equipamentos e Calibração" },
  { codigo: "POP.039", titulo: "Manutenção e Uso do Ar Condicionado", setor: "Equipamentos e Calibração" },
  { codigo: "POP.040", titulo: "Monitoramento da Qualidade do Ar", setor: "Equipamentos e Calibração" },
  { codigo: "POP.041", titulo: "Monitoramento da Temperatura e Umidade", setor: "Equipamentos e Calibração" },

  // === Limpeza e Higienização ===
  { codigo: "POP.042", titulo: "Limpeza das Instalações Gerais", setor: "Limpeza e Higienização" },
  { codigo: "POP.043", titulo: "Limpeza das Instalações dos Laboratórios", setor: "Limpeza e Higienização" },
  { codigo: "POP.044", titulo: "Limpeza dos Equipamentos", setor: "Limpeza e Higienização" },
  { codigo: "POP.045", titulo: "Retirada do Lixo \u2013 Geral e Laboratórios", setor: "Limpeza e Higienização" },
  { codigo: "POP.075", titulo: "Limpeza Diária da Recepção", setor: "Limpeza e Higienização" },
  { codigo: "POP.121", titulo: "Limpeza dos Utensílios", setor: "Limpeza e Higienização" },
  { codigo: "POP.122", titulo: "Classificação dos Utensílios", setor: "Limpeza e Higienização" },
  { codigo: "POP.123", titulo: "Limpeza das Embalagens", setor: "Limpeza e Higienização" },

  // === Atendimento e Dispensação ===
  { codigo: "POP.046", titulo: "Atendimento ao Cliente", setor: "Atendimento e Dispensação" },
  { codigo: "POP.047", titulo: "Atendimento por Telefone e WhatsApp", setor: "Atendimento e Dispensação" },
  { codigo: "POP.048", titulo: "Pedidos de Fórmulas Sem Receita", setor: "Atendimento e Dispensação" },
  { codigo: "POP.049", titulo: "Orçamento e Preço da Fórmula", setor: "Atendimento e Dispensação" },
  { codigo: "POP.050", titulo: "Recebimento e Avaliação da Receita", setor: "Atendimento e Dispensação" },
  { codigo: "POP.051", titulo: "Recebimento e Avaliação da Receita Digital", setor: "Atendimento e Dispensação" },
  { codigo: "POP.052", titulo: "Avaliação de Receita Portaria 344", setor: "Atendimento e Dispensação" },
  { codigo: "POP.053", titulo: "Avaliação de Receita Antimicrobianos", setor: "Atendimento e Dispensação" },
  { codigo: "POP.054", titulo: "Avaliação da Receita \u2013 Prevenção de Erros", setor: "Atendimento e Dispensação" },
  { codigo: "POP.055", titulo: "Avaliação da Prescrição \u2013 Repetições", setor: "Atendimento e Dispensação" },
  { codigo: "POP.056", titulo: "Farmacovigĭlância", setor: "Atendimento e Dispensação" },
  { codigo: "POP.057", titulo: "Prescrição Farmacêutica", setor: "Atendimento e Dispensação" },
  { codigo: "POP.058", titulo: "Conferência de Entrada", setor: "Atendimento e Dispensação" },
  { codigo: "POP.059", titulo: "Envio de Requisições aos Laboratórios", setor: "Atendimento e Dispensação" },
  { codigo: "POP.060", titulo: "Dispensação de Fórmulas ao Cliente", setor: "Atendimento e Dispensação" },
  { codigo: "POP.061", titulo: "SBIT \u2013 Bula Simplificada para Pacientes", setor: "Atendimento e Dispensação" },
  { codigo: "POP.062", titulo: "Delivery das Fórmulas Manipuladas", setor: "Atendimento e Dispensação" },
  { codigo: "POP.063", titulo: "Delivery de Fórmulas \u2013 Transporte", setor: "Atendimento e Dispensação" },
  { codigo: "POP.064", titulo: "E-Commerce e Entrega Via Correios", setor: "Atendimento e Dispensação" },
  { codigo: "POP.065", titulo: "Prevenção de Entregas Equívocadas", setor: "Atendimento e Dispensação" },
  { codigo: "POP.066", titulo: "Pesquisa de Satisfação \u2013 Pós-Venda", setor: "Atendimento e Dispensação" },
  { codigo: "POP.070", titulo: "Fórmulas Não Retiradas pelos Clientes", setor: "Atendimento e Dispensação" },
  { codigo: "POP.072", titulo: "Exposição de Produtos Manipulados", setor: "Atendimento e Dispensação" },
  { codigo: "POP.073", titulo: "Comercialização de Suplementos e Alimentos", setor: "Atendimento e Dispensação" },
  { codigo: "POP.074", titulo: "Comercialização de Correlatos", setor: "Atendimento e Dispensação" },
  { codigo: "POP.076", titulo: "Visitação aos Prescritores", setor: "Atendimento e Dispensação" },

  // === Escrituração e Rastreabilidade ===
  { codigo: "POP.067", titulo: "Escrituração de Receitas em Geral", setor: "Escrituração e Rastreabilidade" },
  { codigo: "POP.068", titulo: "Escrituração de Port.344 e Antibióticos", setor: "Escrituração e Rastreabilidade" },
  { codigo: "POP.069", titulo: "Devolução ou Troca de Port.344 e Antibióticos", setor: "Escrituração e Rastreabilidade" },
  { codigo: "POP.071", titulo: "Rastreabilidade do Processo Magistral", setor: "Escrituração e Rastreabilidade" },
  { codigo: "POP.115", titulo: "Guarda da Documentação da Manipulação", setor: "Escrituração e Rastreabilidade" },

  // === Controle de Qualidade ===
  { codigo: "POP.078", titulo: "Controle de Qualidade", setor: "Controle de Qualidade" },
  { codigo: "POP.079", titulo: "Nomenclatura de Substâncias e Denominações", setor: "Controle de Qualidade" },
  { codigo: "POP.080", titulo: "Laudos Técnicos do Fornecedor", setor: "Controle de Qualidade" },
  { codigo: "POP.081", titulo: "Avaliação e Interpretação do Laudo Técnico", setor: "Controle de Qualidade" },
  { codigo: "POP.082", titulo: "Critérios para Elaboração do Certificado de Análise", setor: "Controle de Qualidade" },
  { codigo: "POP.083", titulo: "Amostragem de Água e Matéria-Prima", setor: "Controle de Qualidade" },
  { codigo: "POP.084", titulo: "Amostragem e Inspeção de Embalagem", setor: "Controle de Qualidade" },
  { codigo: "POP.085", titulo: "Fracionamento de Matéria-Prima", setor: "Controle de Qualidade" },
  { codigo: "POP.086", titulo: "Determinação das Características Organolépticas", setor: "Controle de Qualidade" },
  { codigo: "POP.087", titulo: "Determinação da Solubilidade", setor: "Controle de Qualidade" },
  { codigo: "POP.088", titulo: "Determinação do pH", setor: "Controle de Qualidade" },
  { codigo: "POP.089", titulo: "Determinação do Peso ou Volume de MP", setor: "Controle de Qualidade" },
  { codigo: "POP.090", titulo: "Determinação do Peso Médio de Cápsulas Prontas", setor: "Controle de Qualidade" },
  { codigo: "POP.091", titulo: "Determinação do Ponto de Fusão", setor: "Controle de Qualidade" },
  { codigo: "POP.092", titulo: "Determinação da Densidade Aparente e Compactada", setor: "Controle de Qualidade" },
  { codigo: "POP.093", titulo: "Determinação da Densidade Relativa", setor: "Controle de Qualidade" },
  { codigo: "POP.094", titulo: "Determinação Dissolução e Desintegração de Cápsulas", setor: "Controle de Qualidade" },
  { codigo: "POP.095", titulo: "Determinação da Viscosidade", setor: "Controle de Qualidade" },
  { codigo: "POP.096", titulo: "Padronização n° Gotas com Cânulas", setor: "Controle de Qualidade" },
  { codigo: "POP.097", titulo: "CQ da Água \u2013 Micro e FQ", setor: "Controle de Qualidade" },
  { codigo: "POP.098", titulo: "CQ de Fórmulas Manipuladas", setor: "Controle de Qualidade" },
  { codigo: "POP.099", titulo: "CQ de Matéria-Prima e Embalagem", setor: "Controle de Qualidade" },
  { codigo: "POP.100", titulo: "CQ de Matéria-Prima Vegetal", setor: "Controle de Qualidade" },
  { codigo: "POP.101", titulo: "CQ do Estoque Mínimo", setor: "Controle de Qualidade" },
  { codigo: "POP.102", titulo: "CQ Terceirizado", setor: "Controle de Qualidade" },
  { codigo: "POP.103", titulo: "CQ de SBIT", setor: "Controle de Qualidade" },
  { codigo: "POP.104", titulo: "CQ de Antibióticos, Hormônios, Citostáticos e Controlados", setor: "Controle de Qualidade" },

  // === Almoxarifado e Estoque ===
  { codigo: "POP.105", titulo: "Aquisição de Matérias-Primas e Outros Produtos", setor: "Almoxarifado e Estoque" },
  { codigo: "POP.106", titulo: "Recebimento de Matérias-Primas e Outros Produtos", setor: "Almoxarifado e Estoque" },
  { codigo: "POP.107", titulo: "Aquisição e Recebimento de SBIT", setor: "Almoxarifado e Estoque" },
  { codigo: "POP.108", titulo: "Aquisição e Recebimento de Antibióticos, Hormônios, Citostáticos e Controlados", setor: "Almoxarifado e Estoque" },
  { codigo: "POP.109", titulo: "Armazenamento e Estocagem", setor: "Almoxarifado e Estoque" },
  { codigo: "POP.110", titulo: "Controle de Estoque", setor: "Almoxarifado e Estoque" },
  { codigo: "POP.111", titulo: "Segregação de Produtos Avariados", setor: "Almoxarifado e Estoque" },
  { codigo: "POP.112", titulo: "Segregação de Produtos Vencidos", setor: "Almoxarifado e Estoque" },
  { codigo: "POP.113", titulo: "Segregação de Produtos Reprovados", setor: "Almoxarifado e Estoque" },
  { codigo: "POP.114", titulo: "MP Port. 344 \u2013 Vencidos, Reprovados ou Avariados", setor: "Almoxarifado e Estoque" },

  // === Área de Manipulação ===
  { codigo: "POP.116", titulo: "Conduta na Área de Manipulação", setor: "Área de Manipulação" },
  { codigo: "POP.117", titulo: "Recebimento de Visitantes na Área Restrita", setor: "Área de Manipulação" },
  { codigo: "POP.118", titulo: "Rotulagem Básica das Fórmulas", setor: "Área de Manipulação" },
  { codigo: "POP.119", titulo: "Rotulagem Auxiliar das Fórmulas", setor: "Área de Manipulação" },
  { codigo: "POP.120", titulo: "Conferência da Ordem de Manipulação", setor: "Área de Manipulação" },
  { codigo: "POP.124", titulo: "Prevenção da Contaminação Cruzada", setor: "Área de Manipulação" },
  { codigo: "POP.133", titulo: "Expressões de Quantidade", setor: "Área de Manipulação" },
  { codigo: "POP.134", titulo: "Expressões de Concentrações", setor: "Área de Manipulação" },
  { codigo: "POP.135", titulo: "Fatores de Correções", setor: "Área de Manipulação" },
  { codigo: "POP.136", titulo: "Determinação do Grau AA em Mistura HA", setor: "Área de Manipulação" },
  { codigo: "POP.137", titulo: "Diluição de Matéria-Prima", setor: "Área de Manipulação" },
  { codigo: "POP.138", titulo: "Diluição de Matéria-Prima SBIT", setor: "Área de Manipulação" },
  { codigo: "POP.139", titulo: "Enfrascamento de Cápsulas Manipuladas", setor: "Área de Manipulação" },
  { codigo: "POP.140", titulo: "Manipulação do Estoque Mínimo", setor: "Área de Manipulação" },
  { codigo: "POP.141", titulo: "Transformação de Especialidade Farmacêutica", setor: "Área de Manipulação" },
  { codigo: "POP.142", titulo: "Pesagem de Matéria-Prima", setor: "Área de Manipulação" },
  { codigo: "POP.143", titulo: "Homogeneização e Tamização", setor: "Área de Manipulação" },
  { codigo: "POP.144", titulo: "Escolha da Cápsula \u2013 Tamanho e Cor", setor: "Área de Manipulação" },
  { codigo: "POP.145", titulo: "Padronização de Excipiente", setor: "Área de Manipulação" },
  { codigo: "POP.146", titulo: "Encapsulação", setor: "Área de Manipulação" },
  { codigo: "POP.147", titulo: "Manipulação de Semissólidos e Líquidos", setor: "Área de Manipulação" },
  { codigo: "POP.148", titulo: "Manipulação de Pastas", setor: "Área de Manipulação" },
  { codigo: "POP.149", titulo: "Manipulação de Pomadas", setor: "Área de Manipulação" },
  { codigo: "POP.150", titulo: "Manipulação de Géis", setor: "Área de Manipulação" },
  { codigo: "POP.151", titulo: "Manipulação de Xaropes", setor: "Área de Manipulação" },
  { codigo: "POP.152", titulo: "Manipulação de Probióticos", setor: "Área de Manipulação" },
  { codigo: "POP.153", titulo: "Manipulação de Orodispersíveis", setor: "Área de Manipulação" },
  { codigo: "POP.154", titulo: "Manipulação de SBIT", setor: "Área de Manipulação" },
  { codigo: "POP.155", titulo: "Manipulação de Antibióticos, Hormônios e Citostáticos", setor: "Área de Manipulação" },
  { codigo: "POP.156", titulo: "Manipulação de Subst. Portaria 344", setor: "Área de Manipulação" },
  { codigo: "POP.157", titulo: "Manipulação de Homeopatias", setor: "Área de Manipulação" },
  { codigo: "POP.158", titulo: "Manipulação e Uso de Domissanitários", setor: "Área de Manipulação" },
  { codigo: "POP.159", titulo: "Acondicionamento e Embalagem", setor: "Área de Manipulação" },
  { codigo: "POP.160", titulo: "Conferência Final", setor: "Área de Manipulação" },
  { codigo: "POP.161", titulo: "Estabelecimento do Prazo de Validade", setor: "Área de Manipulação" },

  // === Água Purificada ===
  { codigo: "POP.125", titulo: "Parâmetros para Água Potável e Purificada", setor: "Água Purificada" },
  { codigo: "POP.126", titulo: "Processos de Purificação da Água", setor: "Água Purificada" },
  { codigo: "POP.127", titulo: "Identificação das Tubulações de Água", setor: "Água Purificada" },
  { codigo: "POP.128", titulo: "Limpeza do Tanque de Armazenamento", setor: "Água Purificada" },
  { codigo: "POP.129", titulo: "Limpeza do Destilador", setor: "Água Purificada" },
  { codigo: "POP.130", titulo: "Limpeza do Filtro Purificador de Água", setor: "Água Purificada" },
  { codigo: "POP.131", titulo: "Manutenção da Coluna Deionizadora", setor: "Água Purificada" },
  { codigo: "POP.132", titulo: "Manutenção e Limpeza da Osmose Reversa", setor: "Água Purificada" },
];

async function main() {
  console.log("Seeding 162 POPs from Lista Mestra...");

  // Find the example tenant
  const tenant = await prisma.tenant.findFirst({
    where: { cnpj: "12345678000199" },
  });

  if (!tenant) {
    console.error("Tenant not found. Run the main seed first.");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const pop of POPS_LISTA_MESTRA) {
    try {
      await prisma.pop.upsert({
        where: {
          tenantId_codigo: { tenantId: tenant.id, codigo: pop.codigo },
        },
        update: {
          titulo: pop.titulo,
          setor: pop.setor,
        },
        create: {
          codigo: pop.codigo,
          titulo: pop.titulo,
          setor: pop.setor,
          versao: "Rev00",
          dataRevisao: new Date(),
          responsavel: "RT Farmácia",
          objetivo: `Estabelecer procedimento padronizado para ${pop.titulo.toLowerCase()}.`,
          descricao: "Conteúdo a ser preenchido conforme necessidade da farmácia.",
          status: "ATIVO",
          tenantId: tenant.id,
        },
      });
      created++;
    } catch (err: any) {
      console.error(`Error upserting ${pop.codigo}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`Done! ${created} POPs upserted, ${skipped} errors.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
