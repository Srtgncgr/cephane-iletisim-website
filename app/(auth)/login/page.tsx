import { AuthForm } from '@/app/components/AuthForm';
import Link from 'next/link';
import '@/app/styles/auth.css';

export default function LoginPage() {
  return (
    <div className="auth-container">
      <h1>Giriş Yap</h1>
      <AuthForm mode="login" />
      <div className="switch-mode">
        Hesabınız yok mu? <Link href="/register">Kayıt Ol</Link>
      </div>
    </div>
  );
} 