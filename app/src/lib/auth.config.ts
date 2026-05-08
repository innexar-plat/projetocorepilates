/**
 * Edge-compatible auth config — sem Prisma, sem bcrypt.
 * Usado apenas no middleware (Edge Runtime).
 * A config completa (com PrismaAdapter) fica em src/lib/auth.ts.
 */
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Sem providers aqui — só para validação de JWT no edge.
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};

export const { auth: edgeAuth } = NextAuth(authConfig);
