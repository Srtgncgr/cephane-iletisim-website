import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingCode = searchParams.get('code');

    if (!trackingCode) {
      return new NextResponse('Takip kodu gerekli', { status: 400 });
    }

    // Genel servis adresi (varsayılan olarak sabit)
    const serviceAddress = process.env.SERVICE_ADDRESS || 'Teknik Servis Merkezi, Atatürk Cad. No:123, 34000 İstanbul';
    
    // Önce normal servis taleplerinde ara
    let serviceRequest = await prisma.serviceRequest.findUnique({
      where: { trackingCode },
      include: {
        statusUpdates: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    // ServiceRequest'te bulunduysa
    if (serviceRequest) {
      // Hassas bilgileri çıkar
      const { userId, user, ...safeServiceRequest } = serviceRequest as any;
      
      return NextResponse.json({
        ...safeServiceRequest,
        username: user?.username,
        type: 'registered',
        serviceAddress: serviceRequest.status === 'APPROVED' ? serviceAddress : null,
        // Müşteri adresi şu anda veritabanında olmadığından, şema güncellemesi yapıldıktan sonra kullanılacak
        customerAddress: null
      });
    }

    // ServiceRequest'te bulunamadıysa AnonymousServiceRequest'te ara
    try {
      // SQL ile doğrudan sorgula
      const sqlQuery = `
        SELECT * FROM AnonymousServiceRequest 
        WHERE trackingCode = '${trackingCode}'
        LIMIT 1
      `;
      
      const anonymousResults = await prisma.$queryRawUnsafe(sqlQuery);
      
      const anonymousServiceRequest = Array.isArray(anonymousResults) && anonymousResults.length > 0 
        ? anonymousResults[0] 
        : null;

      if (anonymousServiceRequest) {
        return NextResponse.json({
          ...anonymousServiceRequest,
          type: 'anonymous',
          statusUpdates: [], // Anonim servis taleplerinde şimdilik status update yok
          serviceAddress: anonymousServiceRequest.status === 'APPROVED' ? serviceAddress : null,
          // Anonim talepler için iletişim bilgileri içerisinde adres yok, şema güncellemesi yapılabilir
          customerAddress: null
        });
      }
    } catch (error) {
      console.error('Anonim servis talebi arama hatası:', error);
    }

    // Hiçbir tabloda bulunamadıysa
    return new NextResponse('Servis talebi bulunamadı', { status: 404 });
  } catch (error) {
    console.error('Servis talebi sorgulama hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 