'use client';

import React from 'react';
import styles from './about.module.css';
import { motion } from 'framer-motion';
import { FaUsers, FaTools, FaMedal, FaClock } from 'react-icons/fa';

const AboutPage = () => {
  const stats = [
    { icon: <FaUsers />, number: '1000+', text: 'Mutlu Müşteri' },
    { icon: <FaTools />, number: '5000+', text: 'Tamamlanan Onarım' },
    { icon: <FaMedal />, number: '10+', text: 'Yıllık Deneyim' },
    { icon: <FaClock />, number: '24/7', text: 'Teknik Destek' }
  ];

  const values = [
    {
      title: 'Kalite',
      description: 'En yüksek kalitede hizmet sunmayı taahhüt ediyoruz.'
    },
    {
      title: 'Güvenilirlik',
      description: 'Müşterilerimizin güvenini kazanmak önceliğimizdir.'
    },
    {
      title: 'Hız',
      description: 'Hızlı ve etkili çözümler sunuyoruz.'
    },
    {
      title: 'Şeffaflık',
      description: 'Tüm süreçlerde şeffaf iletişimi benimseriz.'
    }
  ];

  return (
    <div className={styles['about-page']}>
      {/* Hero Section */}
      <section className={styles['about-hero']}>
        <div className={styles['about-hero-content']}>
          <motion.h1 
            className={styles['about-hero-title']}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Hakkımızda
          </motion.h1>
          <motion.p
            className={styles['about-hero-description']}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            2014 yılından beri mobil teknoloji dünyasında güvenilir çözüm ortağınız
          </motion.p>
        </div>
      </section>

      {/* About Section */}
      <section className={styles['about-section']}>
        <div className={styles['about-content']}>
          <h2 className={styles['section-title']}>Biz Kimiz?</h2>
          <motion.div 
            className={styles['about-text']}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p>
              Teknik servisimiz, 2014 yılında Samsun'da kurulmuş olup, akıllı telefon ve tablet gibi mobil cihazlar konusunda profesyonel hizmet vermektedir. Deneyimli ekibimiz ve modern ekipmanlarımızla, müşterilerimize en kaliteli hizmeti sunmayı hedefliyoruz.
            </p>
            <p>
              Vizyonumuz, mobil teknoloji dünyasında güvenilir ve kaliteli hizmet anlayışıyla öncü olmaktır. Misyonumuz ise müşterilerimizin mobil cihaz sorunlarına hızlı ve etkili çözümler üreterek, onların memnuniyetini en üst düzeyde tutmaktır.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles['stats-section']}>
        <div className={styles['stats-grid']}>
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className={styles['stat-card']}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={styles['stat-icon']}>{stat.icon}</div>
              <h3 className={styles['stat-number']}>{stat.number}</h3>
              <p className={styles['stat-text']}>{stat.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className={styles['values-section']}>
        <h2 className={styles['section-title']}>Değerlerimiz</h2>
        <div className={styles['values-grid']}>
          {values.map((value, index) => (
            <motion.div
              key={index}
              className={styles['value-card']}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 