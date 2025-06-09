import React from 'react';
import styles from './Services.module.css';
import { FaClipboardList, FaSearchLocation, FaFileAlt, FaBell } from 'react-icons/fa';

const services = [
    {
        icon: <FaClipboardList />,
        title: "Servis Talebi Sistemi",
        description: "Kullanıcı dostu arayüzümüz ile kolayca servis talebi oluşturun, cihazınızın durumunu anlık takip edin"
    },
    {
        icon: <FaSearchLocation />,
        title: "Tamir Süreci Takibi",
        description: "Cihazınızın tamir sürecini adım adım takip edin, her aşamadan anında haberdar olun"
    },
    {
        icon: <FaFileAlt />,
        title: "Servis ve Onarım Raporlama",
        description: "Yapılan tüm işlemlerin detaylı raporunu alın, garanti kapsamındaki hizmetleri takip edin"
    },
    {
        icon: <FaBell />,
        title: "Müşteri Bilgilendirme",
        description: "SMS ve e-posta ile anlık bilgilendirmeler alın, cihazınızın durumundan her an haberdar olun"
    }
];

const Services = () => {
    return (
        <section className={styles.services}>
            <div className={styles.servicesHero}>
                <div className={styles.servicesHeroContent}>
                    <h2 className={styles.servicesHeroTitle}>Hizmetlerimiz</h2>
                    <p className={styles.servicesHeroDescription}>
                        Modern ve profesyonel teknik servis deneyimi için tüm ihtiyaçlarınız tek çatı altında
                    </p>
                </div>
            </div>
            
            <div className={styles.servicesContent}>
                {services.map((service, index) => (
                    <div key={index} className={styles.serviceDetailCard}>
                        <div className={styles.serviceDetailHeader}>
                            <div className={styles.serviceIconWrapper}>
                                {service.icon}
                            </div>
                            <h3 className={styles.serviceDetailTitle}>{service.title}</h3>
                        </div>
                        <p className={styles.serviceDetailDescription}>
                            {service.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Services; 