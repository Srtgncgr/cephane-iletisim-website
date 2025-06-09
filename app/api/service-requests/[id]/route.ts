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

// Servis talebi detaylarını getirme
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Oturum açmanız gerekiyor', { status: 401 });
    }

    const { type, record } = await determineRecordType(params.id);
    
    if (type === 'unknown' || !record) {
      return new NextResponse('Servis talebi bulunamadı', { status: 404 });
    }

    if (type === 'registered') {
      // Normal servis talebi için detayları getir
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: params.id },
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          },
          statusUpdates: {
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              serviceRequest: true
            }
          }
        }
      });

      if (!serviceRequest) {
        return new NextResponse('Servis talebi bulunamadı', { status: 404 });
      }

      // Kullanıcı yetkisi kontrolü
      if (session.user.role !== 'ADMIN' && serviceRequest.userId !== session.user.id) {
        return new NextResponse('Bu işlem için yetkiniz yok', { status: 403 });
      }

      return NextResponse.json({
        ...serviceRequest,
        type: 'registered'
      });
    } else {
      // Anonim servis talebi için sadece admin erişebilir
      if (session.user.role !== 'ADMIN') {
        return new NextResponse('Bu işlem için yetkiniz yok', { status: 403 });
      }

      // SQL ile tam detayları getir
      const sqlQuery = `
        SELECT * FROM AnonymousServiceRequest
        WHERE id = '${params.id}'
        LIMIT 1
      `;
      
      const anonymousResults = await prisma.$queryRawUnsafe(sqlQuery);
      
      if (!Array.isArray(anonymousResults) || anonymousResults.length === 0) {
        return new NextResponse('Servis talebi bulunamadı', { status: 404 });
      }

      return NextResponse.json({
        ...anonymousResults[0],
        type: 'anonymous',
        statusUpdates: [] // Şimdilik boş
      });
    }
  } catch (error) {
    console.error('Servis talebi detay hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Servis talebi güncelleme
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Oturum açmanız gerekiyor', { status: 401 });
    }

    const { status, note } = await request.json();

    // Admin değilse güncelleme yapamaz
    if (session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { type, record } = await determineRecordType(params.id);
    
    if (type === 'unknown' || !record) {
      return new NextResponse('Servis talebi bulunamadı', { status: 404 });
    }

    if (type === 'registered') {
      // Normal servis talebi için durum güncellemesi
      // Durum güncellemesi oluştur
      const statusUpdate = await prisma.statusUpdate.create({
        data: {
          serviceRequestId: params.id,
          status,
          note
        }
      });

      // Servis talebinin durumunu güncelle
      const updatedServiceRequest = await prisma.serviceRequest.update({
        where: { id: params.id },
        data: { status },
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          },
          statusUpdates: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });

      return NextResponse.json({
        serviceRequest: {
          ...updatedServiceRequest,
          type: 'registered'
        },
        statusUpdate
      });
    } else {
      // Anonim servis talebi için durum güncellemesi
      try {
        // SQL ile güncelle
        const updateQuery = `
          UPDATE AnonymousServiceRequest
          SET status = '${status}', updatedAt = NOW()
          WHERE id = '${params.id}'
        `;
        
        await prisma.$executeRawUnsafe(updateQuery);

        // Güncellenmiş kaydı getir
        const selectQuery = `
          SELECT * FROM AnonymousServiceRequest
          WHERE id = '${params.id}'
          LIMIT 1
        `;
        
        const anonymousResults = await prisma.$queryRawUnsafe(selectQuery);

        if (!Array.isArray(anonymousResults) || anonymousResults.length === 0) {
          return new NextResponse('Güncelleme sonrası kayıt bulunamadı', { status: 500 });
        }

        return NextResponse.json({
          serviceRequest: {
            ...anonymousResults[0],
            type: 'anonymous'
          },
          statusUpdate: {
            id: 'anonymous-update',
            status,
            note,
            createdAt: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Anonim servis talebi güncelleme hatası:', error);
        return new NextResponse('Güncelleme işlemi sırasında bir hata oluştu', { status: 500 });
      }
    }
  } catch (error) {
    console.error('Servis talebi güncelleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Servis talebi silme (Sadece admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Oturum açmanız gerekiyor', { status: 401 });
    }

    // Admin değilse silme yapamaz
    if (session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    const { type, record } = await determineRecordType(params.id);
    
    if (type === 'unknown' || !record) {
      return new NextResponse('Servis talebi bulunamadı', { status: 404 });
    }

    if (type === 'registered') {
      // Normal servis talebi silme
      // İlişkili kayıtları ve servis talebini sil
      await prisma.$transaction([
        prisma.statusUpdate.deleteMany({
          where: { serviceRequestId: params.id }
        }),
        prisma.serviceRequest.delete({
          where: { id: params.id }
        })
      ]);
    } else {
      // Anonim servis talebi silme
      try {
        // SQL ile sil
        const deleteQuery = `
          DELETE FROM AnonymousServiceRequest
          WHERE id = '${params.id}'
        `;
        
        await prisma.$executeRawUnsafe(deleteQuery);
      } catch (error) {
        console.error('Anonim servis talebi silme hatası:', error);
        return new NextResponse('Silme işlemi sırasında bir hata oluştu', { status: 500 });
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Servis talebi silme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 