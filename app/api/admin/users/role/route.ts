import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Admin yetkisi kontrolü
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Yetkisiz erişim', { status: 403 });
    }

    const { userId, newRole } = await request.json();

    // Geçerli rol kontrolü
    if (!['USER', 'ADMIN'].includes(newRole)) {
      return new NextResponse('Geçersiz rol', { status: 400 });
    }

    // Kullanıcının kendisini güncellemesini engelle
    if (userId === session.user.id) {
      return new NextResponse('Kendi rolünüzü değiştiremezsiniz', { status: 400 });
    }

    // Rolü güncelle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Rol güncelleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 