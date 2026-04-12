import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

function hmacBase64(input: string, key: string) {
  return crypto.createHmac('sha256', key).update(input).digest('base64');
}

export async function POST(request: NextRequest) {
  try {
    const merchantKey = process.env.PAYTR_MERCHANT_KEY;
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchantKey || !merchantSalt) {
      return new NextResponse('FAIL', { status: 500 });
    }

    const raw = await request.text();
    const form = new URLSearchParams(raw);

    const merchantOid = form.get('merchant_oid') || '';
    const status = form.get('status') || '';
    const totalAmount = form.get('total_amount') || '';
    const receivedHash = form.get('hash') || '';

    const expectedHash = hmacBase64(`${merchantOid}${merchantSalt}${status}${totalAmount}`, merchantKey);
    if (!merchantOid || !receivedHash || expectedHash !== receivedHash) {
      return new NextResponse('FAIL', { status: 400 });
    }

    if (status === 'success') {
      await prisma.payment.updateMany({
        where: { paymentId: merchantOid },
        data: { status: 'completed', completedAt: new Date() },
      });

      const payment = await prisma.payment.findFirst({ where: { paymentId: merchantOid } });
      if (payment) {
        const activeUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.subscription.upsert({
          where: { userId: payment.userId },
          update: {
            planType: payment.planType ?? 'starter',
            status: 'active',
            startDate: new Date(),
            endDate: activeUntil,
            nextBillingDate: activeUntil,
            autoRenew: true,
          },
          create: {
            userId: payment.userId,
            planType: payment.planType ?? 'starter',
            status: 'active',
            startDate: new Date(),
            endDate: activeUntil,
            nextBillingDate: activeUntil,
            autoRenew: true,
          },
        });
      }
    } else {
      await prisma.payment.updateMany({
        where: { paymentId: merchantOid },
        data: { status: 'failed' },
      });
    }

    return new NextResponse('OK');
  } catch (error) {
    console.error('PayTR callback error:', error);
    return new NextResponse('FAIL', { status: 500 });
  }
}
