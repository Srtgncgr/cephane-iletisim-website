'use client';

import React, { useState } from 'react';
import styles from './Contact.module.css';
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: `İletişim Formu - ${formData.phone}`,
          message: formData.message
        }),
      });

      if (!response.ok) {
        throw new Error('Mesajınız gönderilirken bir hata oluştu');
      }

      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      setSubmitError('Mesajınız gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.contactSection}>
      <div className={styles.contactHero}>
        <div className={styles.contactHeroContent}>
          <h2 className={styles.contactHeroTitle}>İletişime Geçin</h2>
          <p className={styles.contactHeroDescription}>
            Size yardımcı olmaktan mutluluk duyarız
          </p>
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.contactWrapper}>
          <div className={styles.contactInfo}>
            <div className={styles.infoCard}>
              <h3>
                <FaPhone className={styles.icon} />
                Telefon
              </h3>
              <p>(551) 057 55 55</p>
            </div>
            <div className={styles.infoCard}>
              <h3>
                <FaMapMarkerAlt className={styles.icon} />
                Adres
              </h3>
              <p>Çilhane, Belediye Cd. No:6, 55400 Bafra/Samsun</p>
            </div>
          </div>

          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <input
                type="text"
                name="name"
                placeholder="Adınız Soyadınız"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <input
                type="email"
                name="email"
                placeholder="E-posta Adresiniz"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <input
                type="tel"
                name="phone"
                placeholder="Telefon Numaranız"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <textarea
                name="message"
                placeholder="Mesajınız"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>
            
            {submitSuccess && (
              <div className={styles.successMessage}>
                Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.
              </div>
            )}
            
            {submitError && (
              <div className={styles.errorMessage}>
                {submitError}
              </div>
            )}
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact; 