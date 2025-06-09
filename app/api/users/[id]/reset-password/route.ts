import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hash } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Kullanıcı şifresini sıfırlama (Sadece admin veya kendisi)
export async function POST(
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

    // Kullanıcı kendi şifresini veya admin tüm kullanıcıların şifresini sıfırlayabilir
    if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
      return new NextResponse('Bu işlem için yetkiniz yok', { status: 403 });
    }

    const { password } = await request.json();
    
    // Şifre kontrolü
    if (!password) {
      return new NextResponse('Şifre gereklidir', { status: 400 });
    }

    if (password.length < 6) {
      return new NextResponse('Şifre en az 6 karakter olmalıdır', { status: 400 });
    }

    // Kullanıcının varlığını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return new NextResponse('Kullanıcı bulunamadı', { status: 404 });
    }

    // Şifreyi hashle
    const hashedPassword = await hash(password, 12);

    // Şifreyi güncelle
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return new NextResponse(JSON.stringify({ message: 'Şifre başarıyla sıfırlandı' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 