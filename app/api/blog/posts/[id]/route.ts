import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Blog yazısı detayı
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        slug: true,
        imageUrl: true,
        published: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
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

    if (!post) {
      return new NextResponse('Blog yazısı bulunamadı', { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Blog yazısı getirme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Blog yazısı güncelleme (Sadece admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { title, content, excerpt, slug, imageUrl, categoryId, published } = await request.json();
    const { id } = await params;

    // Mevcut blog yazısını al
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return new NextResponse('Blog yazısı bulunamadı', { status: 404 });
    }

    // Eğer sadece published alanı gönderilmişse, diğer alanları mevcut değerlerle doldur
    const updateData = {
      title: title || existingPost.title,
      content: content || existingPost.content,
      excerpt: excerpt || existingPost.excerpt,
      slug: slug || existingPost.slug,
      imageUrl: imageUrl !== undefined ? imageUrl : existingPost.imageUrl,
      categoryId: categoryId || existingPost.categoryId,
      published: published !== undefined ? published : existingPost.published,
      updatedAt: new Date()
    };

    // Validasyonlar (sadece gönderilen alanlar için)
    if (title && !title.trim()) {
      return new NextResponse('Başlık boş olamaz', { status: 400 });
    }
    if (content && !content.trim()) {
      return new NextResponse('İçerik boş olamaz', { status: 400 });
    }

    // Slug kontrolü (sadece slug gönderilmişse ve kendi ID'si hariç)
    if (slug && slug !== existingPost.slug) {
      const slugCheck = await prisma.blogPost.findFirst({
        where: {
          slug,
          NOT: {
            id
          }
        }
      });

      if (slugCheck) {
        return new NextResponse('Bu URL adresi zaten kullanımda', { status: 400 });
      }
    }

    // Blog yazısını güncelle
    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        slug: true,
        imageUrl: true,
        published: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
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

    return NextResponse.json(post);
  } catch (error) {
    console.error('Blog yazısı güncelleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Blog yazısı silme (Sadece admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!post) {
      return new NextResponse('Blog yazısı bulunamadı', { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Blog yazısı silme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 