import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// Görsel yükleme API'si
export async function POST(request: Request) {
  try {
    // Yetkilendirme kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Bu işlem için admin yetkisi gerekiyor', { status: 403 });
    }

    // Form verisini al
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('Dosya bulunamadı', { status: 400 });
    }

    // Güvenlik kontrolleri
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      return new NextResponse('Geçersiz dosya tipi. Sadece JPEG, PNG, WEBP ve GIF formatları desteklenmektedir.', { status: 400 });
    }

    // 5MB dosya boyutu kontrolü
    const fiveMB = 5 * 1024 * 1024;
    if (file.size > fiveMB) {
      return new NextResponse('Dosya boyutu 5MB\'dan büyük olamaz', { status: 400 });
    }

    // Dosyayı ArrayBuffer olarak oku
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Benzersiz bir dosya adı oluştur
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${randomUUID()}.${fileExtension}`;

    // Kaydetme klasörünü oluştur (yoksa)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Klasör oluşturma hatası:', error);
    }

    // Dosyayı kaydet
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Dosya URL'ini döndür
    const fileUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      fileName: fileName 
    });

  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 