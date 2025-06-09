'use client';

import styles from './hizmetler.module.css';
import { FaMobile, FaTools, FaMemory, FaBatteryFull, FaShieldAlt, FaWrench, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

const services = [
  {
    id: 1,
    icon: <FaMobile />,
    title: 'Ekran Değişimi',
    description: 'Kırık, çatlak veya arızalı ekranlarınız için orijinal parçalar ile profesyonel değişim hizmeti.',
    features: [
      'Orijinal ekran değişimi',
      'Dokunmatik panel tamiri',
      'LCD değişimi',
      'Ön cam değişimi',
      'Ekran koruyucu uygulama'
    ]
  },
  {
    id: 2,
    icon: <FaBatteryFull />,
    title: 'Batarya Değişimi',
    description: 'Şarj sorunu yaşayan veya şişmiş bataryalarınız için güvenli ve garantili değişim hizmeti.',
    features: [
      'Orijinal batarya değişimi',
      'Batarya performans testi',
      'Şarj soketi tamiri',
      'Şarj entegresi değişimi',
      'Batarya kalibrasyonu'
    ]
  },
  {
    id: 3,
    icon: <FaMemory />,
    title: 'Anakart Tamiri',
    description: 'Su teması, düşme veya diğer nedenlerle oluşan anakart sorunlarınız için mikroskop altında tamir.',
    features: [
      'Anakart tamiri',
      'Entegre değişimi',
      'Su hasarı onarımı',
      'Kısa devre tamiri',
      'Şematik okuma'
    ]
  },
  {
    id: 4,
    icon: <FaTools />,
    title: 'Yazılım Hizmetleri',
    description: 'Telefon yazılımı, güncelleme ve veri kurtarma işlemleri için profesyonel çözümler.',
    features: [
      'Yazılım güncelleme',
      'Format atma',
      'Veri kurtarma',
      'iCloud/Google kilidi açma',
      'Yazılım optimizasyonu'
    ]
  },
  {
    id: 5,
    icon: <FaWrench />,
    title: 'Kasa Değişimi',
    description: 'Deforme olmuş veya hasar görmüş telefon kasaları için orijinal parça değişimi.',
    features: [
      'Arka kapak değişimi',
      'Kasa düzeltme',
      'Yan çerçeve değişimi',
      'Tuş takımı değişimi',
      'Kamera camı değişimi'
    ]
  },
  {
    id: 6,
    icon: <FaShieldAlt />,
    title: 'Koruyucu Hizmetler',
    description: 'Telefonunuzun ömrünü uzatmak için koruyucu bakım ve kaplama hizmetleri.',
    features: [
      'Nano kaplama',
      'Ekran koruyucu montajı',
      'Kılıf montajı',
      'Temizlik ve bakım',
      'Performans optimizasyonu'
    ]
  }
];

export default function ServicesPage() {
  return (
    <div className={styles.servicesPage}>
      <section className={styles.servicesHero}>
        <div className={styles.servicesHeroContent}>
          <h1 className={styles.servicesHeroTitle}>Hizmetlerimiz</h1>
          <p className={styles.servicesHeroDescription}>
            Profesyonel telefon tamir servisimiz ile cihazınızı en kısa sürede ve garantili şekilde onarıyoruz
          </p>
        </div>
      </section>

      <div className={styles.servicesContent}>
        {services.map((service) => (
          <div key={service.id} className={styles.serviceDetailCard}>
            <div className={styles.serviceDetailHeader}>
              <div className={styles.serviceIconWrapper}>
                {service.icon}
              </div>
              <h2 className={styles.serviceDetailTitle}>{service.title}</h2>
            </div>
            <p className={styles.serviceDetailDescription}>{service.description}</p>
            <ul className={styles.serviceFeatures}>
              {service.features.map((feature, index) => (
                <li key={index} className={styles.featureItem}>
                  {feature}
                </li>
              ))}
            </ul>
            <div className={styles.serviceActions}>
              <Link href={`/hizmetler/${service.id}`} className={styles.serviceButton}>
                Detaylı Bilgi <FaArrowRight style={{ marginLeft: '8px' }} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 