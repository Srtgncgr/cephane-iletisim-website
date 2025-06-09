import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Kategorileri listeleme
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const categories = await prisma.blogCategory.findMany({
      where: search ? {
        name: { contains: search }
      } : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Kategori listeleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Yeni kategori oluşturma (Sadece admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { name, slug } = await request.json();

    // Validasyonlar
    if (!name || !slug) {
      return new NextResponse('Gerekli alanlar eksik', { status: 400 });
    }

    // Slug kontrolü
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { slug }
    });

    if (existingCategory) {
      return new NextResponse('Bu URL adresi zaten kullanımda', { status: 400 });
    }

    // Kategoriyi oluştur
    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 