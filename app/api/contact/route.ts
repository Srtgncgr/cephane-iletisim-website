import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';

// Form validasyon şeması
const contactFormSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  subject: z.string().min(5, 'Konu en az 5 karakter olmalıdır'),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır')
});

export async function POST(request: Request) {
  try {
    const { name, email, phone, subject, message } = await request.json();

    // Validasyonlar
    if (!name || !email || !message) {
      return new NextResponse('Gerekli alanlar eksik', { status: 400 });
    }

    // İletişim mesajını oluştur
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject: subject || 'İletişim Formu',
        message,
        read: false
      }
    });

    return NextResponse.json({ success: true, id: contactMessage.id });
  } catch (error) {
    console.error('İletişim mesajı kaydetme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// Admin paneli için mesajları listeleme endpoint'i
export async function GET() {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(messages);
    
  } catch (error) {
    console.error('Mesaj listeleme hatası:', error);
    return NextResponse.json({
      message: 'Mesajlar alınamadı'
    }, { status: 500 });
  }
} 