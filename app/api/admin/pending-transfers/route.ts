import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!email || !adminEmail || email !== adminEmail) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      where: { paymentMethod: 'bank_transfer', status: 'pending' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Pending transfers error:', error);
    return NextResponse.json({ error: 'Sorgu başarısız' }, { status: 500 });
  }
}
