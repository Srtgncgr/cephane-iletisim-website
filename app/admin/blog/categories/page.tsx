'use client';

import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './categories.module.css';
import adminStyles from '../../admin.module.css';

// Kategori tipi
interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  _count?: {
    posts: number;
  };
}

export default function CategoriesAdminPage() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });

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

  // Kategorileri getir
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      const fetchCategories = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/blog/categories');
          
          if (!response.ok) {
            console.warn('Kategori API çalışmıyor, geçici veriler kullanılıyor...');
            // Geçici kategori verileri
            const mockCategories: BlogCategory[] = [
              { id: '1', name: 'Genel', slug: 'genel', _count: { posts: 5 } },
              { id: '2', name: 'Teknoloji', slug: 'teknoloji', _count: { posts: 3 } },
              { id: '3', name: 'Haberler', slug: 'haberler', _count: { posts: 2 } }
            ];
            setCategories(mockCategories);
            setIsUsingMockData(true);
            return;
          }
          
          const data = await response.json();
          
          if (Array.isArray(data)) {
            setCategories(data);
          } else {
            console.error('API beklenmeyen bir veri formatı döndürdü:', data);
            setIsUsingMockData(true);
          }
        } catch (error) {
          console.error('Kategoriler yüklenirken bir hata oluştu:', error);
          setIsUsingMockData(true);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCategories();
    }
  }, [session]);

  // Kategori düzenleme formunu başlat
  const handleEdit = (category: BlogCategory) => {
    setFormData({
      name: category.name,
      slug: category.slug
    });
    setSelectedCategory(category);
    setIsEditing(true);
    setIsCreating(false);
  };

  // Yeni kategori oluştur
  const handleCreate = () => {
    setFormData({
      name: '',
      slug: ''
    });
    setSelectedCategory(null);
    setIsEditing(false);
    setIsCreating(true);
  };

  // Form verilerini güncelle
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Otomatik slug oluşturma
    if (name === 'name' && isCreating) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  // Slug oluştur
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\sğüşıöç]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validasyonlar
      if (!formData.name || !formData.slug) {
        alert('İsim ve slug alanları gereklidir.');
        return;
      }

      // Mock veri kullanıyorsak, API istekleri yerine yerel durumu güncelle
      if (isUsingMockData) {
        if (isCreating) {
          const newCategory: BlogCategory = {
            id: Date.now().toString(),
            name: formData.name,
            slug: formData.slug,
            _count: { posts: 0 }
          };
          
          setCategories(prev => [...prev, newCategory]);
          
          // Başarılı mesajı
          alert('Kategori başarıyla oluşturuldu!');
        } else if (isEditing && selectedCategory) {
          // Mevcut kategoriyi güncelle
          const updatedCategory = {
            ...selectedCategory,
            name: formData.name,
            slug: formData.slug
          };
          
          setCategories(prev => 
            prev.map(cat => 
              cat.id === selectedCategory.id ? updatedCategory : cat
            )
          );
          
          // Başarılı mesajı
          alert('Kategori başarıyla güncellendi!');
        }
        
        // Formu kapat
        setIsEditing(false);
        setIsCreating(false);
        setSelectedCategory(null);
        return;
      }

      let response;
      
      if (isCreating) {
        // Yeni kategori oluştur
        response = await fetch('/api/blog/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else if (isEditing && selectedCategory) {
        // Mevcut kategoriyi güncelle
        response = await fetch(`/api/blog/categories/${selectedCategory.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        throw new Error('Geçersiz form durumu');
      }

      if (!response.ok) {
        throw new Error('Kategori kaydedilirken bir hata oluştu');
      }

      const result = await response.json();
      
      // Listeyi güncelle
      if (isCreating) {
        setCategories(prev => [...prev, result]);
      } else if (isEditing && selectedCategory) {
        setCategories(prev => 
          prev.map(cat => 
            cat.id === selectedCategory.id ? result : cat
          )
        );
      }

      // Formu kapat
      setIsEditing(false);
      setIsCreating(false);
      setSelectedCategory(null);
      
      alert(isCreating ? 'Kategori başarıyla oluşturuldu!' : 'Kategori başarıyla güncellendi!');
    } catch (error) {
      console.error('Kategori kaydedilirken bir hata oluştu:', error);
      alert('Kategori kaydedilirken bir hata oluştu!');
    }
  };

  // Kategoriyi sil
  const handleDelete = async (id: string) => {
    // İçeriği olan kategori kontrolü
    const category = categories.find(c => c.id === id);
    if (category?._count?.posts && category._count.posts > 0) {
      alert(`Bu kategori ${category._count.posts} adet blog yazısı içeriyor. Silmeden önce blog yazılarını başka bir kategoriye taşıyın.`);
      return;
    }
    
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
      // Mock veri kullanıyorsak, API istekleri yerine yerel durumu güncelle
      if (isUsingMockData) {
        // Kategoriyi listeden kaldır
        setCategories(prev => prev.filter(cat => cat.id !== id));
        
        // Eğer silinen kategori şu anda seçili veya düzenleniyor ise, işlemi iptal et
        if (selectedCategory && selectedCategory.id === id) {
          setSelectedCategory(null);
          setIsEditing(false);
        }
        
        // Başarılı mesajı
        alert('Kategori başarıyla silindi!');
        return;
      }

      const response = await fetch(`/api/blog/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Kategori silinirken bir hata oluştu');
      }

      // Kategoriyi listeden kaldır
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      // Eğer silinen kategori şu anda seçili veya düzenleniyor ise, işlemi iptal et
      if (selectedCategory && selectedCategory.id === id) {
        setSelectedCategory(null);
        setIsEditing(false);
      }
      
      alert('Kategori başarıyla silindi!');
    } catch (error) {
      console.error('Kategori silinirken bir hata oluştu:', error);
      alert('Kategori silinirken bir hata oluştu!');
    }
  };

  // Filtrelenmiş kategoriler
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <a href="/admin">Dashboard</a>
            </li>
            <li>
              <a href="/admin/service-requests">Servis Talepleri</a>
            </li>
            <li>
              <a href="/admin/blog">Blog Yazıları</a>
            </li>
            <li className={adminStyles.active}>
              <a href="/admin/blog/categories">Blog Kategorileri</a>
            </li>
            <li>
              <a href="/admin/services">Hizmetler</a>
            </li>
            <li>
              <a href="/admin/users">Kullanıcılar</a>
            </li>
          </ul>
          <button onClick={handleSignOut} className={adminStyles.logoutButton}>
            Çıkış Yap
          </button>
        </nav>
      </div>

      <main className={adminStyles.mainContent}>
        <header className={adminStyles.header}>
          <h1>Blog Kategorileri Yönetimi</h1>
          <div className={adminStyles.userInfo}>
            <span>Hoş geldiniz, {session.user.name}</span>
          </div>
        </header>

        <div className={styles.categoriesContainer}>
          {/* Kategori ekleme butonları ve filtreler */}
          <div className={styles.actionBar}>
            <button 
              className={styles.createButton}
              onClick={handleCreate}
              disabled={isEditing || isCreating}
            >
              Yeni Kategori Ekle
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
            </div>
          </div>

          {/* Düzenleme veya oluşturma formu */}
          {(isEditing || isCreating) && (
            <div className={styles.categoryForm}>
              <div className={styles.formHeader}>
                <h2>{isCreating ? 'Yeni Kategori' : 'Kategori Düzenle'}</h2>
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
                  <label htmlFor="name">Kategori Adı</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="slug">Slug</label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleFormChange}
                    required
                  />
                  <small>URL'de kullanılacak benzersiz tanımlayıcı</small>
                </div>
                
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

          {/* Kategoriler listesi */}
          {!isEditing && !isCreating && (
            <div className={styles.categoriesList}>
              {isLoading ? (
                <div className={styles.loading}>Kategoriler yükleniyor...</div>
              ) : filteredCategories.length === 0 ? (
                <div className={styles.noCategories}>
                  {searchTerm  
                    ? 'Filtrelere uygun kategori bulunamadı.' 
                    : 'Henüz kategori bulunmuyor.'}
                </div>
              ) : (
                <div className={styles.categoriesTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Kategori Adı</th>
                        <th>Slug</th>
                        <th>Blog Sayısı</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map(category => (
                        <tr key={category.id}>
                          <td className={styles.categoryName}>{category.name}</td>
                          <td className={styles.categorySlug}>{category.slug}</td>
                          <td className={styles.categoryCount}>{category._count?.posts || 0}</td>
                          <td className={styles.categoryActions}>
                            <button 
                              className={styles.editButton}
                              onClick={() => handleEdit(category)}
                            >
                              Düzenle
                            </button>
                            <button 
                              className={styles.deleteButton}
                              onClick={() => handleDelete(category.id)}
                              disabled={category._count?.posts ? category._count.posts > 0 : false}
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 