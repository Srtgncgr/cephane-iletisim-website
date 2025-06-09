import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';

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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email ve şifre gerekli');
        }

        // Rate limiting kontrolü
        const attempts = loginAttempts.get(credentials.email);
        const now = Date.now();

        if (attempts) {
          // Kilitlenme süresi geçtiyse sıfırla
          if (now - attempts.firstAttempt >= LOCKOUT_TIME) {
            loginAttempts.delete(credentials.email);
          }
          // Hala kilitli ise
          else if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
            const remainingTime = Math.ceil((LOCKOUT_TIME - (now - attempts.firstAttempt)) / 60000);
            throw new Error(`Çok fazla başarısız deneme. ${remainingTime} dakika sonra tekrar deneyin.`);
          }
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user) {
          // Başarısız denemeyi kaydet
          updateLoginAttempts(credentials.email);
          throw new Error('Kullanıcı bulunamadı');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          // Başarısız denemeyi kaydet
          updateLoginAttempts(credentials.email);
          throw new Error('Geçersiz şifre');
        }

        // Başarılı giriş - denemeleri sıfırla
        loginAttempts.delete(credentials.email);

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/(auth)/login',
    signOut: '/(auth)/logout',
    error: '/(auth)/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 gün
    updateAge: 6 * 60 * 60, // 6 saat
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 1 gün
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  }
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