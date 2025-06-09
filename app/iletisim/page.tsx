'use client';

import { useState } from 'react';
import styles from './contact.module.css';
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

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
    setSubmitMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitMessage('Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        const errorData = await response.text();
        setSubmitMessage(`Hata: ${errorData}`);
      }
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      setSubmitMessage('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles['contact-page']}>
      <div className={styles.contactHero}>
        <div className={styles.contactContainer}>
          <h1>İletişim</h1>
          <p>Bizimle iletişime geçin, en kısa sürede size dönüş yapalım.</p>
        </div>
      </div>

      <div className={styles.contactContainer}>
        <div className={styles.contactFormSection}>
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="text"
                  name="subject"
                  placeholder="Konu"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <textarea
                  name="message"
                  placeholder="Mesajınız"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
              </button>

              {submitMessage && (
                <div className={`${styles.message} ${submitMessage.includes('Hata') ? styles.error : styles.success}`}>
                  {submitMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 