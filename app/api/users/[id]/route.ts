import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hash } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Kullanıcı detaylarını getirme
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            serviceRequests: true,
            blogPosts: true
          }
        }
      }
    });

    if (!user) {
      return new NextResponse('Kullanıcı bulunamadı', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Kullanıcı detay hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Kullanıcı güncelleme
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { username, email, role, password } = await request.json();

    // Email kontrolü (kendi ID'si hariç)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id
          }
        }
      });

      if (existingUser) {
        return new NextResponse('Bu e-posta adresi zaten kullanımda', { status: 400 });
      }
    }

    // Username kontrolü (kendi ID'si hariç)
    if (username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username,
          NOT: {
            id
          }
        }
      });

      if (existingUsername) {
        return new NextResponse('Bu kullanıcı adı zaten kullanımda', { status: 400 });
      }
    }

    // Güncelleme verilerini hazırla
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Kullanıcı silme (Sadece admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    // Kendi hesabını silemez
    if (session.user.id === id) {
      return new NextResponse('Kendi hesabınızı silemezsiniz', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            serviceRequests: true,
            blogPosts: true
          }
        }
      }
    });

    if (!user) {
      return new NextResponse('Kullanıcı bulunamadı', { status: 404 });
    }

    // İlişkili veriler varsa silmeyi engelle
    if (user._count.serviceRequests > 0 || user._count.blogPosts > 0) {
      return new NextResponse('Bu kullanıcıya ait veriler olduğu için hesap silinemez', { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

 