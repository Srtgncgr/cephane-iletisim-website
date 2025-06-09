import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Dashboard istatistikleri için endpoint
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin yetki kontrolü
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    // Kayıtlı servis talepleri sayısı
    const registeredServiceRequests = await prisma.serviceRequest.count();
    
    // Anonim servis talepleri sayısı (güvenli try-catch ile)
    let anonymousServiceRequests = 0;
    try {
      anonymousServiceRequests = await prisma.anonymousServiceRequest.count();
    } catch (error) {
      console.log('Anonim servis talepleri sayılamadı:', error);
    }
    
    // Toplam servis talepleri
    const totalServiceRequests = registeredServiceRequests + anonymousServiceRequests;
    
    // Bekleyen kayıtlı servis talepleri
    const pendingRegistered = await prisma.serviceRequest.count({
      where: { status: 'PENDING' }
    });
    
    // Bekleyen anonim servis talepleri (güvenli try-catch ile)
    let pendingAnonymous = 0;
    try {
      pendingAnonymous = await prisma.anonymousServiceRequest.count({
        where: { status: 'PENDING' }
      });
    } catch (error) {
      console.log('Bekleyen anonim servis talepleri sayılamadı:', error);
    }
    
    const pendingServiceRequests = pendingRegistered + pendingAnonymous;
    
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

    // 4. Son servis talepleri (kayıtlı kullanıcılar)
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
      take: 3
    });

    // 5. Son anonim servis talepleri (güvenli try-catch ile)
    let latestAnonymousRequests: any[] = [];
    try {
      latestAnonymousRequests = await prisma.anonymousServiceRequest.findMany({
        select: {
          id: true,
          deviceType: true,
          brand: true,
          model: true,
          status: true,
          trackingCode: true,
          name: true,
          email: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 2
      });
    } catch (error) {
      console.log('Anonim servis talepleri getirilemedi:', error);
    }

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
        username: request.user?.username || 'Anonim',
        email: request.user?.email || '',
        status: request.status,
        trackingCode: request.trackingCode,
        createdAt: request.createdAt
      })),
      ...latestAnonymousRequests.map(request => ({
        id: request.id,
        type: 'service',
        title: `${request.deviceType} - ${request.brand} ${request.model}`,
        username: request.name || 'Anonim',
        email: request.email || '',
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