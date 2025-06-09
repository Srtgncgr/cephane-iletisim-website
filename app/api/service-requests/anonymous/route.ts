import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

// Anonim servis talebi oluşturma
export async function POST(request: Request) {
  try {
    // Oturum kontrolü - kullanıcı zaten giriş yapmış ise normal endpoint'e yönlendir
    const session = await getServerSession(authOptions);
    if (session) {
      return new NextResponse('Giriş yapmış kullanıcılar için /api/service-requests endpoint\'i kullanılmalıdır', { status: 400 });
    }

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

    // Temel validasyon
    if (!name || !email || !phone || !address || !brand || !model || !problem) {
      return new NextResponse('Zorunlu alanları doldurun', { status: 400 });
    }

    // Direkt SQL kullanarak veritabanına kayıt ekleme
    // Prisma client otomatik generasyonu tamamlanana kadar bu geçici çözümü kullanabiliriz
    const result = await prisma.$executeRaw`
      INSERT INTO AnonymousServiceRequest (
        id, name, email, phone, address, deviceType, brand, model, 
        serialNumber, problemCategory, problem, additionalNotes,
        status, trackingCode, createdAt, updatedAt
      ) VALUES (
        ${crypto.randomUUID()}, ${name}, ${email}, ${phone}, ${address},
        ${deviceType || 'Mobil Cihaz'}, ${brand}, ${model},
        ${serialNumber || null}, ${problemCategory}, ${problem}, 
        ${additionalNotes || null}, 'PENDING', ${trackingCode},
        NOW(), NOW()
      )
    `;

    // Eklenen kaydı dön
    return NextResponse.json({ 
      success: true,
      trackingCode,
      message: 'Servis talebi başarıyla oluşturuldu' 
    });
  } catch (error) {
    console.error('Anonim servis talebi oluşturma hatası:', error);
    return new NextResponse('Servis talebi oluşturulurken bir hata oluştu', { status: 500 });
  }
} 