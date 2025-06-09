'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaCheck } from 'react-icons/fa';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContainer}>
        {/* Sol Kısım */}
        <div className={styles.content}>
          <h1 className={styles.title}>
            Teknoloji ve İletişimde{' '} <br />
            <span className={styles.highlight}>Profesyonel Çözümler</span>
          </h1>
          
          <p className={styles.description}>
            Kurumsal iletişim çözümleri ve teknik servis hizmetlerinde güvenilir çözüm ortağınız
            uzman kadromuz ve hızlı servis ağımızda yanınızdayız
          </p>

          <div className={styles.buttonGroup}>
            <Link href="/servis-talebi" className={styles.primaryButton}>
              Servis Talebi
            </Link>
            <Link href="/servis-takip" className={styles.secondaryButton}>
              Servis Takip
            </Link>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <FaCheck className={styles.checkIcon} />
              <span>7/24 Teknik Destek</span>
            </div>
            <div className={styles.featureItem}>
              <FaCheck className={styles.checkIcon} />
              <span>Aynı Gün Servis</span>
            </div>
            <div className={styles.featureItem}>
              <FaCheck className={styles.checkIcon} />
              <span>Garantili Hizmet</span>
            </div>
          </div>
        </div>

        {/* Sağ Kısım */}
        <div className={styles.imageContainer}>
          <Image
            src="/images/hero-image.png"
            alt="Teknoloji ve İletişim Çözümleri"
            width={500}
            height={500}
            className={styles.heroImage}
            priority
          />
        </div>
      </div>
    </section>
  );
} 