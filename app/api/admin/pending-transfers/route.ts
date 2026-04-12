import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
