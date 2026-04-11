import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Profile get error:', error);
    return NextResponse.json({ success: false, error: 'Profil getirilemedi' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const businessName = String(body?.company || '').trim();
    const phone = String(body?.phone || '').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Ad soyad zorunludur' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        businessName: businessName || null,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        phone: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, error: 'Profil güncellenemedi' }, { status: 500 });
  }
}
