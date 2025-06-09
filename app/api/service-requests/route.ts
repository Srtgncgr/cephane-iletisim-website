import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';
import { generateTrackingCode } from '@/app/lib/utils';

// Servis talebi oluşturma
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Oturum açmanız gerekiyor', { status: 401 });
    }

    // Debug için session nesnesini logla
    console.log('Session:', JSON.stringify(session, null, 2));

    const { 
      name,
      email,
      phone,
      address,
      deviceType, 
      brand, 
      model, 
      serialNumber,
      purchaseDate,
      problemCategory,
      problem,
      additionalNotes,
      trackingCode
    } = await request.json();

    // Validasyon
    if (!deviceType || !brand || !model || !problem || !address) {
      return new NextResponse('Tüm alanları doldurun', { status: 400 });
    }

    // User bilgilerini alın
    if (!session.user || !session.user.email) {
      return new NextResponse('Kullanıcı bilgisi bulunamadı', { status: 400 });
    }

    // Önce kullanıcıyı e-posta adresine göre bulalım
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    });

    if (!user) {
      console.error('Kullanıcı veritabanında bulunamadı:', session.user);
      return new NextResponse('Kullanıcı veritabanında bulunamadı', { status: 400 });
    }

    // Adres bilgisini kullanıcı profiline kaydet
    await prisma.user.update({
      where: { id: user.id },
      data: { address }
    });

    // Request içeriğini logla
    console.log('Request body:', { 
      userId: user.id, deviceType, brand, model, problem, trackingCode, address
    });

    try {
      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          userId: user.id, // Kullanıcı ID'sini doğrudan veritabanından alıyoruz
          deviceType,
          brand,
          model,
          problem, // problemDescription alanını problem olarak kullan
          trackingCode,
          status: 'PENDING' // enum Status tipinde bir değer
        },
        include: {
          user: {
            select: {
              username: true,
              email: true,
              address: true
            }
          }
        }
      });

      return NextResponse.json({
        ...serviceRequest,
        message: 'Servis talebi başarıyla oluşturuldu'
      });
    } catch (error: any) {
      console.error('Prisma hatası:', error);
      return new NextResponse(`Veritabanı hatası: ${error.message}`, { status: 500 });
    }
  } catch (error) {
    console.error('Servis talebi oluşturma hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Servis taleplerini listeleme
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Oturum açmanız gerekiyor', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // Limit artırıldı
    const skip = (page - 1) * limit;

    // Admin değilse sadece kendi taleplerini görebilir
    if (session.user.role !== 'ADMIN') {
      // Filtreleme koşulları
      const where = {
        ...(status && { status: status as any }),
        userId: session.user.id
      };

      const [serviceRequests, total] = await Promise.all([
        prisma.serviceRequest.findMany({
          where,
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
              take: 5
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.serviceRequest.count({ where })
      ]);

      // Her kayda tip ekle
      const formattedRequests = serviceRequests.map(req => ({
        ...req,
        type: 'registered'
      }));

      return NextResponse.json({
        serviceRequests: formattedRequests,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      });
    } 
    // Admin ise tüm talepleri görebilir (kayıtlı ve anonim)
    else {
      // Filtreleme koşulları
      const where = {
        ...(status && { status: status as any }),
      };

      // Normal servis taleplerini getir
      const [serviceRequests, total] = await Promise.all([
        prisma.serviceRequest.findMany({
          where,
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
              take: 5
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.serviceRequest.count({ where })
      ]);

      // Her kayda tip ekle
      const formattedRequests = serviceRequests.map(req => ({
        ...req,
        type: 'registered'
      }));

      // Anonim servis taleplerini getir
      let anonymousRequests = [];
      try {
        // En basit yöntemle sorgu oluştur
        const sqlQuery = `
          SELECT * FROM AnonymousServiceRequest
          ${status ? `WHERE status = '${status}'` : ''}
          ORDER BY createdAt DESC
          LIMIT ${limit} OFFSET ${skip}
        `;
        
        const anonymousResults = await prisma.$queryRawUnsafe(sqlQuery);
        
        // Tip ekle
        anonymousRequests = Array.isArray(anonymousResults) ? anonymousResults.map(req => ({
          ...req,
          type: 'anonymous',
          statusUpdates: [] // Şimdilik boş
        })) : [];
      } catch (error) {
        console.error('Anonim servis talepleri getirilirken hata oluştu:', error);
      }

      // Tüm talepleri birleştir ve tarihe göre sırala
      const allRequests = [...formattedRequests, ...anonymousRequests].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({
        serviceRequests: allRequests,
        pagination: {
          total: total + anonymousRequests.length, // Yaklaşık toplam
          pages: Math.ceil((total + anonymousRequests.length) / limit),
          currentPage: page,
          limit
        }
      });
    }
  } catch (error) {
    console.error('Servis talepleri listeleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 