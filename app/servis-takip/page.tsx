'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './service-track.module.css';
import { FaSearch, FaBox, FaTools, FaCheck, FaTimes, FaTruck, FaSpinner, FaMapMarkerAlt, FaList } from 'react-icons/fa';

// API response tiplerini tanımla
interface ServiceRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  trackingCode: string;
  createdAt: string;
  updatedAt: string;
  deviceType: string;
  brand: string;
  model: string;
  problem: string;
  type: 'registered' | 'anonymous';
  serviceAddress?: string;
  customerAddress?: string;
  statusUpdates?: Array<{
    id: string;
    status: string;
    note?: string;
    createdAt: string;
  }>;
}

export default function ServiceTrackPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [trackingCode, setTrackingCode] = useState('');
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Giriş yapan kullanıcı için servis taleplerini yükle
  useEffect(() => {
    const fetchUserServiceRequests = async () => {
      if (sessionStatus === 'authenticated' && session) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/service-requests');
          if (response.ok) {
            const data = await response.json();
            if (data.serviceRequests && data.serviceRequests.length > 0) {
              setServiceRequests(data.serviceRequests);
              // İlk servis talebini otomatik seç
              setCurrentRequest(data.serviceRequests[0]);
            } else {
              setError('Henüz bir servis talebiniz bulunmuyor.');
            }
          } else {
            setError('Servis talepleri yüklenirken bir hata oluştu.');
          }
        } catch (error) {
          console.error('Servis talepleri yüklenirken hata:', error);
          setError('Servis talepleri yüklenirken bir hata oluştu.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserServiceRequests();
  }, [sessionStatus, session]);

  // Takip koduyla servis talebi arama
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingCode.trim()) {
      setError('Lütfen takip kodu giriniz');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/service-requests/track?code=${encodeURIComponent(trackingCode)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Bu takip koduna sahip servis talebi bulunamadı');
        } else {
          throw new Error('Servis sorgulanırken bir hata oluştu');
        }
      }
      
      const data = await response.json();
      setCurrentRequest(data);
    } catch (error) {
      console.error('Takip sorgusu hatası:', error);
      setError(error instanceof Error ? error.message : 'Servis sorgulanırken bir hata oluştu');
      setCurrentRequest(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Başka bir talebe geçiş yapma
  const selectServiceRequest = (request: ServiceRequest) => {
    setCurrentRequest(request);
  };

  // Duruma göre adım indeksini belirle
  const getStepIndex = (status: string) => {
    switch(status) {
      case 'PENDING': return 0;
      case 'APPROVED': return 1; 
      case 'IN_PROGRESS': return 2;
      case 'COMPLETED': return 3;
      case 'REJECTED': return 4; // Reddedilmiş durumu için özel indeks
      default: return 0;
    }
  };

  // Duruma göre açıklama metni
  const getStatusDescription = (status: string) => {
    switch(status) {
      case 'PENDING':
        return 'Servis talebiniz alınmış olup, teknik ekibimiz tarafından değerlendirilmeyi bekliyor. Onaylanması durumunda göndermeniz gereken servis adresi burada gösterilecektir.';
      case 'APPROVED':
        return 'Servis talebiniz onaylanmıştır. Lütfen cihazınızı aşağıda belirtilen adrese kargo ile gönderiniz.';
      case 'IN_PROGRESS':
        return 'Cihazınız şu anda teknik ekibimiz tarafından inceleniyor ve gerekli onarım işlemleri yapılıyor.';
      case 'COMPLETED':
        return 'Cihazınızın onarım işlemleri tamamlandı. Cihazınız kayıtlı adresinize kargo ile gönderilecektir.';
      case 'REJECTED':
        return 'Servis talebiniz teknik nedenlerden dolayı reddedilmiştir. Detaylı bilgi için lütfen müşteri hizmetlerimizle iletişime geçin.';
      default:
        return 'Servis talebinizin durumu hakkında bilgi alınıyor...';
    }
  };

  // Durum adımları
  const steps = [
    { icon: <FaBox />, label: 'Alındı' },
    { icon: <FaTools />, label: 'Onaylandı' },
    { icon: <FaSpinner />, label: 'İşlemde' },
    { icon: <FaCheck />, label: 'Tamamlandı' }
  ];

  // Tarih formatı
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Durum çevirisi
  const getStatusText = (status: string) => {
    switch(status) {
      case 'PENDING': return 'Bekliyor';
      case 'APPROVED': return 'Onaylandı';
      case 'IN_PROGRESS': return 'İşleme Alındı';
      case 'COMPLETED': return 'Tamamlandı';
      case 'REJECTED': return 'Reddedildi';
      default: return status;
    }
  };

  // CSS'teki karşılıkları ne ise ona göre class isimleri uyarlanmalı
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'PENDING': return styles['status-pending'];
      case 'APPROVED': return styles['status-approved'];
      case 'IN_PROGRESS': return styles['status-progress'];
      case 'COMPLETED': return styles['status-completed'];
      case 'REJECTED': return styles['status-rejected'];
      default: return '';
    }
  };

  return (
    <div className={styles['track-page']}>
      <div className={styles['track-container']}>
        <h1 className={styles['track-title']}>Servis Takip</h1>
        
        {sessionStatus === 'authenticated' ? (
          <>
            {serviceRequests.length > 0 ? (
              <div className={styles['user-requests']}>
                <h2 className={styles['section-title']}>Servis Talepleriniz</h2>
                <div className={styles['requests-list']}>
                  {serviceRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className={`${styles['request-item']} ${currentRequest?.id === request.id ? styles['request-active'] : ''}`}
                      onClick={() => selectServiceRequest(request)}
                    >
                      <div className={styles['request-brief']}>
                        <div className={styles['request-name']}>
                          {request.deviceType} - {request.brand} {request.model}
                        </div>
                        <div className={styles['request-meta']}>
                          <span className={`${styles['status-badge']} ${getStatusClass(request.status)}`}>
                            {getStatusText(request.status)}
                          </span>
                          <span className={styles['request-date']}>{formatDate(request.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !isLoading && !error ? (
              <div className={styles['no-requests']}>
                <p>Henüz bir servis talebiniz bulunmuyor.</p>
                <a href="/servis-talebi" className={styles['create-request-button']}>
                  Servis Talebi Oluştur
                </a>
              </div>
            ) : null}
          </>
        ) : (
          <form onSubmit={handleSearch} className={styles['search-form']}>
            <div className={styles['search-input-container']}>
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Takip kodunuzu giriniz"
                className={styles['search-input']}
                required
              />
              <button 
                type="submit" 
                className={styles['search-button']}
                disabled={isLoading}
              >
                {isLoading ? <FaSpinner className={styles.spinner} /> : <FaSearch />}
                <span>{isLoading ? 'Sorgulanıyor...' : 'Sorgula'}</span>
              </button>
            </div>
            {error && <div className={styles['error-message']}>{error}</div>}
          </form>
        )}

        {isLoading && (
          <div className={styles['loading']}>
            <FaSpinner className={styles.spinner} />
            <p>Servis bilgileri yükleniyor...</p>
          </div>
        )}

        {error && !isLoading && sessionStatus === 'authenticated' && (
          <div className={styles['error-message']}>{error}</div>
        )}

        {currentRequest && (
          <div className={styles['status-container']}>
            <div className={styles['status-header']}>
              <h2>
                Servis Durumu: 
                <span className={`${styles['status-badge']} ${getStatusClass(currentRequest.status)}`}>
                  {getStatusText(currentRequest.status)}
                </span>
              </h2>
              <p className={styles['status-date']}>
                <strong>Takip Kodu:</strong> {currentRequest.trackingCode}
              </p>
              <p className={styles['status-date']}>
                <strong>Son Güncelleme:</strong> {formatDate(currentRequest.updatedAt)}
              </p>
            </div>

            <div className={styles['service-details']}>
              <div className={styles['detail-item']}>
                <strong>Cihaz:</strong> {currentRequest.deviceType} - {currentRequest.brand} {currentRequest.model}
              </div>
              <div className={styles['detail-item']}>
                <strong>Oluşturulma:</strong> {formatDate(currentRequest.createdAt)}
              </div>
              <div className={styles['detail-item']}>
                <strong>Sorun:</strong> {currentRequest.problem}
              </div>
            </div>

            {currentRequest.status === 'APPROVED' && currentRequest.serviceAddress && (
              <div className={styles['address-section']}>
                <div className={styles['address-header']}>
                  <FaMapMarkerAlt />
                  <h3>Kargo Gönderim Adresi</h3>
                </div>
                <div className={styles['address-content']}>
                  <p>{currentRequest.serviceAddress}</p>
                  <div className={styles['address-note']}>
                    Lütfen cihazınızı bu adrese gönderirken takip kodunuzu kargo paketinin üzerine yazınız.
                  </div>
                </div>
              </div>
            )}

            {currentRequest.status === 'COMPLETED' && currentRequest.customerAddress && (
              <div className={styles['address-section']}>
                <div className={styles['address-header']}>
                  <FaTruck />
                  <h3>Teslimat Adresi</h3>
                </div>
                <div className={styles['address-content']}>
                  <p>{currentRequest.customerAddress}</p>
                </div>
              </div>
            )}

            {currentRequest.status !== 'REJECTED' && (
            <div className={styles['progress-tracker']}>
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`${styles['progress-step']} ${
                      index <= getStepIndex(currentRequest.status) ? styles.active : ''
                  }`}
                >
                  <div className={styles['step-icon']}>{step.icon}</div>
                  <div className={styles['step-label']}>{step.label}</div>
                  {index < steps.length - 1 && (
                      <div 
                        className={`${styles['step-connector']} ${
                          index < getStepIndex(currentRequest.status) ? styles.active : ''
                        }`} 
                      />
                  )}
                </div>
              ))}
            </div>
            )}

            {currentRequest.status === 'REJECTED' && (
              <div className={styles['rejected-status']}>
                <div className={styles['rejected-icon']}>
                  <FaTimes />
                </div>
                <div className={styles['rejected-message']}>
                  Servis talebiniz reddedilmiştir
                </div>
              </div>
            )}

            <div className={styles['status-description']}>
              <h3>Durum Bilgisi</h3>
              <p>{getStatusDescription(currentRequest.status)}</p>
            </div>

            {currentRequest.statusUpdates && currentRequest.statusUpdates.length > 0 && (
              <div className={styles['status-updates']}>
                <h3>Durum Güncellemeleri</h3>
                <div className={styles['updates-list']}>
                  {currentRequest.statusUpdates.map((update, index) => (
                    <div key={index} className={styles['update-item']}>
                      <div className={styles['update-header']}>
                        <span className={`${styles['status-badge']} ${getStatusClass(update.status)}`}>
                          {getStatusText(update.status)}
                        </span>
                        <span className={styles['update-date']}>{formatDate(update.createdAt)}</span>
                      </div>
                      {update.note && <p className={styles['update-note']}>{update.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 