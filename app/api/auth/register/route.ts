import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    // Validasyonlar
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır' }, { status: 400 });
    }

    // Kullanıcı adı validasyonu
    if (username.length < 3) {
      return NextResponse.json({ error: 'Kullanıcı adı en az 3 karakter olmalıdır' }, { status: 400 });
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ error: 'Kullanıcı adı sadece harf, rakam, alt çizgi ve tire içerebilir' }, { status: 400 });
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Geçersiz email formatı' }, { status: 400 });
    }

    // Email ve kullanıcı adı kullanımda mı kontrolü
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'Bu email adresi zaten kullanımda' }, { status: 400 });
      }
      if (existingUser.username === username) {
        return NextResponse.json({ error: 'Bu kullanıcı adı zaten kullanımda' }, { status: 400 });
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
        role: 'USER'
      }
    });

    // Hassas bilgileri çıkar
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Kayıt başarılı',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    
    // Prisma hata kontrolü
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Bu email adresi veya kullanıcı adı zaten kullanımda' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
} 