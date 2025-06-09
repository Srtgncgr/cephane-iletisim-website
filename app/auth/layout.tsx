import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Giriş Yap - Teknik Servis',
  description: 'Teknik servis giriş sayfası',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      {children}
    </main>
  );
} 