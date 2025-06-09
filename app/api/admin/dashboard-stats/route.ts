import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Dashboard istatistikleri için endpoint
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin yetki kontrolü
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    // Servis talepleri sayısı
    const totalServiceRequests = await prisma.serviceRequest.count();
    
    // Bekleyen servis talepleri
    const pendingServiceRequests = await prisma.serviceRequest.count({
      where: { status: 'PENDING' }
    });
    
    // Toplam kullanıcı sayısı
    const totalUsers = await prisma.user.count();
    
    // Toplam blog yazısı
    const totalBlogPosts = await prisma.blogPost.count();
    
    // Toplam iletişim mesajı
    const totalContactMessages = await prisma.contactMessage.count();
    
    // Okunmamış iletişim mesajları
    const unreadContactMessages = await prisma.contactMessage.count({
      where: { read: false }
    });

    // Son 7 gündeki kullanıcı kayıtları
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Son aktiviteleri getir (en son 10 kayıt)
    
    // 1. Son iletişim mesajları
    const latestContactMessages = await prisma.contactMessage.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        read: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // 2. Son blog yazıları
    const latestBlogPosts = await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        authorId: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // 3. Son kayıt olan kullanıcılar
    const latestUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // 4. Son servis talepleri
    const latestServiceRequests = await prisma.serviceRequest.findMany({
      select: {
        id: true,
        deviceType: true,
        brand: true,
        model: true,
        status: true,
        trackingCode: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Tüm aktiviteleri birleştir ve tarihe göre sırala
    const recentActivities = [
      ...latestContactMessages.map(msg => ({
        id: msg.id,
        type: 'contact',
        title: msg.subject,
        name: msg.name,
        createdAt: msg.createdAt,
        read: msg.read
      })),
      ...latestBlogPosts.map(post => ({
        id: post.id,
        type: 'blog',
        title: post.title,
        slug: post.slug,
        authorId: post.authorId,
        createdAt: post.createdAt
      })),
      ...latestUsers.map(user => ({
        id: user.id,
        type: 'user',
        username: user.username,
        email: user.email, 
        createdAt: user.createdAt
      })),
      ...latestServiceRequests.map(request => ({
        id: request.id,
        type: 'service',
        title: `${request.deviceType} - ${request.brand} ${request.model}`,
        username: request.user.username,
        email: request.user.email,
        status: request.status,
        trackingCode: request.trackingCode,
        createdAt: request.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, 10); // En son 10 aktivite

    return NextResponse.json({
      totalServiceRequests,
      pendingServiceRequests,
      totalUsers,
      totalBlogPosts,
      totalContactMessages,
      unreadContactMessages,
      newUsers,
      recentActivities
    });
    
  } catch (error) {
    console.error('Dashboard istatistikleri hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 