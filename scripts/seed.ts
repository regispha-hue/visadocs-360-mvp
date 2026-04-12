import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash("johndoe123", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "john@doe.com" },
    update: {},
    create: {
      email: "john@doe.com",
      name: "Super Admin",
      password: superAdminPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Super Admin created:", superAdmin.email);

  // Create Admin for VISADOCS (alternative access)
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { email: "admin@visadocs.com" },
    update: {},
    create: {
      email: "admin@visadocs.com",
      name: "Administrador VISADOCS",
      password: adminPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Admin VISADOCS created: admin@visadocs.com");

  // Create example farmacia
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const farmacia = await prisma.tenant.upsert({
    where: { cnpj: "12345678000199" },
    update: {},
    create: {
      nome: "Farmácia Exemplo LTDA",
      cnpj: "12345678000199",
      responsavel: "Dr. João Silva",
      email: "farmacia@exemplo.com",
      telefone: "(11) 99999-9999",
      endereco: {
        logradouro: "Rua das Farmácias",
        numero: "123",
        complemento: "Loja A",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01234567",
      },
      status: "ATIVO",
      subscriptionStatus: "TRIAL",
      trialEndsAt,
    },
  });
  console.log("Farmacia created:", farmacia.nome);

  // Create admin user for farmacia
  const farmaciaAdminPassword = await bcrypt.hash("farmacia123", 10);
  await prisma.user.upsert({
    where: { email: "farmacia@exemplo.com" },
    update: {},
    create: {
      email: "farmacia@exemplo.com",
      name: "Dr. João Silva",
      password: farmaciaAdminPassword,
      role: "ADMIN_FARMACIA",
      tenantId: farmacia.id,
    },
  });
  console.log("Farmacia admin user created");

  // Create POPs
  const pop1 = await prisma.pop.upsert({
    where: { tenantId_codigo: { tenantId: farmacia.id, codigo: "POP.001" } },
    update: {},
    create: {
      codigo: "POP.001",
      titulo: "Procedimento de Limpeza de Equipamentos",
      setor: "Limpeza",
      versao: "Rev00",
      dataRevisao: new Date(),
      responsavel: "Dr. João Silva",
      objetivo: "Estabelecer procedimentos padronizados para limpeza e sanitização de equipamentos de manipulação.",
      descricao: "1. Desligar o equipamento\n2. Remover resíduos visíveis\n3. Aplicar solução desinfetante\n4. Aguardar tempo de ação\n5. Enxaguar com água purificada\n6. Secar com pano limpo\n7. Registrar no log de limpeza",
      status: "ATIVO",
      tenantId: farmacia.id,
    },
  });

  const pop2 = await prisma.pop.upsert({
    where: { tenantId_codigo: { tenantId: farmacia.id, codigo: "POP.002" } },
    update: {},
    create: {
      codigo: "POP.002",
      titulo: "Recebimento e Conferência de Matérias-Primas",
      setor: "Recebimento",
      versao: "Rev01",
      dataRevisao: new Date(),
      responsavel: "Maria Santos",
      objetivo: "Definir os procedimentos para recebimento, inspeção e armazenamento de matérias-primas.",
      descricao: "1. Verificar nota fiscal\n2. Conferir quantidade\n3. Inspecionar embalagem\n4. Verificar lote e validade\n5. Registrar no sistema\n6. Armazenar conforme especificação\n7. Identificar com etiqueta interna",
      status: "ATIVO",
      tenantId: farmacia.id,
    },
  });
  console.log("POPs created");

  // Create Colaboradores
  const colab1 = await prisma.colaborador.upsert({
    where: { tenantId_cpfHash: { tenantId: farmacia.id, cpfHash: await bcrypt.hash("12345678901", 10) } },
    update: {},
    create: {
      nome: "Maria Santos",
      cpfHash: await bcrypt.hash("12345678901", 10),
      cpfMasked: "123.***.***-01",
      funcao: "ANALISTA_CQ",
      setor: "CQ",
      dataAdmissao: new Date("2023-01-15"),
      email: "maria@exemplo.com",
      status: "ATIVO",
      tenantId: farmacia.id,
    },
  });

  const colab2 = await prisma.colaborador.upsert({
    where: { tenantId_cpfHash: { tenantId: farmacia.id, cpfHash: await bcrypt.hash("98765432100", 10) } },
    update: {},
    create: {
      nome: "Pedro Oliveira",
      cpfHash: await bcrypt.hash("98765432100", 10),
      cpfMasked: "987.***.***-00",
      funcao: "MANIPULADOR",
      setor: "Produção",
      dataAdmissao: new Date("2023-03-20"),
      status: "ATIVO",
      tenantId: farmacia.id,
    },
  });

  const colab3 = await prisma.colaborador.upsert({
    where: { tenantId_cpfHash: { tenantId: farmacia.id, cpfHash: await bcrypt.hash("11122233344", 10) } },
    update: {},
    create: {
      nome: "Ana Costa",
      cpfHash: await bcrypt.hash("11122233344", 10),
      cpfMasked: "111.***.***-44",
      funcao: "AUXILIAR",
      setor: "Limpeza",
      dataAdmissao: new Date("2024-01-10"),
      status: "ATIVO",
      tenantId: farmacia.id,
    },
  });
  console.log("Colaboradores created");

  // Create Treinamentos
  await prisma.treinamento.create({
    data: {
      popId: pop1.id,
      colaboradorId: colab1.id,
      dataTreinamento: new Date("2024-02-01"),
      instrutor: "Dr. João Silva",
      duracao: 2,
      observacoes: "Treinamento teórico e prático",
      status: "CONCLUIDO",
      tenantId: farmacia.id,
    },
  });

  await prisma.treinamento.create({
    data: {
      popId: pop2.id,
      colaboradorId: colab2.id,
      dataTreinamento: new Date("2024-02-15"),
      instrutor: "Maria Santos",
      duracao: 1.5,
      status: "CONCLUIDO",
      tenantId: farmacia.id,
    },
  });
  console.log("Treinamentos created");

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
