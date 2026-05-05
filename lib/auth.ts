// Barrel export for auth configuration
// Centralizes all auth-related imports

export { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
export { default as NextAuth } from 'next-auth';
export { getServerSession } from 'next-auth/next';
