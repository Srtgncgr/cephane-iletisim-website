import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Admin ayarlarını getir (Sadece admin)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const settings = await prisma.setting.findMany({
      select: {
        key: true,
        value: true,
        description: true,
        updatedAt: true
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Ayarları getirme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Admin ayarlarını güncelle (Sadece admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const settings = await request.json();

    if (!Array.isArray(settings)) {
      return new NextResponse('Geçersiz veri formatı', { status: 400 });
    }

    // Tüm ayarları paralel olarak güncelle
    const updates = settings.map(({ key, value, description }) =>
      prisma.setting.upsert({
        where: { key },
        update: {
          value,
          description,
          updatedAt: new Date()
        },
        create: {
          key,
          value,
          description
        }
      })
    );

    await prisma.$transaction(updates);

    const updatedSettings = await prisma.setting.findMany({
      select: {
        key: true,
        value: true,
        description: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Ayarları güncelleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 