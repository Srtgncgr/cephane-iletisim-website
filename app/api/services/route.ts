import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Hizmetleri listeleme
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Arama koşulları
    const where = search ? {
      OR: [
        { title: { contains: search } },
        { description: { contains: search } }
      ]
    } : {};

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          shortDescription: true,
          imageUrl: true,
          price: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.service.count({ where })
    ]);

    return NextResponse.json({
      services,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Hizmet listeleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Yeni hizmet oluşturma (Sadece admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { title, description, shortDescription, imageUrl, price, isActive } = await request.json();

    // Validasyonlar
    if (!title || !description || !shortDescription) {
      return new NextResponse('Gerekli alanlar eksik', { status: 400 });
    }

    // Hizmeti oluştur
    const service = await prisma.service.create({
      data: {
        title,
        description,
        shortDescription,
        imageUrl,
        price: price || 0,
        isActive: isActive ?? true
      },
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        imageUrl: true,
        price: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Hizmet oluşturma hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 