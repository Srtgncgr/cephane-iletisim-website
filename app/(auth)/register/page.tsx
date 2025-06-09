import { AuthForm } from '@/app/components/AuthForm';
import Link from 'next/link';
import '@/app/styles/auth.css';

export default function RegisterPage() {
  return (
    <div className="auth-container">
      <h1>Kayıt Ol</h1>
      <AuthForm mode="register" />
      <div className="switch-mode">
        Zaten hesabınız var mı? <Link href="/login">Giriş Yap</Link>
      </div>
    </div>
  );
} 