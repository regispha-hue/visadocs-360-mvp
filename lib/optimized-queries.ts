import { prisma } from './prisma';

// Optimized queries with proper indexing hints

export async function getFarmaciasByTenant(tenantId: string, status?: string) {
  return prisma.tenant.findMany({
    where: {
      id: tenantId,
      ...(status && { status }),
    },
    include: {
      _count: {
        select: {
          pops: true,
          colaboradores: true,
          treinamentos: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getColaboradoresWithTreinamentos(tenantId: string) {
  return prisma.colaborador.findMany({
    where: { tenantId },
    include: {
      treinamentos: {
        orderBy: { dataTreinamento: 'desc' },
        take: 5,
      },
      _count: {
        select: { treinamentos: true },
      },
    },
    orderBy: { nome: 'asc' },
  });
}

export async function getTreinamentosPendentes(tenantId: string) {
  return prisma.treinamento.findMany({
    where: {
      tenantId,
      status: 'PENDENTE',
      dataTreinamento: {
        gte: new Date(),
      },
    },
    include: {
      colaborador: true,
      pop: true,
    },
    orderBy: { dataTreinamento: 'asc' },
    take: 50,
  });
}
