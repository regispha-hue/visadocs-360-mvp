import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '@/lib/validation';

describe('Auth Validation', () => {
  describe('loginSchema', () => {
    it('should validate correct credentials', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should validate strong password', () => {
      const result = signupSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongP@ss1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const result = signupSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });
});
