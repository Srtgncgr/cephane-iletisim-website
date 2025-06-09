import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// İletişim mesajlarını listeleme (Sadece admin)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const messages = await prisma.contactMessage.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('İletişim mesajları listeleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 