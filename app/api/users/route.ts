import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hash } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Kullanıcıları listeleme (Sadece admin)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Arama koşulları
    const where = {
      OR: search ? [
        { username: { contains: search } },
        { email: { contains: search } }
      ] : undefined
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              serviceRequests: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Kullanıcı listeleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Yeni kullanıcı oluşturma (Sadece admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { email, password, username, role } = await request.json();

    // Validasyonlar
    if (!email || !password || !username || !role) {
      return new NextResponse('Tüm alanlar zorunludur', { status: 400 });
    }

    if (password.length < 6) {
      return new NextResponse('Şifre en az 6 karakter olmalıdır', { status: 400 });
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse('Geçersiz email formatı', { status: 400 });
    }

    // Email kullanımda mı kontrolü
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return new NextResponse('Bu email adresi zaten kullanımda', { status: 400 });
      }
      if (existingUser.username === username) {
        return new NextResponse('Bu kullanıcı adı zaten kullanımda', { status: 400 });
      }
    }

    // Şifreyi hashle
    const hashedPassword = await hash(password, 12);

    // Kullanıcıyı oluştur
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 