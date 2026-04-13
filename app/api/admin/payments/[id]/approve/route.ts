import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { finalizePayment } from '@/lib/payments/finalizePayment';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!email || !adminEmail || email !== adminEmail) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    const payment = await prisma.payment.findUnique({ where: { id: params.id } });
    if (!payment) return NextResponse.json({ error: 'Ödeme bulunamadı' }, { status: 404 });
    if (payment.status === 'completed') {
      return NextResponse.json({ error: 'Zaten onaylandı' }, { status: 400 });
    }

    const updated = await finalizePayment({ id: params.id });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error) {
    console.error('Payment approve error:', error);
    return NextResponse.json({ error: 'Onaylama başarısız' }, { status: 500 });
  }
}
