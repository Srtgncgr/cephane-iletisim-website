'use client';

import { useState } from 'react';
import { FaCalendar, FaUser, FaClock, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';
import styles from '../blog.module.css';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  date: string;
  category: string;
  image: string;
}

interface BlogListProps {
  posts: BlogPost[];
}

export default function BlogList({ posts }: BlogListProps) {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  
  // Kategorileri dinamik olarak blog yazılarından al
  const allCategories = ['Tümü', ...Array.from(new Set(posts.map(post => post.category)))];

  return (
    <>
      <div className={styles.categoryFilter}>
        {allCategories.map((category) => (
          <button
            key={category}
            className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className={styles.blogGrid}>
        {posts
          .filter((post) => selectedCategory === 'Tümü' || post.category === selectedCategory)
          .map((post) => (
            <article key={post.id} className={styles.blogCard}>
              <Link href={`/blog/${post.slug}`} className={styles.blogLink}>
                <div className={styles.blogImageContainer}>
                  <img src={post.image} alt={post.title} className={styles.blogImage} />
                </div>
                <div className={styles.blogContent}>
                  <span className={styles.category}>{post.category}</span>
                  <h2 className={styles.blogTitle}>{post.title}</h2>
                  <p className={styles.blogExcerpt}>{post.excerpt}</p>
                  <div className={styles.blogMeta}>
                    <div className={styles.metaInfo}>
                      <span><FaCalendar /> {post.date}</span>
                    </div>
                  </div>
                  <div className={styles.readMoreButton}>
                    Devamını Oku <FaArrowRight />
                  </div>
                </div>
              </Link>
            </article>
          ))}
      </div>
    </>
  );
} 