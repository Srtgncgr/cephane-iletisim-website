import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Dashboard istatistikleri (Sadece admin)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    // Son 30 günün tarihi
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Tüm istatistikleri paralel olarak al
    const [
      totalUsers,
      totalServices,
      totalBlogPosts,
      totalServiceRequests,
      recentServiceRequests,
      serviceRequestStats,
      userStats
    ] = await Promise.all([
      // Toplam kullanıcı sayısı
      prisma.user.count(),

      // Toplam hizmet sayısı
      prisma.service.count(),

      // Toplam blog yazısı sayısı
      prisma.blogPost.count(),

      // Toplam servis talebi sayısı
      prisma.serviceRequest.count(),

      // Son servis talepleri
      prisma.serviceRequest.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          deviceType: true,
          brand: true,
          model: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),

      // Servis talebi durumlarına göre istatistikler
      prisma.serviceRequest.groupBy({
        by: ['status'],
        _count: true
      }),

      // Son 30 günlük kullanıcı kayıt istatistikleri
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      })
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalServices,
        totalBlogPosts,
        totalServiceRequests,
        newUsersLast30Days: userStats
      },
      serviceRequestStats: serviceRequestStats.reduce((acc: Record<string, number>, curr: { status: string; _count: number }) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {}),
      recentServiceRequests
    });
  } catch (error) {
    console.error('Dashboard istatistikleri hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 