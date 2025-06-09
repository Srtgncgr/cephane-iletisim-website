'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './giris.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password
      });

      if (result?.error) {
        setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <main className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Giriş Yap</h1>
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email">E-posta</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Şifre</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            Giriş Yap
          </button>
        </form>

        <div className={styles.authLinks}>
          <a href="/sifremi-unuttum">Şifremi Unuttum</a>
          <a href="/kayit">Hesabınız yok mu? Kayıt olun</a>
        </div>
      </div>
    </main>
  );
} 