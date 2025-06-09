'use client';

import React, { useState, useEffect } from 'react';
import styles from './Footer.module.css';
import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const [currentYear, setCurrentYear] = useState('');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles['footer-content']}>
        <div className={styles['footer-section']}>
          <h3>Hakkımızda</h3>
          <p>Profesyonel telefon teknik servis hizmetleri ile müşterilerimize en iyi çözümleri sunuyoruz.</p>
          <div className={styles['social-links']}>
            <a href="#" aria-label="Facebook"><FaFacebook /></a>
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
          </div>
        </div>
        
        <div className={styles['footer-section']}>
          <h3>Hızlı Linkler</h3>
          <ul>
            <li><Link href="/">Ana Sayfa</Link></li>
            <li><Link href="/hizmetler">Hizmetler</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/iletisim">İletişim</Link></li>
          </ul>
        </div>

        <div className={styles['footer-section']}>
          <h3>İletişim</h3>
          <div className={styles['contact-info']}>
            <p><FaPhone /> +90 (555) 123 45 67</p>
            <p><FaEnvelope /> info@teknikservis.com</p>
            <p><FaMapMarkerAlt /> Merkez Mahallesi, Teknik Servis Sokak No:1, İstanbul</p>
          </div>
        </div>
      </div>
      
      <div className={styles['footer-bottom']}>
        <p>&copy; {currentYear} Teknik Servis. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
};

export default Footer; 