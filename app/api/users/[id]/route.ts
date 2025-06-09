import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hash } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Kullanıcı detaylarını getirme
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Params değerlerini hemen kullanmak için yerel değişkenlere aktaralım
    const userId = params.id;
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Oturum açmanız gerekiyor', { status: 401 });
    }

    // Kullanıcı kendi bilgilerini veya admin tüm kullanıcıları görebilir
    if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
      return new NextResponse('Bu işlem için yetkiniz yok', { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        serviceRequests: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
          select: {
            id: true,
            deviceType: true,
            brand: true,
            model: true,
            status: true,
            createdAt: true
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
  { params }: { params: { id: string } }
) {
  try {
    // Params değerlerini hemen kullanmak için yerel değişkenlere aktaralım
    const userId = params.id;
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Oturum açmanız gerekiyor', { status: 401 });
    }

    // Kullanıcı kendi bilgilerini veya admin tüm kullanıcıları güncelleyebilir
    if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
      return new NextResponse('Bu işlem için yetkiniz yok', { status: 403 });
    }

    const data = await request.json();
    const { username, email, password, role } = data;
    console.log("API'ye gelen veriler:", data);

    // Rol değişikliğini sadece admin yapabilir
    if (role && session.user.role !== 'ADMIN') {
      return new NextResponse('Rol değişikliği için admin yetkisi gerekiyor', { status: 403 });
    }

    // Email değişikliği varsa, kullanımda mı kontrol et
    if (email || username) {
      // Email formatı kontrolü
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return new NextResponse('Geçersiz email formatı', { status: 400 });
        }
      }

      // Aynı anda hem e-posta hem de kullanıcı adı kontrolü yapalım
      const whereConditions = [];
      if (email) whereConditions.push({ email });
      if (username) whereConditions.push({ username });

      if (whereConditions.length > 0) {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: whereConditions,
            NOT: {
              id: userId
            }
          }
        });

        if (existingUser) {
          if (email && existingUser.email === email) {
            return new NextResponse('Bu email adresi zaten kullanımda', { status: 400 });
          }
          if (username && existingUser.username === username) {
            return new NextResponse('Bu kullanıcı adı zaten kullanımda', { status: 400 });
          }
        }
      }
    }

    // Güncellenecek alanları hazırla
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) {
      if (password.length < 6) {
        return new NextResponse('Şifre en az 6 karakter olmalıdır', { status: 400 });
      }
      updateData.password = await hash(password, 12);
    }
    if (role && session.user.role === 'ADMIN') updateData.role = role;

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true
        }
      });

      return NextResponse.json(user);
    } catch (prismaError) {
      console.error('Prisma hatası:', prismaError);
      return new NextResponse(`Veritabanı hatası: ${(prismaError as Error).message}`, { status: 400 });
    }
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    
    // Prisma hatası kontrolü
    if (error && typeof error === 'object' && 'code' in error) {
      // Unique constraint hatası (duplicate key)
      if (error.code === 'P2002') {
        return new NextResponse('Bu email adresi veya kullanıcı adı zaten kullanımda', { status: 400 });
      }
    }
    
    return new NextResponse('Sunucu hatası: ' + (error as Error).message, { status: 500 });
  }
}

// Kullanıcı silme (Sadece admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Params değerlerini hemen kullanmak için yerel değişkenlere aktaralım
    const userId = params.id;
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    // Admin kendini silemesin
    if (session.user.id === userId) {
      return new NextResponse('Admin kendisini silemez', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return new NextResponse('Kullanıcı bulunamadı', { status: 404 });
    }

    // İlişkili kayıtları ve kullanıcıyı sil
    await prisma.$transaction([
      prisma.statusUpdate.deleteMany({
        where: {
          serviceRequest: {
            userId: userId
          }
        }
      }),
      prisma.serviceRequest.deleteMany({
        where: { userId: userId }
      }),
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 