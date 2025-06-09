'use client';

import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './users.module.css';
import adminStyles from '../admin.module.css';
import Link from 'next/link';

// Kullanıcı tipi
interface User {
  id: string;
  name?: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  image?: string;
  createdAt: string;
}

// Geçici test verileri
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin Kullanıcı',
    username: 'admin_user',
    email: 'admin@example.com',
    role: 'ADMIN',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Test Kullanıcı',
    username: 'test_user',
    email: 'user@example.com',
    role: 'USER',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '3',
    name: 'Pasif Kullanıcı',
    username: 'inactive_user',
    email: 'inactive@example.com',
    role: 'USER',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

export default function UsersAdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 10; // Her sayfada gösterilecek kullanıcı sayısı
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false
  });
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'USER',
    password: '',
    confirmPassword: ''
  });

  // Notification gösterme fonksiyonu
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      message,
      type,
      visible: true
    });

    // 5 saniye sonra notification'ı gizle
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

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

  // Kullanıcıları getir
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      const fetchUsers = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/users');
          
          if (!response.ok) {
            // API çalışmıyorsa veya hata dönüyorsa, geçici test verileri kullan
            console.warn('Kullanıcılar API çalışmıyor, geçici test verileri kullanılıyor...');
            setUsers(mockUsers);
            setIsUsingMockData(true);
            setTotalPages(Math.ceil(mockUsers.length / usersPerPage));
            return;
          }
          
          const data = await response.json();
          
          // API'den gelen veriyi kontrol et ve uygun şekilde işle
          if (Array.isArray(data)) {
            setUsers(data);
            setTotalPages(Math.ceil(data.length / usersPerPage));
          } else if (data && typeof data === 'object') {
            // Eğer API bir nesne döndürüyorsa ve içinde bir dizi varsa
            if (Array.isArray(data.users)) {
              setUsers(data.users);
              setTotalPages(Math.ceil(data.users.length / usersPerPage));
            } else if (Array.isArray(data.data)) {
              setUsers(data.data);
              setTotalPages(Math.ceil(data.data.length / usersPerPage));
            } else {
              console.error('API beklenmeyen bir veri formatı döndürdü:', data);
              setUsers(mockUsers);
              setIsUsingMockData(true);
              setTotalPages(Math.ceil(mockUsers.length / usersPerPage));
            }
          } else {
            console.error('API beklenmeyen bir veri formatı döndürdü:', data);
            setUsers(mockUsers);
            setIsUsingMockData(true);
            setTotalPages(Math.ceil(mockUsers.length / usersPerPage));
          }
        } catch (error) {
          console.error('Kullanıcılar yüklenirken bir hata oluştu:', error);
          // Hata durumunda geçici verileri kullan
          setUsers(mockUsers);
          setIsUsingMockData(true);
          setTotalPages(Math.ceil(mockUsers.length / usersPerPage));
        } finally {
          setIsLoading(false);
        }
      };

      fetchUsers();
    }
  }, [session]);

  // Kullanıcı düzenleme formunu başlat
  const handleEdit = (user: User) => {
    setFormData({
      username: user.username || user.name || '',
      email: user.email,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setSelectedUser(user);
    setIsEditing(true);
    setIsCreating(false);
  };

  // Yeni kullanıcı oluştur
  const handleCreate = () => {
    setFormData({
      username: '',
      email: '',
      role: 'USER',
      password: '',
      confirmPassword: ''
    });
    setSelectedUser(null);
    setIsEditing(false);
    setIsCreating(true);
  };

  // Form verilerini güncelle
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Şifre kontrolü
    if (isCreating && formData.password !== formData.confirmPassword) {
      showNotification('Şifreler eşleşmiyor!', 'error');
      return;
    }
    
    try {
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role,
        ...(formData.password ? { password: formData.password } : {})
      };

      // Konsola gönderilen verileri yazdıralım 
      console.log("Gönderilen veriler:", userData);

      // Mock veri kullanıyorsak, API istekleri yerine yerel durumu güncelle
      if (isUsingMockData) {
        if (isCreating) {
          const newUser: User = {
            id: Date.now().toString(),
            name: userData.username,
            username: userData.username,
            email: userData.email,
            role: userData.role as 'ADMIN' | 'USER',
            createdAt: new Date().toISOString(),
          };
          
          setUsers(prev => [...prev, newUser]);
          setTotalPages(Math.ceil((users.length + 1) / usersPerPage));
          
          // Başarılı mesajı
          alert('Kullanıcı başarıyla oluşturuldu!');
        } else if (isEditing && selectedUser) {
          // Mevcut kullanıcıyı güncelle
          const updatedUser = {
            ...selectedUser,
            name: userData.username,
            email: userData.email,
            role: userData.role as 'ADMIN' | 'USER',
          };
          
          setUsers(prev => 
            prev.map(user => 
              user.id === selectedUser.id ? updatedUser : user
            )
          );
          
          // Başarılı mesajı
          alert('Kullanıcı başarıyla güncellendi!');
        }
        
        // Formu kapat
        setIsEditing(false);
        setIsCreating(false);
        setSelectedUser(null);
        return;
      }

      let response;
      
      if (isCreating) {
        // Yeni kullanıcı oluştur
        response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
      } else if (isEditing && selectedUser) {
        // Mevcut kullanıcıyı güncelle
        response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
      } else {
        throw new Error('Geçersiz form durumu');
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Hata Cevabı:", errorData);
        
        // Hata mesajını kullanıcıya göster
        showNotification(errorData, 'error');
        return;
      }

      const result = await response.json();
      console.log("API Başarılı Cevap:", result);
      
      // Listeyi güncelle
      if (isCreating) {
        setUsers(prev => [...prev, result]);
        setTotalPages(Math.ceil((users.length + 1) / usersPerPage));
        showNotification('Kullanıcı başarıyla oluşturuldu!', 'success');
      } else if (isEditing && selectedUser) {
        setUsers(prev => 
          prev.map(user => 
            user.id === selectedUser.id ? result : user
          )
        );
        showNotification('Kullanıcı başarıyla güncellendi!', 'success');
      }

      // Formu kapat
      setIsEditing(false);
      setIsCreating(false);
      setSelectedUser(null);
      
    } catch (error) {
      console.error('Kullanıcı kaydedilirken bir hata oluştu:', error);
      showNotification('Kullanıcı kaydedilirken bir hata oluştu!', 'error');
    }
  };

  // Kullanıcı sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

    try {
      // Mock veri kullanıyorsak, API istekleri yerine yerel durumu güncelle
      if (isUsingMockData) {
        // Kullanıcıyı listeden kaldır
        setUsers(prev => prev.filter(user => user.id !== id));
        setTotalPages(Math.ceil((users.length - 1) / usersPerPage));
        
        // Eğer silinen kullanıcı şu anda seçili veya düzenleniyor ise, işlemi iptal et
        if (selectedUser && selectedUser.id === id) {
          setSelectedUser(null);
          setIsEditing(false);
        }
        
        // Başarılı mesajı
        alert('Kullanıcı başarıyla silindi!');
        return;
      }

      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Kullanıcı silinirken bir hata oluştu');
      }

      // Kullanıcıyı listeden kaldır
      setUsers(prev => prev.filter(user => user.id !== id));
      setTotalPages(Math.ceil((users.length - 1) / usersPerPage));
      
      // Eğer silinen kullanıcı şu anda seçili veya düzenleniyor ise, işlemi iptal et
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Kullanıcı silinirken bir hata oluştu:', error);
      alert('Kullanıcı silinirken bir hata oluştu!');
    }
  };

  // Şifre sıfırlama
  const handleResetPassword = async (id: string) => {
    const newPassword = prompt('Yeni şifre girin:');
    if (!newPassword) return;

    try {
      // Mock veri kullanıyorsak, gerçek bir şifre sıfırlama işlemi yapamayız
      if (isUsingMockData) {
        alert('Şifre başarıyla sıfırlandı! (Mock veri kullanıldığı için gerçek bir değişiklik yapılmadı)');
        return;
      }

      const response = await fetch(`/api/users/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        throw new Error('Şifre sıfırlanırken bir hata oluştu');
      }

      alert('Şifre başarıyla sıfırlandı!');
    } catch (error) {
      console.error('Şifre sıfırlanırken bir hata oluştu:', error);
      alert('Şifre sıfırlanırken bir hata oluştu!');
    }
  };

  // Filtrelenmiş kullanıcılar
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      ((user.username || user.name || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === ''
      ? true
      : user.role?.toUpperCase() === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Sayfalandırılmış kullanıcılar
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Sayfa değiştirme
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Tarih formatı
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Hiç giriş yapmadı';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Kullanıcı avatar baş harflerini oluştur
  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
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
            <li>
              <Link href="/admin/messages">İletişim Mesajları</Link>
            </li>
            <li className={adminStyles.active}>
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
          <h1>Kullanıcılar Yönetimi</h1>
          <div className={adminStyles.userInfo}>
            <span>Hoş geldiniz, {session.user.name}</span>
          </div>
        </header>

        {/* Notification */}
        {notification.visible && (
          <div className={`${styles.notification} ${styles[notification.type]}`}>
            <span>{notification.message}</span>
            <button 
              className={styles.notificationClose}
              onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
            >
              ×
            </button>
          </div>
        )}

        <div className={styles.usersAdminContainer}>
          {/* Kullanıcı ekleme butonları ve filtreler */}
          <div className={styles.actionBar}>
            <button 
              className={styles.createButton}
              onClick={handleCreate}
              disabled={isEditing || isCreating}
            >
              Yeni Kullanıcı Ekle
            </button>
            
            <div className={styles.filters}>
              <div className={styles.searchBox}>
                <input 
                  type="text" 
                  placeholder="Ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.roleFilter}>
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">Tüm Roller</option>
                  <option value="ADMIN">Admin</option>
                  <option value="USER">Kullanıcı</option>
                </select>
              </div>
            </div>
          </div>

          {/* Düzenleme veya oluşturma formu */}
          {(isEditing || isCreating) && (
            <div className={styles.userForm}>
              <div className={styles.formHeader}>
                <h2>{isCreating ? 'Yeni Kullanıcı' : 'Kullanıcıyı Düzenle'}</h2>
                <button 
                  className={styles.closeButton}
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="username">Ad Soyad</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email">E-posta</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="role">Rol</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                  >
                    <option value="USER">Kullanıcı</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                
                {isCreating && (
                  <>
                    <div className={styles.formGroup}>
                      <label htmlFor="password">Şifre</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        required={isCreating}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="confirmPassword">Şifre Tekrar</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleFormChange}
                        required={isCreating}
                      />
                    </div>
                  </>
                )}
                
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton}>
                    {isCreating ? 'Oluştur' : 'Kaydet'}
                  </button>
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Kullanıcılar listesi */}
          {!isEditing && !isCreating && (
            <>
              {isLoading ? (
                <div className={styles.loading}>Kullanıcılar yükleniyor...</div>
              ) : filteredUsers.length === 0 ? (
                <div className={styles.noUsers}>
                  {searchTerm || roleFilter 
                    ? 'Filtrelere uygun kullanıcı bulunamadı.' 
                    : 'Henüz kullanıcı bulunmuyor.'}
                </div>
              ) : (
                <>
                  <table className={styles.usersTable}>
                    <thead>
                      <tr>
                        <th>Kullanıcı</th>
                        <th>Rol</th>
                        <th>Kayıt Tarihi</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map(user => (
                        <tr key={user.id}>
                          <td>
                            <div className={styles.userInfo}>
                              {user.image ? (
                                <img src={user.image} alt={user.username || user.name} className={styles.userAvatar} />
                              ) : (
                                <div className={styles.userAvatar}>{getInitials(user.username || user.name)}</div>
                              )}
                              <div className={styles.userDetails}>
                                <span className={styles.userName}>{user.username || user.name}</span>
                                <span className={styles.userEmail}>{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.userRole} ${styles[user.role.toLowerCase()]}`}>
                              {user.role === 'ADMIN' ? 'Admin' : 'Kullanıcı'}
                            </span>
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>
                            <div className={styles.userActions}>
                              <button 
                                className={styles.editButton}
                                onClick={() => handleEdit(user)}
                              >
                                Düzenle
                              </button>
                              <button 
                                className={styles.resetPasswordButton}
                                onClick={() => handleResetPassword(user.id)}
                              >
                                Şifre Sıfırla
                              </button>
                              <button 
                                className={styles.deleteButton}
                                onClick={() => handleDelete(user.id)}
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Sayfalama */}
                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`${styles.pageButton} ${number === currentPage ? styles.activePageButton : ''}`}
                        >
                          {number}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
} 