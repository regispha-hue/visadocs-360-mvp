import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { setupTestDb, createTestUser, createTestTenant } from './setup';

describe('Database Operations', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  it('should create a user', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
    });

    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
  });

  it('should create a tenant with relationships', async () => {
    const tenant = await createTestTenant({
      nome: 'Farmácia Teste',
      cnpj: '00.000.000/0000-00',
    });

    expect(tenant.nome).toBe('Farmácia Teste');
    expect(tenant.status).toBe('ATIVO');
  });

  it('should enforce unique email constraint', async () => {
    await createTestUser({
      email: 'unique@example.com',
      name: 'User 1',
      password: 'pass1',
    });

    await expect(
      createTestUser({
        email: 'unique@example.com',
        name: 'User 2',
        password: 'pass2',
      })
    ).rejects.toThrow();
  });
});
