'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>CEPHANE İLETİŞİM</span>
        </Link>

        {/* Mobil Menü Butonu */}
        <button 
          className={styles.mobileMenuButton} 
          onClick={toggleMenu}
          aria-label="Menüyü aç/kapat"
        >
          <span className={`${styles.menuIcon} ${isMenuOpen ? styles.open : ''}`}></span>
        </button>

        {/* Navigasyon */}
        <nav className={`${styles.navMenu} ${isMenuOpen ? styles.active : ''}`}>
          <Link href="/" className={styles.navLink}>
            Ana Sayfa
          </Link>
          <Link href="/hizmetler" className={styles.navLink}>
            Hizmetler
          </Link>
          <Link href="/blog" className={styles.navLink}>
            Blog
          </Link>
          <Link href="/iletisim" className={styles.navLink}>
            İletişim
          </Link>
          <Link href="/servis-talebi" className={styles.navLink}>
            Servis Talebi
          </Link>
          <Link href="/hakkimizda" className={styles.navLink}>
            Hakkımızda
          </Link>
        </nav>

        {/* Kullanıcı Menüsü */}
        <div className={styles.userMenu}>
          {!isClient ? (
            // Server-side rendering sırasında basit düzenle
            <>
              <Link href="/auth/giris" className={styles.loginBtn}>
                Giriş Yap
              </Link>
              <Link href="/auth/kayit" className={styles.registerBtn}>
                Kayıt Ol
              </Link>
            </>
          ) : session ? (
            <>
              <Link href="/profil" className={styles.profileBtn}>
                Profilim
              </Link>
              <button onClick={handleSignOut} className={styles.logoutBtn}>
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/giris" className={styles.loginBtn}>
                Giriş Yap
              </Link>
              <Link href="/auth/kayit" className={styles.registerBtn}>
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 