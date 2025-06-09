import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// Servis detayı
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!service) {
      return new NextResponse('Servis bulunamadı', { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Servis detay hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Servis güncelleme (Sadece admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { name, description, price, duration, isActive } = await request.json();

    // Validasyonlar
    if (!name) {
      return new NextResponse('Servis adı gereklidir', { status: 400 });
    }

    if (price && (isNaN(price) || price < 0)) {
      return new NextResponse('Geçerli bir fiyat giriniz', { status: 400 });
    }

    if (duration && (isNaN(duration) || duration < 1)) {
      return new NextResponse('Geçerli bir süre giriniz', { status: 400 });
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        title: name,
        description,
        price: price ? parseFloat(price) : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        isActive: true
      }
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Servis güncelleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Servis silme (Sadece admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    // Service silme kontrolü (şimdilik basit kontrol)

    await prisma.service.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Servis silme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 