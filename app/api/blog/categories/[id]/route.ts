import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Kategori detayı
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.blogCategory.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        slug: true,
        posts: {
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            imageUrl: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true
              }
            }
          },
          where: {
            published: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!category) {
      return new NextResponse('Kategori bulunamadı', { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Kategori detay hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Kategori güncelleme (Sadece admin)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Slug kontrolü (kendi ID'si hariç)
    const existingCategory = await prisma.blogCategory.findFirst({
      where: {
        slug,
        NOT: {
          id: params.id
        }
      }
    });

    if (existingCategory) {
      return new NextResponse('Bu URL adresi zaten kullanımda', { status: 400 });
    }

    // Kategoriyi güncelle
    const category = await prisma.blogCategory.update({
      where: { id: params.id },
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
    console.error('Kategori güncelleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Kategori silme (Sadece admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const category = await prisma.blogCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!category) {
      return new NextResponse('Kategori bulunamadı', { status: 404 });
    }

    // Kategoriye ait blog yazıları varsa silmeyi engelle
    if (category._count.posts > 0) {
      return new NextResponse('Bu kategoriye ait blog yazıları olduğu için silinemez', { status: 400 });
    }

    await prisma.blogCategory.delete({
      where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 