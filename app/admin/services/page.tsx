'use client';

import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './messages.module.css';
import adminStyles from '../admin.module.css';
import Link from 'next/link';

// İletişim mesajı tipi
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function MessagesAdminPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [readFilter, setReadFilter] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  
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

  // İletişim mesajlarını getir
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      const fetchMessages = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/contact/messages');
          
          if (!response.ok) {
            throw new Error('API çağrısı başarısız oldu');
          }
          
          const data = await response.json();
          setMessages(data);
        } catch (error) {
          console.error('İletişim mesajları yüklenirken bir hata oluştu:', error);
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMessages();
    }
  }, [session]);

  // Mesaj detayını görüntüle
  const handleView = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsViewing(true);

    // Mesajı okundu olarak işaretle
    if (!message.read) {
      try {
        const response = await fetch(`/api/contact/messages/${message.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ read: true })
        });

        if (response.ok) {
          // Mesaj listesini güncelle
          setMessages(prev => 
            prev.map(msg => 
              msg.id === message.id ? { ...msg, read: true } : msg
            )
          );
        }
      } catch (error) {
        console.error('Mesaj durumu güncellenirken bir hata oluştu:', error);
      }
    }
  };

  // Mesaj silme
  const handleDelete = async (id: string) => {
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/contact/messages/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Mesaj silinirken bir hata oluştu');
      }

      // Mesajı listeden kaldır
      setMessages(prev => prev.filter(message => message.id !== id));
      
      // Eğer silinen mesaj şu anda görüntüleniyorsa, görüntülemeyi kapat
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
        setIsViewing(false);
      }
      
      alert('Mesaj başarıyla silindi!');
    } catch (error) {
      console.error('Mesaj silinirken bir hata oluştu:', error);
      alert('Mesaj silinirken bir hata oluştu!');
    }
  };

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

  // İçerik kırpma
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Filtrelenmiş mesajlar
  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRead = readFilter === ''
      ? true
      : readFilter === 'true' 
        ? message.read 
        : !message.read;
    
    return matchesSearch && matchesRead;
  });

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
      <div className={adminStyles.sidebar}>
        <div className={adminStyles.logo}>
          <h2>Admin Panel</h2>
        </div>
        <nav className={adminStyles.nav}>
          <ul>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li>
              <Link href="/admin/service-requests">Servis Talepleri</Link>
            </li>
            <li>
              <Link href="/admin/blog">Blog Yazıları</Link>
            </li>
            <li className={adminStyles.active}>
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
          <h1>İletişim Mesajları</h1>
          <div className={adminStyles.userInfo}>
            <span>Hoş geldiniz, {session.user.name}</span>
          </div>
        </header>

        <div className={styles.messagesAdminContainer}>
          {/* Mesaj filtreler */}
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <input 
                type="text" 
                placeholder="Ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.readFilter}>
              <select 
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
              >
                <option value="">Tüm Mesajlar</option>
                <option value="true">Okunmuş</option>
                <option value="false">Okunmamış</option>
              </select>
            </div>
          </div>

          {/* Mesaj detayı */}
          {isViewing && selectedMessage && (
            <div className={styles.messageDetail}>
              <div className={styles.messageDetailHeader}>
                <h2>{selectedMessage.subject}</h2>
                <button 
                  className={styles.closeButton}
                  onClick={() => setIsViewing(false)}
                >
                  ×
                </button>
              </div>
              
              <div className={styles.messageInfo}>
                <div><strong>Gönderen:</strong> {selectedMessage.name}</div>
                <div><strong>E-posta:</strong> {selectedMessage.email}</div>
                <div><strong>Tarih:</strong> {formatDate(selectedMessage.createdAt)}</div>
              </div>
              
              <div className={styles.messageContent}>
                {selectedMessage.message}
              </div>
              
              <div className={styles.messageActions}>
                <button 
                  className={styles.deleteButton}
                  onClick={() => handleDelete(selectedMessage.id)}
                >
                  Sil
                </button>
              </div>
            </div>
          )}

          {/* Mesaj listesi */}
          {!isViewing && (
            <div className={styles.messagesList}>
              {isLoading ? (
                <div className={styles.loading}>Mesajlar yükleniyor...</div>
              ) : filteredMessages.length === 0 ? (
                <div className={styles.noMessages}>
                  {searchTerm || readFilter 
                    ? 'Filtrelere uygun mesaj bulunamadı.' 
                    : 'Henüz mesaj bulunmuyor.'}
                </div>
              ) : (
                <table className={styles.messagesTable}>
                  <thead>
                    <tr>
                      <th>Durum</th>
                      <th>Gönderen</th>
                      <th>Konu</th>
                      <th>Tarih</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map((message) => (
                      <tr 
                        key={message.id} 
                        className={message.read ? '' : styles.unread}
                        onClick={() => handleView(message)}
                      >
                        <td>
                          <span className={`${styles.status} ${message.read ? styles.read : styles.unread}`}>
                            {message.read ? 'Okundu' : 'Okunmadı'}
                          </span>
                        </td>
                        <td>{message.name}</td>
                        <td>{truncateText(message.subject, 40)}</td>
                        <td>{formatDate(message.createdAt)}</td>
                        <td>
                          <button 
                            className={styles.viewButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(message);
                            }}
                          >
                            Görüntüle
                          </button>
                          <button 
                            className={styles.deleteButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(message.id);
                            }}
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 