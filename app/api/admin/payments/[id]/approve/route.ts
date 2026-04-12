import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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

    const updated = await prisma.payment.update({
      where: { id: params.id },
      data: { status: 'completed', completedAt: new Date() },
    });

    // Subscription'ı da aktif hale getir
    if (payment.planType && payment.userId) {
      const existing = await prisma.subscription.findFirst({
        where: { userId: payment.userId },
      });
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            planType: payment.planType,
            status: 'active',
            endDate: periodEnd,
            nextBillingDate: periodEnd,
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId: payment.userId,
            planType: payment.planType,
            status: 'active',
            endDate: periodEnd,
            nextBillingDate: periodEnd,
          },
        });
      }
    }

    return NextResponse.json({ success: true, payment: updated });
  } catch (error) {
    console.error('Payment approve error:', error);
    return NextResponse.json({ error: 'Onaylama başarısız' }, { status: 500 });
  }
}
