import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// Hizmet detayı
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        imageUrl: true,
        price: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!service) {
      return new NextResponse('Hizmet bulunamadı', { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Hizmet detay hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Hizmet güncelleme (Sadece admin)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { title, description, shortDescription, imageUrl, price, isActive } = await request.json();

    // Validasyonlar
    if (!title || !description || !shortDescription) {
      return new NextResponse('Gerekli alanlar eksik', { status: 400 });
    }

    // Hizmeti güncelle
    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        title,
        description,
        shortDescription,
        imageUrl,
        price,
        isActive,
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        imageUrl: true,
        price: true,
        isActive: true,
        updatedAt: true
      }
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Hizmet güncelleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Hizmet silme (Sadece admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const service = await prisma.service.findUnique({
      where: { id: params.id }
    });

    if (!service) {
      return new NextResponse('Hizmet bulunamadı', { status: 404 });
    }

    await prisma.service.delete({
      where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Hizmet silme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 