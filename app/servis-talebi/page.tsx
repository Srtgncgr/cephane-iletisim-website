'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './service.module.css';
import { FaUser, FaMobile, FaClipboardList, FaCheck } from 'react-icons/fa';

interface FormData {
  // Kişisel Bilgiler
  name: string;
  email: string;
  phone: string;
  address: string; // Adres alanı eklendi

  // Cihaz Bilgileri
  brand: string;
  model: string;
  serialNumber: string; // Seri numarası eklendi
  purchaseDate: string; // Satın alma tarihi eklendi

  // Sorun Detayı
  problemCategory: string;
  problemDescription: string;
  additionalNotes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string; // Adres hata alanı eklendi
  brand?: string;
  model?: string;
  serialNumber?: string;
  problemCategory?: string;
  problemDescription?: string;
}

export default function ServiceRequestPage() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '', // Adres alanı eklendi
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    problemCategory: '',
    problemDescription: '',
    additionalNotes: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');

  // Session durumunu izle
  useEffect(() => {
    console.log("Oturum durumu değişti:", status);
    console.log("Oturum bilgisi:", session);
  }, [session, status]);

  // Formda oturum durumuna göre değişiklik yap
  useEffect(() => {
    // Eğer kullanıcı giriş yapmışsa ve formlar boşsa, kullanıcı bilgilerini formla doldur
    if (status === 'authenticated' && session?.user) {
      if (!formData.name && !formData.email) {
        setFormData(prev => ({
          ...prev,
          name: session.user.name || '',
          email: session.user.email || ''
        }));
      }
    }
  }, [session, status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Girdi değiştiğinde ilgili hata mesajını temizle
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    switch (step) {
      case 1:
        // Kişisel bilgiler validasyonu
        if (!formData.name.trim()) {
          newErrors.name = 'Ad soyad alanı zorunludur';
          isValid = false;
        }

        if (!formData.email.trim()) {
          newErrors.email = 'E-posta alanı zorunludur';
          isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
          newErrors.email = 'Geçerli bir e-posta adresi giriniz';
          isValid = false;
        }

        if (!formData.phone.trim()) {
          newErrors.phone = 'Telefon alanı zorunludur';
          isValid = false;
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\D/g, ''))) {
          newErrors.phone = 'Geçerli bir telefon numarası giriniz';
          isValid = false;
        }

        if (!formData.address.trim()) {
          newErrors.address = 'Adres bilgisi gereklidir';
          isValid = false;
        }
        break;

      case 2:
        // Cihaz bilgileri validasyonu
        if (!formData.brand) {
          newErrors.brand = 'Marka seçimi zorunludur';
          isValid = false;
        }

        if (!formData.model.trim()) {
          newErrors.model = 'Model alanı zorunludur';
          isValid = false;
        }
        break;

      case 3:
        // Sorun detayı validasyonu
        if (!formData.problemCategory) {
          newErrors.problemCategory = 'Sorun kategorisi seçimi zorunludur';
          isValid = false;
        }

        if (!formData.problemDescription.trim()) {
          newErrors.problemDescription = 'Sorun açıklaması zorunludur';
          isValid = false;
        } else if (formData.problemDescription.trim().length < 10) {
          newErrors.problemDescription = 'Sorun açıklaması en az 10 karakter olmalıdır';
          isValid = false;
        }
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Benzersiz takip kodu oluşturan fonksiyon
  const generateTrackingCode = (): string => {
    const prefix = 'SRV';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Benzersiz takip kodu oluştur
      const newTrackingCode = generateTrackingCode();
      
      // Oturum durumuna göre uygun endpoint'i seç
      const endpoint = session ? '/api/service-requests' : '/api/service-requests/anonymous';
      
      // Debug için session durumunu logla
      console.log('Session status:', status);
      console.log('Session data:', session);
      
      // Ortak form verileri
      const requestData = {
        name: formData.name,
        email: formData.email, 
        phone: formData.phone,
        address: formData.address, // Adres alanı eklendi
        deviceType: 'Mobil Cihaz', // Varsayılan cihaz tipi
        brand: formData.brand,
        model: formData.model,
        serialNumber: formData.serialNumber,
        purchaseDate: formData.purchaseDate,
        problemCategory: formData.problemCategory,
        // Anahtar fark: problem alanı
        problem: formData.problemDescription, // Servise problem olarak gönder
        additionalNotes: formData.additionalNotes,
        trackingCode: newTrackingCode
      };

      console.log(`API isteği gönderiliyor: ${endpoint}`, requestData);

      // API'ye form verilerini gönder
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API yanıt hatası:', response.status, errorText);
        throw new Error(`Servis talebi oluşturulurken bir hata oluştu: ${errorText}`);
      }

      const data = await response.json();
      console.log('Servis talebi başarıyla oluşturuldu:', data);
      
      // Takip kodunu ayarla
      setTrackingCode(data.trackingCode || newTrackingCode);
      setIsSubmitted(true);
      
      // Form verilerini sıfırla
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '', // Adres alanı eklendi
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        problemCategory: '',
        problemDescription: '',
        additionalNotes: ''
      });
    } catch (error) {
      console.error('Form gönderilirken hata oluştu:', error);
      alert('Servis talebi gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles['form-step']}>
            <h2>Kişisel Bilgiler</h2>
            <div className={styles['form-group']}>
              <label htmlFor="name">Ad Soyad*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? styles['input-error'] : ''}
                required
              />
              {errors.name && <span className={styles['error-message']}>{errors.name}</span>}
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="email">E-posta*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? styles['input-error'] : ''}
                required
              />
              {errors.email && <span className={styles['error-message']}>{errors.email}</span>}
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="phone">Telefon*</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="05XX XXX XX XX"
                className={errors.phone ? styles['input-error'] : ''}
                required
              />
              {errors.phone && <span className={styles['error-message']}>{errors.phone}</span>}
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="address">Adres*</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Cihazın teslim edileceği adres"
                className={errors.address ? styles['input-error'] : ''}
                required
                rows={3}
              />
              {errors.address && <span className={styles['error-message']}>{errors.address}</span>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles['form-step']}>
            <h2>Cihaz Bilgileri</h2>
            <div className={styles['form-group']}>
              <label htmlFor="brand">Marka*</label>
              <select
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={errors.brand ? styles['input-error'] : ''}
                required
              >
                <option value="">Seçiniz</option>
                <option value="apple">Apple</option>
                <option value="samsung">Samsung</option>
                <option value="xiaomi">Xiaomi</option>
                <option value="huawei">Huawei</option>
                <option value="oppo">Oppo</option>
                <option value="other">Diğer</option>
              </select>
              {errors.brand && <span className={styles['error-message']}>{errors.brand}</span>}
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="model">Model*</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={errors.model ? styles['input-error'] : ''}
                required
              />
              {errors.model && <span className={styles['error-message']}>{errors.model}</span>}
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="serialNumber">Seri Numarası (Varsa)</label>
              <input
                type="text"
                id="serialNumber"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="purchaseDate">Satın Alma Tarihi (Varsa)</label>
              <input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]} // Bugünden sonraki tarihleri seçilemez yap
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles['form-step']}>
            <h2>Sorun Detayı</h2>
            <div className={styles['form-group']}>
              <label htmlFor="problemCategory">Sorun Kategorisi*</label>
              <select
                id="problemCategory"
                name="problemCategory"
                value={formData.problemCategory}
                onChange={handleChange}
                className={errors.problemCategory ? styles['input-error'] : ''}
                required
              >
                <option value="">Seçiniz</option>
                <option value="screen">Ekran Sorunu</option>
                <option value="battery">Batarya Sorunu</option>
                <option value="power">Güç/Açılmama Sorunu</option>
                <option value="camera">Kamera Sorunu</option>
                <option value="speaker">Hoparlör/Mikrofon Sorunu</option>
                <option value="software">Yazılım Sorunu</option>
                <option value="other">Diğer</option>
              </select>
              {errors.problemCategory && <span className={styles['error-message']}>{errors.problemCategory}</span>}
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="problemDescription">Sorun Açıklaması*</label>
              <textarea
                id="problemDescription"
                name="problemDescription"
                value={formData.problemDescription}
                onChange={handleChange}
                className={errors.problemDescription ? styles['input-error'] : ''}
                required
              />
              {errors.problemDescription && <span className={styles['error-message']}>{errors.problemDescription}</span>}
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="additionalNotes">Ek Notlar (İsteğe Bağlı)</label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
              />
              <span className={styles['char-count']}>{formData.problemDescription.length} / 500</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Başarılı form gönderimi sonrası gösterilecek içerik
  const renderSuccessMessage = () => {
    return (
      <div className={styles['success-message']}>
        <div className={styles['success-content']}>
          <div className={styles['success-icon']}>
            <FaCheck />
          </div>
          <h2>Servis Talebiniz Alındı!</h2>
          <p>Talebiniz başarıyla oluşturuldu. Servis talebinizin durumunu takip etmek için aşağıdaki takip kodunu kullanabilirsiniz:</p>
          
          <div className={styles['tracking-code']}>
            <strong>{trackingCode}</strong>
          </div>
          
          <p>Bu kodu <a href="/servis-takip">Servis Takip</a> sayfasında kullanarak talebinizin güncel durumunu kontrol edebilirsiniz.</p>
          
          <div className={styles['note']}>
            <p>Not: Talebiniz teknik ekibimiz tarafından incelenecek ve en kısa sürede sizinle iletişime geçilecektir.</p>
          </div>
          
          <div className={styles['button-container']}>
            <button 
              type="button" 
              className={styles['new-request-button']}
              onClick={() => {
                setIsSubmitted(false);
                setCurrentStep(1);
              }}
            >
              Yeni Talep Oluştur
            </button>
            
            <a 
              href="/servis-takip" 
              className={styles['track-button']}
            >
              Talep Durumunu İzle
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles['service-page']}>
      {!isSubmitted ? (
        <>
          <div className={styles['service-hero']}>
            <div className={styles['service-title']}>Servis Talebi</div>
            <p className={styles['service-description']}>
              Cihazınızla ilgili servis talebinde bulunmak için lütfen aşağıdaki formu doldurun.
            </p>
          </div>

          <div className={styles['service-progress']}>
            <div className={`${styles['progress-step']} ${currentStep >= 1 ? styles.active : ''}`}>
              <div className={styles['step-icon']}>
                <FaUser />
              </div>
              <span>Kişisel Bilgiler</span>
            </div>
            <div className={`${styles['progress-step']} ${currentStep >= 2 ? styles.active : ''}`}>
              <div className={styles['step-icon']}>
                <FaMobile />
              </div>
              <span>Cihaz Bilgileri</span>
            </div>
            <div className={`${styles['progress-step']} ${currentStep >= 3 ? styles.active : ''}`}>
              <div className={styles['step-icon']}>
                <FaClipboardList />
              </div>
              <span>Sorun Detayı</span>
            </div>
          </div>

          <div className={styles['service-container']}>
            <form className={styles['service-form']} onSubmit={handleSubmit}>
              {renderStep()}
              
              <div className={styles['form-navigation']}>
                {currentStep > 1 && (
                  <button
                    type="button"
                    className={styles['back-button']}
                    onClick={prevStep}
                  >
                    Geri
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    type="button"
                    className={styles['next-button']}
                    onClick={nextStep}
                  >
                    İleri
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className={styles['submit-button']}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      ) : (
        renderSuccessMessage()
      )}
    </div>
  );
} 