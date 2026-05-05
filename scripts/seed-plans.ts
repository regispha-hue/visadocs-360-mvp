/**
 * Seed de Planos Iniciais
 * Roda: npx ts-node scripts/seed-plans.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  {
    name: "Starter",
    description: "Ideal para pequenas farmácias iniciando na conformidade",
    priceMonthly: 99.0,
    priceYearly: 999.0, // ~15% desconto
    features: [
      "Até 5 colaboradores",
      "Até 50 POPs",
      "Gestão de treinamentos",
      "Quiz básico",
      "Certificados",
      "Suporte por email",
    ],
    limits: {
      maxUsers: 5,
      maxPOPs: 50,
      maxStorage: 1024, // MB
    },
    sortOrder: 1,
  },
  {
    name: "Professional",
    description: "Para farmácias em crescimento com necessidades avançadas",
    priceMonthly: 199.0,
    priceYearly: 1999.0, // ~16% desconto
    features: [
      "Até 20 colaboradores",
      "POPs ilimitados",
      "Gestão completa de treinamentos",
      "Quiz com IA",
      "Certificados personalizados",
      "Biblioteca de kits RDC 67",
      "Modo auditoria fiscalização",
      "Suporte prioritário",
    ],
    limits: {
      maxUsers: 20,
      maxPOPs: -1, // ilimitado
      maxStorage: 5120, // 5GB
    },
    sortOrder: 2,
  },
  {
    name: "Enterprise",
    description: "Solução completa para grandes farmácias e redes",
    priceMonthly: 499.0,
    priceYearly: 4999.0, // ~16% desconto
    features: [
      "Colaboradores ilimitados",
      "POPs ilimitados",
      "Todas as features Professional",
      "API access",
      "White-label",
      "Suporte 24/7",
      "Onboarding dedicado",
      "Customizações",
    ],
    limits: {
      maxUsers: -1, // ilimitado
      maxPOPs: -1,
      maxStorage: 51200, // 50GB
    },
    sortOrder: 3,
  },
];

async function main() {
  console.log("🌱 Seeding plans...");

  for (const plan of plans) {
    // @ts-ignore
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`✅ Plan ${plan.name} created/updated`);
  }

  console.log("\n✨ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
