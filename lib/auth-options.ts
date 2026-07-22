import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const INVALID_CREDENTIALS_ERROR = "E-mail ou senha inválidos.";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(INVALID_CREDENTIALS_ERROR);
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        });

        if (!user) {
          throw new Error(INVALID_CREDENTIALS_ERROR);
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error(INVALID_CREDENTIALS_ERROR);
        }

        if (user.role !== "SUPER_ADMIN") {
          if (!user.tenantId || !user.tenant) {
            throw new Error("Conta sem farmácia vinculada. Entre em contato com o administrador.");
          }

          if (user.tenant.status === "PENDENTE") {
            throw new Error("Aguardando aprovação do cadastro");
          }
          if (user.tenant.status === "SUSPENSO") {
            throw new Error("Acesso suspenso. Entre em contato com o suporte.");
          }
          if (user.tenant.status === "CANCELADO") {
            throw new Error("Conta cancelada");
          }
          if (user.tenant.subscriptionStatus === "SUSPENSO") {
            throw new Error("Pagamento pendente. Entre em contato com o suporte.");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant?.nome || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.tenantName = (user as any).tenantName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantName = token.tenantName;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
