import styles from './blog.module.css';
import BlogList from './components/BlogList';
import { prisma } from '@/app/lib/prisma';

// Blog yazılarını veritabanından getiren sunucu komponenti
async function getBlogPosts() {
  try {
    console.log("Blog yazıları getiriliyor...");
    const posts = await prisma.blogPost.findMany({
      where: {
        published: true
      },
      include: {
        category: true,
        author: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log("Bulunan blog yazıları:", posts.length);
    
    return posts.map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || '',
      slug: post.slug,
      author: post.author?.username || 'Admin',
      date: new Date(post.createdAt).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      category: post.category?.name || 'Genel',
      image: post.imageUrl || '/blog/default.jpg'
    }));
  } catch (error) {
    console.error('Blog yazıları yüklenirken bir hata oluştu:', error);
    return [];
  }
}

export default async function BlogPage() {
  const blogPosts = await getBlogPosts();
  
  return (
    <div className={styles.blogPage}>
      <div className={styles.blogHero}>
        <div className={styles.blogContainer}>
          <h1>Blog</h1>
          <p>Telefon tamiri ve bakımı hakkında profesyonel ipuçları, güncel teknoloji haberleri ve uzman tavsiyeleri</p>
        </div>
      </div>
      
      <div className={styles.blogContainer}>
        {blogPosts.length > 0 ? (
        <BlogList posts={blogPosts} />
        ) : (
          <div className={styles.noPosts}>
            <h2>Henüz blog yazısı bulunmuyor</h2>
            <p>İlk blog yazımızı yakında paylaşacağız. Lütfen daha sonra tekrar kontrol edin.</p>
          </div>
        )}
      </div>
    </div>
  );
} 