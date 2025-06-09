import React from 'react';
import styles from './Blog.module.css';
import { FaCalendar } from 'react-icons/fa';
import { prisma } from '@/app/lib/prisma';
import Link from 'next/link';

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

// Son 3 blog yazısını getiren fonksiyon
async function getLatestBlogPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        published: true
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });

    return posts.map(post => ({
      id: post.id,
      title: post.title,
      date: formatDate(new Date(post.createdAt)),
      category: post.category?.name || 'Genel',
      image: post.imageUrl || '/images/blog/default.jpg',
      excerpt: post.excerpt || '',
      slug: post.slug
    }));
  } catch (error) {
    console.error('Blog yazıları yüklenirken bir hata oluştu:', error);
    return [];
  }
}

const Blog = async () => {
    const blogPosts = await getLatestBlogPosts();

    return (
        <section className={styles.blogSection}>
            <div className={styles.blogHero}>
                <div className={styles.blogHeroContent}>
                    <h2 className={styles.blogHeroTitle}>Blog & Haberler</h2>
                    <p className={styles.blogHeroDescription}>
                        Teknoloji dünyasındaki son gelişmeler ve uzman önerileri
                    </p>
                </div>
            </div>
            <div className={styles.blogContainer}>
                <div className={styles.blogGrid}>
                    {blogPosts.map((post) => (
                        <article key={post.id} className={styles.blogCard}>
                            <div className={styles.blogImage}>
                                <img 
                                    src={post.image} 
                                    alt={post.title}
                                    className={styles.imagePlaceholder}
                                />
                            </div>
                            <div className={styles.blogContent}>
                                <div className={styles.blogCategory}>{post.category}</div>
                                <h3 className={styles.blogCardTitle}>{post.title}</h3>
                                <p className={styles.blogExcerpt}>{post.excerpt}</p>
                                <div className={styles.blogMeta}>
                                    <div className={styles.metaItem}>
                                        <FaCalendar className={styles.metaIcon} />
                                        <span>{post.date}</span>
                                    </div>
                                    <Link href={`/blog/${post.slug}`} className={styles.blogReadMore}>
                                        Devamını Gör
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
                <div className={styles.blogFooter}>
                    <Link href="/blog" className={styles.viewAllButton}>
                        Tüm Blog Yazılarını Görüntüle
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Blog; 