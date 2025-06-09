'use client';

import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './service-requests.module.css';
import adminStyles from '../admin.module.css';

// Servis talebi tipi
interface BaseServiceRequest {
  id: string;
  deviceType: string;
  brand: string;
  model: string;
  problem: string;
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  trackingCode: string;
  createdAt: string;
  updatedAt: string;
}

interface RegisteredServiceRequest extends BaseServiceRequest {
  userId: string;
  user: {
    username: string;
    email: string;
  };
  type: 'registered';
  statusUpdates?: Array<{
    id: string;
    status: string;
    note?: string;
    createdAt: string;
  }>;
}

interface AnonymousServiceRequest extends BaseServiceRequest {
  name: string;
  email: string;
  phone: string;
  serialNumber?: string;
  purchaseDate?: string;
  problemCategory: string;
  additionalNotes?: string;
  type: 'anonymous';
  statusUpdates?: Array<{
    id: string;
    status: string;
    note?: string;
    createdAt: string;
  }>;
}

type ServiceRequest = RegisteredServiceRequest | AnonymousServiceRequest;

export default function ServiceRequestsPage() {
  const { data: session, status } = useSession();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [statusNote, setStatusNote] = useState('');

  // Header ve footer'ı gizlemek için doğrudan DOM manipülasyonu
  useEffect(() => {
    // Sadece tarayıcı ortamında çalıştır
    if (typeof window !== 'undefined') {
      const headers = document.querySelectorAll('header');
      const footers = document.querySelectorAll('footer');
      
      headers.forEach(header => {
        header.style.display = 'none';
      });
      
      footers.forEach(footer => {
        footer.style.display = 'none';
      });

      return () => {
        headers.forEach(header => {
          header.style.display = '';
        });
        
        footers.forEach(footer => {
          footer.style.display = '';
        });
      };
    }
  }, []);

  // Servis taleplerini getir
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      const fetchServiceRequests = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/service-requests');
          if (!response.ok) {
            throw new Error('Servis talepleri yüklenirken bir hata oluştu.');
          }
          const data = await response.json();
          
          if (data && data.serviceRequests && Array.isArray(data.serviceRequests)) {
            setServiceRequests(data.serviceRequests);
          } else {
            console.error('API beklenmeyen bir veri formatı döndürdü:', data);
            setServiceRequests([]);
          }
        } catch (error) {
          console.error('Servis talepleri yüklenirken bir hata oluştu:', error);
          setServiceRequests([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchServiceRequests();
    }
  }, [session]);

  // Durum güncelleme fonksiyonu
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/service-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          note: statusNote 
        }),
      });

      if (!response.ok) {
        throw new Error('Durum güncellenirken bir hata oluştu');
      }

      const result = await response.json();

      // Başarılı güncelleme sonrası listeyi yenile
      setServiceRequests(prev => 
        prev.map(request => 
          request.id === id ? { 
            ...request, 
            status: newStatus as any,
            updatedAt: new Date().toISOString() // Güncellenme tarihini güncelle
          } : request
        )
      );

      // Seçili talep varsa onu da güncelle
      if (selectedRequest && selectedRequest.id === id) {
        const updatedStatusUpdates = selectedRequest.statusUpdates || [];
        
        // Yeni status update kayıt edildiyse
        if (result.statusUpdate) {
          updatedStatusUpdates.unshift({
            id: result.statusUpdate.id || `update-${Date.now()}`,
            status: newStatus,
            note: statusNote,
            createdAt: result.statusUpdate.createdAt || new Date().toISOString()
          });
        }
        
        setSelectedRequest({
          ...selectedRequest,
          status: newStatus as any,
          updatedAt: new Date().toISOString(),
          statusUpdates: updatedStatusUpdates
        });
      }
      
      // Not alanını temizle
      setStatusNote('');
      
      // Başarılı mesajı göster
      alert(`Durum başarıyla "${getStatusText(newStatus)}" olarak güncellendi.`);
    } catch (error) {
      console.error('Durum güncellenirken bir hata oluştu:', error);
      alert('Durum güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Servis talebi silme fonksiyonu
  const deleteServiceRequest = async (id: string) => {
    if (!confirm('Bu servis talebini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;

    try {
      const response = await fetch(`/api/service-requests/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Servis talebi silinirken bir hata oluştu');
      }

      // Silme işlemi başarılı olduğunda listeden kaldır
      setServiceRequests(prev => prev.filter(request => request.id !== id));
      
      // Eğer silinen talep şu anda seçili ise, seçimi kaldır
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(null);
      }
      
      // Başarılı mesajı göster
      alert('Servis talebi başarıyla silindi.');
    } catch (error) {
      console.error('Servis talebi silinirken bir hata oluştu:', error);
      alert('Servis talebi silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Filtrelenmiş servis talepleri
  const filteredRequests = serviceRequests.filter(request => {
    const matchesSearch = 
      request.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Kullanıcı türüne göre farklı alanlarda arama yap
      (request.type === 'registered' 
        ? (request as RegisteredServiceRequest).user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (request as RegisteredServiceRequest).user.email.toLowerCase().includes(searchTerm.toLowerCase())
        : (request as AnonymousServiceRequest).name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (request as AnonymousServiceRequest).email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter ? request.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

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

  // Durum badge rengi
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return styles.statusPending;
      case 'APPROVED': return styles.statusApproved;
      case 'IN_PROGRESS': return styles.statusInProgress;
      case 'COMPLETED': return styles.statusCompleted;
      case 'REJECTED': return styles.statusRejected;
      default: return '';
    }
  };

  if (status === 'loading') {
    return <div>Yükleniyor...</div>;
  }

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true
    });
  };

  return (
    <div className={adminStyles.adminContainer}>
      {/* Sayfa içi stil tanımı */}
      <style jsx global>{`
        .anonymousBadge {
          display: inline-block;
          margin-left: 5px;
          font-size: 0.7em;
          padding: 2px 6px;
          border-radius: 10px;
          background-color: #f8f9fa;
          color: #6c757d;
          font-weight: bold;
        }
      `}</style>

      <div className={adminStyles.sidebar}>
        <div className={adminStyles.logo}>
          <h2>Admin Panel</h2>
        </div>
        <nav className={adminStyles.nav}>
          <ul>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li className={adminStyles.active}>
              <Link href="/admin/service-requests">Servis Talepleri</Link>
            </li>
            <li>
              <Link href="/admin/blog">Blog Yazıları</Link>
            </li>
            <li>
              <Link href="/admin/messages">İletişim Mesajları</Link>
            </li>
            <li>
              <Link href="/admin/users">Kullanıcılar</Link>
            </li>
          </ul>
          <button onClick={handleSignOut} className={adminStyles.logoutButton}>
            Çıkış Yap
          </button>
        </nav>
      </div>

      <main className={adminStyles.mainContent}>
        <header className={adminStyles.header}>
          <h1>Servis Talepleri</h1>
          <div className={adminStyles.userInfo}>
            <span>Hoş geldiniz, {session.user.name || session.user.email}</span>
          </div>
        </header>

        <div className={styles.serviceRequestsContainer}>
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <input 
                type="text" 
                placeholder="Ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.statusFilter}>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tüm Durumlar</option>
                <option value="PENDING">Bekliyor</option>
                <option value="APPROVED">Onaylandı</option>
                <option value="IN_PROGRESS">İşleme Alındı</option>
                <option value="COMPLETED">Tamamlandı</option>
                <option value="REJECTED">Reddedildi</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loading}>Servis talepleri yükleniyor...</div>
          ) : (
            <div className={styles.requestsWrapper}>
              <div className={styles.requestsList}>
                {filteredRequests.length === 0 ? (
                  <div className={styles.noRequests}>
                    {statusFilter || searchTerm 
                      ? 'Filtrelere uygun servis talebi bulunamadı.' 
                      : 'Henüz servis talebi bulunmuyor.'}
                  </div>
                ) : (
                  <table className={styles.requestsTable}>
                    <thead>
                      <tr>
                        <th>Cihaz</th>
                        <th>Müşteri</th>
                        <th>Takip Kodu</th>
                        <th>Tarih</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request.id} onClick={() => setSelectedRequest(request)}>
                          <td>{request.deviceType} - {request.brand} {request.model}</td>
                          <td>
                            {request.type === 'registered' 
                              ? (request as RegisteredServiceRequest).user.username || (request as RegisteredServiceRequest).user.email
                              : (request as AnonymousServiceRequest).name || (request as AnonymousServiceRequest).email
                            }
                            {request.type === 'anonymous' && <span className={styles.anonymousBadge}>Misafir</span>}
                          </td>
                          <td>{request.trackingCode}</td>
                          <td>{formatDate(request.createdAt)}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${getStatusColor(request.status)}`}>
                              {getStatusText(request.status)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button 
                                className={styles.viewButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequest(request);
                                }}
                              >
                                Görüntüle
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {selectedRequest && (
                <div className={styles.requestDetail}>
                  <div className={styles.requestDetailHeader}>
                    <h2>{selectedRequest.deviceType} - {selectedRequest.brand} {selectedRequest.model}</h2>
                    <button 
                      className={styles.closeButton}
                      onClick={() => setSelectedRequest(null)}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className={styles.requestInfo}>
                    <div className={styles.infoItem}>
                      <strong>Durum:</strong>
                      <span className={`${styles.statusBadge} ${getStatusColor(selectedRequest.status)}`}>
                        {getStatusText(selectedRequest.status)}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Takip Kodu:</strong> {selectedRequest.trackingCode}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Talep Türü:</strong> 
                      {selectedRequest.type === 'registered' ? 'Kayıtlı Kullanıcı' : 'Misafir Kullanıcı'}
                    </div>

                    {selectedRequest.type === 'registered' ? (
                      // Kayıtlı kullanıcı servis talebi detayları
                      <>
                        <div className={styles.infoItem}>
                          <strong>Müşteri Adı:</strong> {(selectedRequest as RegisteredServiceRequest).user.username}
                        </div>
                        <div className={styles.infoItem}>
                          <strong>E-posta:</strong> {(selectedRequest as RegisteredServiceRequest).user.email}
                        </div>
                      </>
                    ) : (
                      // Anonim kullanıcı servis talebi detayları  
                      <>
                        <div className={styles.infoItem}>
                          <strong>Müşteri Adı:</strong> {(selectedRequest as AnonymousServiceRequest).name}
                        </div>
                        <div className={styles.infoItem}>
                          <strong>E-posta:</strong> {(selectedRequest as AnonymousServiceRequest).email}
                        </div>
                        <div className={styles.infoItem}>
                          <strong>Telefon:</strong> {(selectedRequest as AnonymousServiceRequest).phone}
                        </div>
                        {(selectedRequest as AnonymousServiceRequest).serialNumber && (
                          <div className={styles.infoItem}>
                            <strong>Seri No:</strong> {(selectedRequest as AnonymousServiceRequest).serialNumber}
                          </div>
                        )}
                        {(selectedRequest as AnonymousServiceRequest).problemCategory && (
                    <div className={styles.infoItem}>
                            <strong>Sorun Kategorisi:</strong> {(selectedRequest as AnonymousServiceRequest).problemCategory}
                    </div>
                        )}
                      </>
                    )}

                    <div className={styles.infoItem}>
                      <strong>Cihaz Tipi:</strong> {selectedRequest.deviceType}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Marka:</strong> {selectedRequest.brand}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Model:</strong> {selectedRequest.model}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Oluşturulma:</strong> {formatDate(selectedRequest.createdAt)}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Son Güncelleme:</strong> {formatDate(selectedRequest.updatedAt)}
                    </div>
                  </div>
                  
                  <div className={styles.requestDescription}>
                    <h3>Sorun Açıklaması</h3>
                    <p>{selectedRequest.problem}</p>
                  </div>

                  {selectedRequest.type === 'anonymous' && (selectedRequest as AnonymousServiceRequest).additionalNotes && (
                    <div className={styles.requestDescription}>
                      <h3>Ek Notlar</h3>
                      <p>{(selectedRequest as AnonymousServiceRequest).additionalNotes}</p>
                    </div>
                  )}
                  
                  {selectedRequest.statusUpdates && selectedRequest.statusUpdates.length > 0 && (
                    <div className={styles.statusHistory}>
                      <h3>Durum Geçmişi</h3>
                      <div className={styles.statusUpdates}>
                        {selectedRequest.statusUpdates.map((update, index) => (
                          <div key={index} className={styles.statusUpdate}>
                            <div className={styles.statusUpdateHeader}>
                              <span className={`${styles.statusBadge} ${getStatusColor(update.status)}`}>
                                {getStatusText(update.status)}
                              </span>
                              <span className={styles.statusDate}>{formatDate(update.createdAt)}</span>
                            </div>
                            {update.note && (
                              <div className={styles.statusNote}>
                                {update.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className={styles.requestActions}>
                    <h3>Durumu Güncelle</h3>
                    <div className={styles.statusUpdateForm}>
                      <div className={styles.statusNoteField}>
                        <label htmlFor="statusNote">Not Ekle (Opsiyonel):</label>
                        <textarea
                          id="statusNote"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Durum güncellemesi hakkında bir not ekleyin..."
                          rows={3}
                        />
                      </div>
                      <div className={styles.statusButtons}>
                        <button 
                          className={`${styles.statusButton} ${styles.pendingButton}`}
                          disabled={selectedRequest.status === 'PENDING'}
                          onClick={() => updateStatus(selectedRequest.id, 'PENDING')}
                        >
                          Bekliyor
                        </button>
                        <button 
                          className={`${styles.statusButton} ${styles.approvedButton}`}
                          disabled={selectedRequest.status === 'APPROVED'}
                          onClick={() => updateStatus(selectedRequest.id, 'APPROVED')}
                        >
                          Onaylandı
                        </button>
                        <button 
                          className={`${styles.statusButton} ${styles.inProgressButton}`}
                          disabled={selectedRequest.status === 'IN_PROGRESS'}
                          onClick={() => updateStatus(selectedRequest.id, 'IN_PROGRESS')}
                        >
                          İşleme Alındı
                        </button>
                        <button 
                          className={`${styles.statusButton} ${styles.completedButton}`}
                          disabled={selectedRequest.status === 'COMPLETED'}
                          onClick={() => updateStatus(selectedRequest.id, 'COMPLETED')}
                        >
                          Tamamlandı
                        </button>
                        <button 
                          className={`${styles.statusButton} ${styles.rejectedButton}`}
                          disabled={selectedRequest.status === 'REJECTED'}
                          onClick={() => updateStatus(selectedRequest.id, 'REJECTED')}
                        >
                          Reddedildi
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles.dangerZone}>
                      <h3>Tehlikeli İşlemler</h3>
                      <button 
                        className={styles.deleteButton}
                        onClick={() => deleteServiceRequest(selectedRequest.id)}
                      >
                        Talebi Sil
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 