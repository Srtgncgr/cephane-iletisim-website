import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Yetkilendirme hatası', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      select: {
        username: true,
        email: true
      }
    });

    if (!user) {
      return new NextResponse('Kullanıcı bulunamadı', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profil bilgileri alınırken hata:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 