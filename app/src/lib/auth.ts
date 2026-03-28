import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './db';
import { usersService } from '@/modules/users/services/users.service';
import { authLogger } from '@/lib/logger';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          authLogger.warn({ issues: parsed.error.issues }, 'Login attempt with invalid format');
          return null;
        }

        const { email, password } = parsed.data;

        const user = await usersService.getByEmail(email).catch(() => null);
        if (!user) {
          authLogger.warn({ email }, 'Login failed: user not found');
          return null;
        }

        const valid = await usersService.verifyPassword(user.id, password);
        if (!valid) {
          authLogger.warn({ email }, 'Login failed: wrong password');
          return null;
        }

        authLogger.info({ userId: user.id, email }, 'Login successful');

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
