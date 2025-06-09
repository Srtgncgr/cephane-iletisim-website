import React from 'react';
import Image from 'next/image';
import styles from './WhyUs.module.css';
import { FaShieldAlt, FaClock, FaTools, FaUserTie } from 'react-icons/fa';

const features = [
    {
        icon: <FaShieldAlt />,
        title: "Güvenilir Hizmet",
        description: "Uzman kadromuz ile güvenilir ve kaliteli teknik servis hizmeti"
    },
    {
        icon: <FaClock />,
        title: "Hızlı Çözüm",
        description: "Aynı gün tespit ve hızlı onarım garantisi"
    },
    {
        icon: <FaTools />,
        title: "Profesyonel Ekipman",
        description: "En son teknoloji ve profesyonel ekipmanlarla hizmet"
    },
    {
        icon: <FaUserTie />,
        title: "Uzman Kadro",
        description: "Deneyimli ve sertifikalı teknik servis ekibi"
    }
];

const WhyUs = () => {
    return (
        <section className={styles.whyUs}>
            <div className={styles.whyUsContainer}>
                <div className={styles.whyUsContent}>
                    <h2 className={styles.whyUsTitle}>Neden Biz?</h2>
                    <p className={styles.whyUsSubtitle}>
                        Profesyonel ekibimiz ve modern teknik servis anlayışımızla fark yaratıyoruz
                    </p>
                    <div className={styles.featuresGrid}>
                        {features.map((feature, index) => (
                            <div key={index} className={styles.featureCard}>
                                <div className={styles.featureIconWrapper}>
                                    {feature.icon}
                                </div>
                                <div className={styles.featureContent}>
                                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                                    <p className={styles.featureDescription}>{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.whyUsImage}>
                    <Image
                        src="/images/about-us.png"
                        alt="Teknik Servis Ekibi"
                        fill
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                </div>
            </div>
        </section>
    );
};

export default WhyUs; 