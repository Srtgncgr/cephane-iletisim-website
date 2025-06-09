import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Blog yazılarını listeleme
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const skip = (page - 1) * limit;

    // Arama koşulları
    const where = {
      AND: [
        search ? {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } }
          ]
        } : {},
        categoryId ? { categoryId: categoryId } : {}
      ]
    };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          slug: true,
          excerpt: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
          published: true,
          category: {
            select: {
              id: true,
              name: true
            }
          },
          author: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ]);

    // Düz dizi olarak döndür, client tarafında daha kolay işlenir
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Blog yazıları listeleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Yeni blog yazısı oluşturma (Sadece admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session bilgisi:", session);
    
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { title, content, excerpt, slug, imageUrl, categoryId, published } = await request.json();
    console.log("Alınan veriler:", { title, slug, categoryId, published });

    // Validasyonlar
    if (!title || !content || !slug || !categoryId) {
      return new NextResponse('Gerekli alanlar eksik', { status: 400 });
    }

    // Slug kontrolü
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    });

    if (existingPost) {
      return new NextResponse('Bu URL adresi zaten kullanımda', { status: 400 });
    }

    // Veritabanında ilk admin kullanıcıyı bul
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true
      }
    });

    if (!adminUser) {
      return new NextResponse('Veritabanında admin kullanıcı bulunamadı', { status: 500 });
    }

    console.log("Blog yazısı oluşturuluyor, authorId:", adminUser.id);
    
    // Blog yazısını oluştur
    const post = await prisma.blogPost.create({
      data: {
        title,
        content,
        excerpt,
        slug,
        imageUrl,
        published: published ?? false,
        categoryId,
        authorId: adminUser.id // Veritabanından alınan gerçek admin kullanıcı ID'si
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        imageUrl: true,
        published: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        author: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    console.log("Blog yazısı başarıyla oluşturuldu:", post);
    return NextResponse.json(post);
  } catch (error) {
    console.error('Blog yazısı oluşturma hatası:', error);
    return new NextResponse(`Sunucu hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, { status: 500 });
  }
} 