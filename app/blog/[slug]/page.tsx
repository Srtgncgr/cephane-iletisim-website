import { notFound } from 'next/navigation';
import { FaCalendar, FaUser, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { prisma } from '@/app/lib/prisma';
import styles from './blogDetail.module.css';

// Tarihi tutarlı bir şekilde formatlamak için yardımcı fonksiyon
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  return `${day} ${monthNames[month - 1]} ${year}`;
}

// Blog yazısı getirme
async function getBlogPost(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: {
        slug: slug,
        published: true
      },
      include: {
        category: true,
        author: true
      }
    });

    if (!post) {
      return null;
    }

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      slug: post.slug,
      author: post.author?.username || 'Admin',
      date: formatDate(new Date(post.createdAt)),
      category: post.category?.name || 'Genel',
      imageUrl: post.imageUrl || '/blog/default.jpg'
    };
  } catch (error) {
    console.error('Blog yazısı getirme hatası:', error);
    return null;
  }
}

// Blog kategorilerini getirme
async function getBlogCategories() {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return categories;
  } catch (error) {
    console.error('Kategori getirme hatası:', error);
    return [];
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  const categories = await getBlogCategories();
  
  if (!post) {
    notFound();
  }

  // İçeriği işle: Satır sonlarını <br /> etiketlerine dönüştür
  const processedContent = post.content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('<br /><br />');

  return (
    <div className={styles.blogDetailPage}>
      <div className={styles.blogHero} style={{ backgroundImage: `url(${post.imageUrl})` }}>
        <div className={styles.blogContainer}>
          <div className={styles.breadcrumb}>
            <Link href="/blog">
              <FaArrowLeft /> Blog'a Dön
            </Link>
          </div>
        </div>
      </div>
      
      <div className={styles.blogContainer}>
        <div className={styles.blogContent}>
          <div className={styles.mainContent}>
            <div className={styles.categoryTag}>{post.category}</div>
            <h1 className={styles.blogTitle}>{post.title}</h1>
            
            <div className={styles.blogMeta}>
              <span><FaUser /> {post.author}</span>
              <span><FaCalendar /> {post.date}</span>
            </div>
            
            {post.excerpt && (
              <div className={styles.blogExcerpt}>
                <p>{post.excerpt}</p>
              </div>
            )}
            
            <div 
              className={styles.blogText}
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          </div>
          
          <div className={styles.sidebar}>
            <div className={styles.sidebarWidget}>
              <h3>Kategoriler</h3>
              <ul className={styles.categoryList}>
                {categories.map(category => (
                  <li key={category.id}>
                    <Link href={`/blog?category=${category.slug}`}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={styles.sidebarWidget}>
              <h3>Yardıma mı İhtiyacınız Var?</h3>
              <div className={styles.contactWidget}>
                <p>Bu konuda sorununuz varsa bizimle iletişime geçin.</p>
                <Link href="/iletisim" className={styles.contactButton}>
                  İletişime Geç
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 