import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hash } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Kullanıcı şifresini sıfırlama (Sadece admin veya kendisi)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { password } = await request.json();

    if (!password || password.length < 6) {
      return new NextResponse('Şifre en az 6 karakter olmalıdır', { status: 400 });
    }

    // Kendi hesabının şifresini bu şekilde sıfırlayamaz
    if (session.user.id === id) {
      return new NextResponse('Kendi şifrenizi bu şekilde sıfırlayamazsınız', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true }
    });

    if (!user) {
      return new NextResponse('Kullanıcı bulunamadı', { status: 404 });
    }

    const hashedPassword = await hash(password, 12);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    return NextResponse.json({
      message: `${user.username} kullanıcısının şifresi başarıyla sıfırlandı`
    });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 