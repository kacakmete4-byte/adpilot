import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const PLAN_MAP = {
  starter: { price: 499, name: 'Starter Plan' },
  pro:     { price: 1799, name: 'Pro Plan' },
} as const;

function generateRef(userId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const uid = userId.slice(-4).toUpperCase();
  return `ADV-${uid}-${ts}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });
    }

    const { planType } = await request.json();
    const plan = PLAN_MAP[planType as keyof typeof PLAN_MAP];
    if (!plan) {
      return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 });
    }

    const referenceCode = generateRef(userId);
    const vat = Number((plan.price * 0.18).toFixed(2));
    const amountWithVat = Number((plan.price + vat).toFixed(2));
    const commission = Number((plan.price * 0.1).toFixed(2));

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: plan.price,
        amountWithVat,
        vat,
        commission,
        paymentMethod: 'bank_transfer',
        status: 'pending',
        paymentId: referenceCode,
        planType,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      referenceCode,
      planName: plan.name,
      amount: plan.price,
      amountWithVat,
      bankDetails: {
        bankName:     process.env.BANK_NAME     || 'Garanti BBVA',
        iban:         process.env.BANK_IBAN     || 'TR00 0006 2000 0000 0000 0000 00',
        accountName:  process.env.BANK_ACCOUNT_NAME || 'Advara Dijital Ltd.',
        description:  `${referenceCode} - ${plan.name}`,
      },
    });
  } catch (error) {
    console.error('Bank transfer error:', error);
    return NextResponse.json({ error: 'İşlem başlatılamadı' }, { status: 500 });
  }
}
