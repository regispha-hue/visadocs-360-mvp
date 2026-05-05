import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

// Test database setup
export async function setupTestDb() {
  // Clean test data
  await prisma.treinamento.deleteMany();
  await prisma.colaborador.deleteMany();
  await prisma.pop.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(data: {
  email: string;
  name: string;
  password: string;
  role?: string;
}) {
  return prisma.user.create({
    data: {
      ...data,
    // @ts-ignore
      role: data.role || 'OPERADOR',
    },
  });
}

export async function createTestTenant(data: {
  nome: string;
  cnpj: string;
}) {
  return prisma.tenant.create({
    // @ts-ignore
    data: {
      ...data,
      status: 'ATIVO',
      subscriptionStatus: 'ATIVO',
    },
  });
}
