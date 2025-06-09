import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';

type Status = 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

type StatusUpdate = {
  status: Status;
  note: string | null;
  createdAt: Date;
};

type ServiceRequest = {
  deviceType: string;
  brand: string;
  model: string;
  problem: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
  statusUpdates: StatusUpdate[];
};

// Takip kodu ile servis talebi sorgulama
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: {
        trackingCode: params.code
      },
      select: {
        deviceType: true,
        brand: true,
        model: true,
        problem: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        statusUpdates: {
          orderBy: {
            createdAt: 'desc'
          },
          select: {
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

    // Durumu Türkçeleştir
    const statusMessages: Record<Status, string> = {
      PENDING: 'Beklemede',
      APPROVED: 'Onaylandı',
      IN_PROGRESS: 'İşlemde',
      COMPLETED: 'Tamamlandı',
      REJECTED: 'Reddedildi'
    };

    return NextResponse.json({
      ...serviceRequest,
      statusText: statusMessages[serviceRequest.status as Status],
      statusUpdates: serviceRequest.statusUpdates.map((update: StatusUpdate) => ({
        ...update,
        statusText: statusMessages[update.status]
      }))
    });
  } catch (error) {
    console.error('Servis talebi sorgulama hatası:', error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
} 