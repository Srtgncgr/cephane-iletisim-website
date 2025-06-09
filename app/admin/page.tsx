'use client';

import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import { FaUsers, FaBlog, FaEnvelope, FaTools, FaClock, FaUserPlus, FaUser, FaComment, FaFileAlt } from 'react-icons/fa';

// Dashboard istatistik tipi
interface DashboardStats {
  totalServiceRequests: number;
  pendingServiceRequests: number;
  totalUsers: number;
  totalBlogPosts: number;
  totalContactMessages: number;
  unreadContactMessages: number;
  newUsers: number;
  recentActivities: RecentActivity[];
}

// Aktivite tipi
interface RecentActivity {
  id: string;
  type: 'contact' | 'blog' | 'user' | 'service';
  title?: string;
  name?: string;
  username?: string;
  email?: string;
  slug?: string;
  authorId?: string;
  read?: boolean;
  status?: string;
  trackingCode?: string;
  createdAt: string | Date;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // İstatistikleri getir
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      const fetchStats = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/admin/dashboard-stats');
          
          if (!response.ok) {
            throw new Error('API çağrısı başarısız oldu');
          }
          
          const data = await response.json();
          setStats(data);
        } catch (error) {
          console.error('Dashboard istatistikleri yüklenirken bir hata oluştu:', error);
        } finally {
          setIsLoading(false);
        }
      };
        
      fetchStats();
    }
  }, [session]);

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true
    });
  };

  // Tarih formatı
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return <FaComment className={styles.activityIcon} />;
      case 'blog':
        return <FaFileAlt className={styles.activityIcon} />;
      case 'user':
        return <FaUser className={styles.activityIcon} />;
      case 'service':
        return <FaTools className={styles.activityIcon} />;
      default:
        return null;
    }
  };

  const getActivityTitle = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'contact':
        return `${activity.name} bir mesaj gönderdi: "${activity.title}"`;
      case 'blog':
        return `Blog yazısı eklendi: "${activity.title}"`;
      case 'user':
        return `Yeni kullanıcı kaydoldu: ${activity.username}`;
      case 'service':
        return `${activity.username} yeni servis talebi oluşturdu: ${activity.title}`;
      default:
        return 'Bilinmeyen aktivite';
    }
  };

  const getActivityLink = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'contact':
        return `/admin/messages`;
      case 'blog':
        return `/admin/blog`;
      case 'user':
        return `/admin/users`;
      case 'service':
        return `/admin/service-requests`;
      default:
        return '#';
    }
  };

  if (status === 'loading') {
    return <div>Yükleniyor...</div>;
  }

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <h2>Admin Panel</h2>
        </div>
        <nav className={styles.nav}>
          <ul>
            <li className={styles.active}>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li>
              <Link href="/admin/service-requests">Servis Talepleri</Link>
            </li>
            <li>
              <Link href="/admin/blog">Blog Yazıları</Link>
            </li>
            <li>
              <Link href="/admin/messages">
                İletişim Mesajları
              </Link>
            </li>
            <li>
              <Link href="/admin/users">Kullanıcılar</Link>
            </li>
          </ul>
          <button onClick={handleSignOut} className={styles.logoutButton}>
            Çıkış Yap
          </button>
        </nav>
      </div>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Dashboard</h1>
          <div className={styles.userInfo}>
            <span>Hoş geldiniz, {session.user.name}</span>
          </div>
        </header>

        <div className={styles.dashboardGrid}>
          {/* Servis Talepleri */}
          <div className={styles.card}>
            <h3>
              <FaTools className={styles.cardIcon} />
              Toplam Servis Talebi
            </h3>
            <p className={styles.stat}>
              {isLoading ? '...' : stats?.totalServiceRequests || 0}
            </p>
          </div>
          
          {/* Bekleyen Talepler */}
          <div className={styles.card}>
            <h3>
              <FaClock className={styles.cardIcon} />
              Bekleyen Talepler
            </h3>
            <p className={styles.stat}>
              {isLoading ? '...' : stats?.pendingServiceRequests || 0}
            </p>
          </div>
          
          {/* Toplam Kullanıcı */}
          <div className={styles.card}>
            <h3>
              <FaUsers className={styles.cardIcon} />
              Toplam Kullanıcı
            </h3>
            <p className={styles.stat}>
              {isLoading ? '...' : stats?.totalUsers || 0}
            </p>
          </div>
          
          {/* Yeni Kullanıcılar */}
          <div className={styles.card}>
            <h3>
              <FaUserPlus className={styles.cardIcon} />
              Yeni Kullanıcılar (Son 7 gün)
            </h3>
            <p className={styles.stat}>
              {isLoading ? '...' : stats?.newUsers || 0}
            </p>
          </div>
          
          {/* Toplam Blog Yazısı */}
          <div className={styles.card}>
            <h3>
              <FaBlog className={styles.cardIcon} />
              Toplam Blog Yazısı
            </h3>
            <p className={styles.stat}>
              {isLoading ? '...' : stats?.totalBlogPosts || 0}
            </p>
          </div>
          
          {/* İletişim Mesajları */}
          <div className={styles.card}>
            <h3>
              <FaEnvelope className={styles.cardIcon} />
              İletişim Mesajları
            </h3>
            <p className={styles.stat}>
              {isLoading ? '...' : stats?.totalContactMessages || 0}
              
            </p>
          </div>
        </div>

        <div className={styles.recentActivity}>
          <h2>Son Aktiviteler</h2>
          <div className={styles.activityList}>
            {isLoading ? (
              <p>Aktiviteler yükleniyor...</p>
            ) : stats?.recentActivities && stats.recentActivities.length > 0 ? (
              <ul className={styles.activities}>
                {stats.recentActivities.map((activity) => (
                  <li key={`${activity.type}-${activity.id}`} className={styles.activityItem}>
                    <Link href={getActivityLink(activity)} className={styles.activityLink}>
                      <div className={styles.activityIconWrapper}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className={styles.activityContent}>
                        <p className={styles.activityTitle}>
                          {getActivityTitle(activity)}
                          {activity.type === 'contact' && !activity.read && (
                            <span className={styles.unreadBadge}>Yeni</span>
                          )}
                        </p>
                        <span className={styles.activityDate}>{formatDate(activity.createdAt)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
            <p>Henüz aktivite bulunmuyor.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 