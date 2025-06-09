import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// ID'nin anonim kayıt mı yoksa normal kayıt mı olduğunu belirleme
const determineRecordType = async (id: string) => {
  // Önce normal servis taleplerinde ara
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id }
  });

  if (serviceRequest) {
    return { type: 'registered', record: serviceRequest };
  }

  // Anonim servis taleplerinde ara
  try {
    const sqlQuery = `
      SELECT * FROM AnonymousServiceRequest
      WHERE id = '${id}'
      LIMIT 1
    `;
    
    const anonymousResults = await prisma.$queryRawUnsafe(sqlQuery);
    
    if (Array.isArray(anonymousResults) && anonymousResults.length > 0) {
      return { type: 'anonymous', record: anonymousResults[0] };
    }
  } catch (error) {
    console.error('Anonim servis talebi arama hatası:', error);
  }

  return { type: 'unknown', record: null };
};

// Servis talebi detayı
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse('Oturum açmanız gerekiyor', { status: 401 });
    }

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        statusUpdates: {
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            status: true,
            note: true,
            createdAt: true
          }
        }
      }
    });

    if (!serviceRequest) {
      return new NextResponse('Servis talebi bulunamadı', { status: 404 });
    }

    // Kullanıcı sadece kendi taleplerini veya admin tüm talepleri görebilir
    if (session.user.role !== 'ADMIN' && serviceRequest.userId !== session.user.id) {
      return new NextResponse('Bu talebi görme yetkiniz yok', { status: 403 });
    }

    return NextResponse.json(serviceRequest);
  } catch (error) {
    console.error('Servis talebi detay hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Servis talebi güncelleme (Sadece admin)
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

    const { status, note } = await request.json();

    if (!status) {
      return new NextResponse('Durum bilgisi gereklidir', { status: 400 });
    }

    const validStatuses = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return new NextResponse('Geçersiz durum', { status: 400 });
    }

    // Hangi tür talep olduğunu belirle
    const { type, record } = await determineRecordType(id);
    
    if (!record) {
      return new NextResponse('Servis talebi bulunamadı', { status: 404 });
    }

    // Talep türüne göre güncelleme yap
    if (type === 'registered') {
      // Kayıtlı kullanıcı talebi güncelleme
      const updatedRequest = await prisma.$transaction(async (prisma) => {
        // Servis talebini güncelle
        const updated = await prisma.serviceRequest.update({
          where: { id },
          data: { 
            status,
            updatedAt: new Date()
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        });

        // Durum güncellemesi ekle
        const statusUpdate = await prisma.statusUpdate.create({
          data: {
            serviceRequestId: id,
            status,
            note: note || '',
            createdAt: new Date()
          }
        });

        return { request: updated, statusUpdate };
      });

      return NextResponse.json({
        serviceRequest: updatedRequest.request,
        statusUpdate: updatedRequest.statusUpdate
      });
    } else if (type === 'anonymous') {
      // Anonim kullanıcı talebi güncelleme
      try {
        const updateQuery = `
          UPDATE AnonymousServiceRequest 
          SET status = '${status}', updatedAt = NOW() 
          WHERE id = '${id}'
        `;
        
        await prisma.$executeRawUnsafe(updateQuery);

        // Anonim talepler için de status update tablosuna kayıt eklemeyi deneyelim
        try {
          const statusUpdate = await prisma.statusUpdate.create({
            data: {
              serviceRequestId: id,
              status,
              note: note || '',
              createdAt: new Date()
            }
          });
          
          return NextResponse.json({
            serviceRequest: { ...record, status, updatedAt: new Date() },
            statusUpdate
          });
        } catch (statusUpdateError) {
          console.log('Anonim talep için status update oluşturulamadı, devam ediliyor...');
          return NextResponse.json({
            serviceRequest: { ...record, status, updatedAt: new Date() }
          });
        }
      } catch (error) {
        console.error('Anonim servis talebi güncelleme hatası:', error);
        return new NextResponse('Anonim servis talebi güncellenirken hata oluştu', { status: 500 });
      }
    }

    return new NextResponse('Bilinmeyen servis talebi türü', { status: 400 });
  } catch (error) {
    console.error('Servis talebi güncelleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Servis talebi silme (Sadece admin)
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

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!serviceRequest) {
      return new NextResponse('Servis talebi bulunamadı', { status: 404 });
    }

    // İlişkili durum güncellemelerini de sil
    await prisma.$transaction([
      prisma.statusUpdate.deleteMany({
        where: { serviceRequestId: id }
      }),
      prisma.serviceRequest.delete({
        where: { id }
      })
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Servis talebi silme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 