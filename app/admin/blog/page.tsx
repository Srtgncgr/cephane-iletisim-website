'use client';

import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './blog.module.css';
import adminStyles from '../admin.module.css';

// Blog yazısı tipi
interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  imageUrl?: string;
  authorId: string;
  author?: {
    id: string;
    name: string;
  };
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  published: boolean;
  tags?: string[];
}

// Kategori tipi
interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  _count?: {
    posts: number;
  };
}

// Geçici test verileri
const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Yeni Web Sitemiz Yayında',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc eget ultricies ultricies, nunc nisl luctus nisl, eget ultricies nisl nunc eget nisl.',
    excerpt: 'Firmamızın yeni web sitesi artık yayında! Modern tasarım ve kullanıcı dostu arayüzü ile hizmetinizdeyiz.',
    slug: 'yeni-web-sitemiz-yayinda',
    imageUrl: 'https://images.unsplash.com/photo-1487014679447-9f8336841d58',
    authorId: '1',
    author: {
      id: '1',
      name: 'Admin'
    },
    categoryId: '1',
    category: {
      id: '1',
      name: 'Duyuru'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: true,
    tags: ['duyuru', 'web sitesi', 'yenilik']
  },
  {
    id: '2',
    title: 'Yaz Servis Kampanyamız Başladı',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc eget ultricies ultricies, nunc nisl luctus nisl, eget ultricies nisl nunc eget nisl.',
    excerpt: 'Yaz aylarına özel servis kampanyamız başladı. Tüm servis işlemlerinde %20 indirim fırsatını kaçırmayın!',
    slug: 'yaz-servis-kampanyamiz-basladi',
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789',
    authorId: '1',
    author: {
      id: '1',
      name: 'Admin'
    },
    categoryId: '2',
    category: {
      id: '2',
      name: 'Kampanya'
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    published: true,
    tags: ['kampanya', 'servis', 'indirim']
  },
  {
    id: '3',
    title: 'Elektronik Cihazlarınızın Ömrünü Uzatacak İpuçları',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc eget ultricies ultricies, nunc nisl luctus nisl, eget ultricies nisl nunc eget nisl.',
    excerpt: 'Elektronik cihazlarınızın daha uzun süre performansını koruması için uzmanlarımızdan önemli bakım tavsiyeleri.',
    slug: 'elektronik-cihazlarinizin-omrunu-uzatacak-ipuclari',
    imageUrl: 'https://images.unsplash.com/photo-1544731612-de7f96afe55f',
    authorId: '1',
    author: {
      id: '1',
      name: 'Admin'
    },
    categoryId: '3',
    category: {
      id: '3',
      name: 'Bakım'
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    published: false,
    tags: ['ipucu', 'bakım', 'elektronik']
  }
];

export default function BlogAdminPage() {
  const { data: session, status } = useSession();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    imageUrl: '',
    categoryId: '',
    published: false,
    tags: ''
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
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

  // Blog yazılarını getir
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      const fetchBlogPosts = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/blog/posts');
          
          if (!response.ok) {
            console.warn('Blog API çalışmıyor, geçici test verileri kullanılıyor...');
            setBlogPosts(mockBlogPosts);
            setIsUsingMockData(true);
            return;
          }
          
          const data = await response.json();
          console.log('API Response:', data); // API yanıtını kontrol et
          
          // API'den gelen veriyi kontrol et ve uygun şekilde işle
          if (Array.isArray(data)) {
            setBlogPosts(data);
            setIsUsingMockData(false);
          } else if (data && typeof data === 'object') {
            // Eğer API bir nesne döndürüyorsa ve içinde bir dizi varsa
            if (Array.isArray(data.posts)) {
              setBlogPosts(data.posts);
              setIsUsingMockData(false);
            } else if (Array.isArray(data.data)) {
              setBlogPosts(data.data);
              setIsUsingMockData(false);
            } else if (Array.isArray(data.blogPosts)) {
              setBlogPosts(data.blogPosts);
              setIsUsingMockData(false);
            } else {
              console.error('API beklenmeyen bir veri formatı döndürdü:', data);
              setBlogPosts(mockBlogPosts);
              setIsUsingMockData(true);
            }
          } else {
            console.error('API beklenmeyen bir veri formatı döndürdü:', data);
            setBlogPosts(mockBlogPosts);
            setIsUsingMockData(true);
          }
        } catch (error) {
          console.error('Blog yazıları yüklenirken bir hata oluştu:', error);
          setBlogPosts(mockBlogPosts);
          setIsUsingMockData(true);
        } finally {
          setIsLoading(false);
        }
      };

      // Kategorileri getir
      const fetchCategories = async () => {
        try {
          setIsCategoriesLoading(true);
          const response = await fetch('/api/blog/categories');
          
          if (!response.ok) {
            console.warn('Kategori API çalışmıyor...');
            setCategories([]);
            return;
          }
          
          const data = await response.json();
          
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          } else {
            console.warn('Kategori listesi boş, varsayılan kategori kullanılıyor');
            // Kategori yoksa varsayılan bir kategori ekleyelim
            setCategories([{
              id: 'default',
              name: 'Genel',
              slug: 'genel',
              _count: { posts: 0 }
            }]);
          }
        } catch (error) {
          console.error('Kategoriler yüklenirken bir hata oluştu:', error);
          // Hata durumunda da varsayılan kategori
          setCategories([{
            id: 'default',
            name: 'Genel',
            slug: 'genel',
            _count: { posts: 0 }
          }]);
        } finally {
          setIsCategoriesLoading(false);
        }
      };

      fetchBlogPosts();
      fetchCategories();
    }
  }, [session]);

  // Blog yazısı düzenleme formunu başlat
  const handleEdit = (post: BlogPost) => {
    console.log('Editing post:', post); // Düzenlenen yazıyı kontrol et
    
    setFormData({
      title: post.title || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      slug: post.slug || '',
      imageUrl: post.imageUrl || '',
      categoryId: post.categoryId || '',
      published: post.published || false,
      tags: post.tags ? post.tags.join(', ') : ''
    });
    
    console.log('Form data after setting:', {
      title: post.title || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      slug: post.slug || '',
      imageUrl: post.imageUrl || '',
      categoryId: post.categoryId || '',
      published: post.published || false,
      tags: post.tags ? post.tags.join(', ') : ''
    });
    
    setImagePreview(post.imageUrl || '');
    setUploadedImage(null);
    setSelectedPost(post);
    setIsEditing(true);
    setIsCreating(false);
  };

  // Yeni blog yazısı oluştur
  const handleCreate = () => {
    // Varsayılan kategori ID'si belirleyelim
    const defaultCategoryId = categories.length > 0 ? categories[0].id : '';
    
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      slug: '',
      imageUrl: '',
      categoryId: defaultCategoryId,
      published: false,
      tags: ''
    });
    setImagePreview('');
    setUploadedImage(null);
    setSelectedPost(null);
    setIsEditing(false);
    setIsCreating(true);
  };

  // Form verilerini güncelle
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const newData = {
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
      };
      console.log('Form data updated:', newData); // Form verisi güncellemelerini kontrol et
      return newData;
    });
  };

  // Görsel yükleme işlemi
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const fileURL = URL.createObjectURL(file);
      setImagePreview(fileURL);
    }
  };

  // Görsel kaldır
  const handleRemoveImage = () => {
    setImagePreview('');
    setUploadedImage(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Görseli yükle
  const uploadImage = async (): Promise<string> => {
    if (!uploadedImage) return formData.imageUrl;

    try {
      setIsUploading(true);
      
      // Gerçek API çağrısı için formdata oluştur
      const formData = new FormData();
      formData.append('file', uploadedImage);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Görsel yüklenirken bir hata oluştu');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Görsel yüklenirken bir hata oluştu:', error);
      alert('Görsel yüklenirken bir hata oluştu! URL ile devam ediliyor.');
      return formData.imageUrl;
    } finally {
      setIsUploading(false);
    }
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Kategori kontrolü
      if (!formData.categoryId) {
        alert('Lütfen bir kategori seçin');
        return;
      }
      
      // Görsel varsa yükle
      let imageUrl = formData.imageUrl;
      if (uploadedImage) {
        imageUrl = await uploadImage();
      }
      
      const postData = {
        ...formData,
        imageUrl,
        tags: tagsArray
      };

      let response;
      
      if (isCreating) {
        // Yeni blog yazısı oluştur
        response = await fetch('/api/blog/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });
      } else if (isEditing && selectedPost) {
        // Mevcut blog yazısını güncelle
        response = await fetch(`/api/blog/posts/${selectedPost.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });
      } else {
        throw new Error('Geçersiz form durumu');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Hatası:", errorText);
        throw new Error(`Blog yazısı kaydedilirken bir hata oluştu: ${errorText}`);
      }

      const result = await response.json();
      console.log("API Cevabı:", result);
      
      // Listeyi güncelle
      if (isCreating) {
        setBlogPosts(prev => [...prev, result]);
      } else if (isEditing && selectedPost) {
        setBlogPosts(prev => 
          prev.map(post => 
            post.id === selectedPost.id ? result : post
          )
        );
      }

      // Formu kapat
      setIsEditing(false);
      setIsCreating(false);
      setSelectedPost(null);
      alert(isCreating ? 'Blog yazısı başarıyla oluşturuldu!' : 'Blog yazısı başarıyla güncellendi!');
    } catch (error) {
      console.error('Blog yazısı kaydedilirken bir hata oluştu:', error);
      alert('Blog yazısı kaydedilirken bir hata oluştu! ' + (error instanceof Error ? error.message : ''));
    }
  };

  // Blog yazısını sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) return;

    try {
      // Mock veri kullanımını devre dışı bırakıyoruz
      // if (isUsingMockData) {
      //   // Yazıyı listeden kaldır
      //   setBlogPosts(prev => prev.filter(post => post.id !== id));
      //   
      //   // Eğer silinen yazı şu anda seçili veya düzenleniyor ise, işlemi iptal et
      //   if (selectedPost && selectedPost.id === id) {
      //     setSelectedPost(null);
      //     setIsEditing(false);
      //   }
      //   
      //   // Başarılı mesajı
      //   alert('Blog yazısı başarıyla silindi!');
      //   return;
      // }

      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Blog yazısı silinirken bir hata oluştu');
      }

      // Yazıyı listeden kaldır
      setBlogPosts(prev => prev.filter(post => post.id !== id));
      
      // Eğer silinen yazı şu anda seçili veya düzenleniyor ise, işlemi iptal et
      if (selectedPost && selectedPost.id === id) {
        setSelectedPost(null);
        setIsEditing(false);
      }
      
      alert('Blog yazısı başarıyla silindi!');
    } catch (error) {
      console.error('Blog yazısı silinirken bir hata oluştu:', error);
      alert('Blog yazısı silinirken bir hata oluştu!');
    }
  };

  // Yayın durumunu güncelle
  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    try {
      // Mock veri kullanımını devre dışı bırakıyoruz
      // if (isUsingMockData) {
      //   // Listeyi güncelle
      //   setBlogPosts(prev => 
      //     prev.map(post => 
      //       post.id === id ? { ...post, published: !currentStatus } : post
      //     )
      //   );
      //   return;
      // }

      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Yayın durumu güncellenirken bir hata oluştu');
      }

      // Listeyi güncelle
      setBlogPosts(prev => 
        prev.map(post => 
          post.id === id ? { ...post, published: !currentStatus } : post
        )
      );
    } catch (error) {
      console.error('Yayın durumu güncellenirken bir hata oluştu:', error);
      alert('Yayın durumu güncellenirken bir hata oluştu!');
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

  // Başlık değiştiğinde otomatik slug oluştur
  useEffect(() => {
    if (isCreating && formData.title && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.title)
      }));
    }
  }, [formData.title, isCreating]);

  // Filtrelenmiş blog yazıları
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.author && post.author.name && post.author.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPublished = publishedFilter === ''
      ? true
      : publishedFilter === 'true' 
        ? post.published 
        : !post.published;
    
    return matchesSearch && matchesPublished;
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

  // İçerik kırpma
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/blog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryFormData),
      });

      if (!response.ok) {
        throw new Error('Kategori eklenirken bir hata oluştu');
      }

      // Kategorileri yeniden yükle
      const categoriesResponse = await fetch('/api/blog/categories');
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);

      // Formu sıfırla ve modalı kapat
      setCategoryFormData({ name: '', slug: '' });
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error('Kategori ekleme hatası:', error);
      alert('Kategori eklenirken bir hata oluştu');
    }
  };

  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value,
      slug: name === 'name' ? value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug
    }));
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
            <li className={adminStyles.active}>
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
          <h1>Blog Yazıları Yönetimi</h1>
          <div className={adminStyles.userInfo}>
            <span>Hoş geldiniz, {session.user.name}</span>
          </div>
        </header>

        <div className={styles.blogAdminContainer}>
          {/* Blog yazıları ekleme butonları ve filtreler */}
          <div className={styles.actionBar}>
            <div className={styles.actionButtons}>
            <button 
              className={styles.createButton}
              onClick={handleCreate}
              disabled={isEditing || isCreating}
            >
              Yeni Blog Yazısı Ekle
            </button>
              <button 
                className={styles.secondaryButton}
                onClick={() => setIsCategoryModalOpen(true)}
              >
                Kategori Ekle
              </button>
            </div>
            
            <div className={styles.filters}>
              <div className={styles.searchBox}>
                <input 
                  type="text" 
                  placeholder="Ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.publishedFilter}>
                <select 
                  value={publishedFilter}
                  onChange={(e) => setPublishedFilter(e.target.value)}
                >
                  <option value="">Tüm Yazılar</option>
                  <option value="true">Yayınlananlar</option>
                  <option value="false">Taslaklar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Düzenleme veya oluşturma formu */}
          {(isEditing || isCreating) && (
            <div className={styles.postForm}>
              <div className={styles.formHeader}>
                <h2>{isCreating ? 'Yeni Blog Yazısı' : 'Blog Yazısını Düzenle'}</h2>
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
                <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="title">Başlık</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
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
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="categoryId">Kategori</label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Seçiniz</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="tags">Etiketler (virgülle ayırın)</label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleFormChange}
                      placeholder="örnek, etiket, blog"
                    />
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="excerpt">Özet</label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleFormChange}
                    rows={3}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="content">İçerik</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleFormChange}
                    rows={10}
                    required
                    style={{ minHeight: '300px', whiteSpace: 'pre-wrap' }}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Görsel</label>
                  <div className={styles.imageUploader}>
                  <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className={styles.fileInput}
                    />
                    <div className={styles.inputRow}>
                  <input
                    type="text"
                        id="imageUrl"
                        name="imageUrl"
                        value={formData.imageUrl}
                    onChange={handleFormChange}
                        placeholder="Görsel URL girebilirsiniz"
                        className={styles.imageUrlInput}
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className={styles.uploadButton}
                      >
                        Görsel Seç
                      </button>
                    </div>
                    {imagePreview && (
                      <div className={styles.imagePreview}>
                        <img src={imagePreview} alt="Önizleme" />
                        <button 
                          type="button" 
                          className={styles.removeImageButton}
                          onClick={handleRemoveImage}
                        >
                          Görseli Kaldır
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    id="published"
                    name="published"
                    checked={formData.published}
                    onChange={handleFormChange}
                  />
                  <label htmlFor="published">Yayınla</label>
                </div>
                
                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className={styles.saveButton}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Yükleniyor...' : isCreating ? 'Oluştur' : 'Kaydet'}
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

          {/* Blog yazıları listesi */}
          {!isEditing && !isCreating && (
            <div className={styles.blogPostsList}>
              {isLoading ? (
                <div className={styles.loading}>Blog yazıları yükleniyor...</div>
              ) : filteredPosts.length === 0 ? (
                <div className={styles.noPosts}>
                  {searchTerm || publishedFilter 
                    ? 'Filtrelere uygun blog yazısı bulunamadı.' 
                    : 'Henüz blog yazısı bulunmuyor.'}
                </div>
              ) : (
                <div className={styles.postsGrid}>
                  {filteredPosts.map(post => (
                    <div key={post.id} className={styles.postCard}>
                      {post.imageUrl && (
                        <div className={styles.postImage} style={{ backgroundImage: `url(${post.imageUrl})` }} />
                      )}
                      <div className={styles.postContent}>
                        <h3 className={styles.postTitle}>{post.title}</h3>
                        <div className={styles.postMeta}>
                          <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
                          <span className={`${styles.postStatus} ${post.published ? styles.published : styles.draft}`}>
                            {post.published ? 'Yayında' : 'Taslak'}
                          </span>
                        </div>
                        <p className={styles.postExcerpt}>{post.excerpt || truncateContent(post.content)}</p>
                        
                        {post.category && (
                          <div className={styles.postCategory}>
                            <span className={styles.category}>{post.category.name}</span>
                          </div>
                        )}
                        
                        {post.tags && post.tags.length > 0 && (
                          <div className={styles.postTags}>
                            {post.tags.map((tag, index) => (
                              <span key={index} className={styles.tag}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={styles.postActions}>
                        <button 
                          className={styles.editButton}
                          onClick={() => handleEdit(post)}
                        >
                          Düzenle
                        </button>
                        <button 
                          className={`${styles.publishButton} ${post.published ? styles.unpublishButton : styles.publishButton}`}
                          onClick={() => togglePublishStatus(post.id, post.published)}
                        >
                          {post.published ? 'Yayından Kaldır' : 'Yayınla'}
                        </button>
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleDelete(post.id)}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kategori Ekleme Modalı */}
        {isCategoryModalOpen && (
          <div className={adminStyles.modalOverlay}>
            <div className={adminStyles.modal}>
              <div className={adminStyles.modalHeader}>
                <h2>Yeni Kategori Ekle</h2>
                <button 
                  className={adminStyles.closeButton}
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCategorySubmit}>
                <div className={adminStyles.formGroup}>
                  <label htmlFor="name">Kategori Adı</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryFormChange}
                    required
                  />
                </div>
                <div className={adminStyles.formGroup}>
                  <label htmlFor="slug">URL</label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={categoryFormData.slug}
                    onChange={handleCategoryFormChange}
                    required
                  />
                </div>
                <div className={adminStyles.modalActions}>
                  <button 
                    type="button" 
                    className={adminStyles.secondaryButton}
                    onClick={() => setIsCategoryModalOpen(false)}
                  >
                    İptal
                  </button>
                  <button 
                    type="submit" 
                    className={adminStyles.primaryButton}
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 