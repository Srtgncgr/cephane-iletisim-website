import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { Role } from '@/app/types/auth';

// Rate limiting için basit bir implementasyon
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

const MAX_LOGIN_ATTEMPTS = 5; // 5 başarısız deneme
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 dakika

// Tip tanımlamaları
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    username: string;
    role: 'USER' | 'ADMIN';
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      role: 'USER' | 'ADMIN';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'USER' | 'ADMIN';
    username: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as Role;
        session.user.username = token.username as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/giris',
    error: '/auth/giris',
  },
  session: {
    strategy: 'jwt' as const,
  },
};

// Rate limiting yardımcı fonksiyonu
function updateLoginAttempts(email: string) {
  const attempts = loginAttempts.get(email);
  if (!attempts) {
    loginAttempts.set(email, { count: 1, firstAttempt: Date.now() });
  } else {
    attempts.count += 1;
  }
} 