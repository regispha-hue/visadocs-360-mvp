/**
 * Seed de Planos Iniciais
 * Roda: npx ts-node scripts/seed-plans.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  {
    name: "Starter",
    slug: "starter",
    price: 99.0,
    currency: "BRL",
    interval: "month",
    features: [
      "Até 5 colaboradores",
      "Até 50 POPs",
      "Gestão de treinamentos",
      "Quiz básico",
      "Certificados",
      "Suporte por email",
    ],
    maxUsers: 5,
    isActive: true,
  },
  {
    name: "Professional",
    slug: "professional",
    price: 199.0,
    currency: "BRL",
    interval: "month",
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
    maxUsers: 20,
    isActive: true,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: 499.0,
    currency: "BRL",
    interval: "month",
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
    maxUsers: 1000,
    isActive: true,
  },
];

async function main() {
  console.log("🌱 Seeding plans...");

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
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
