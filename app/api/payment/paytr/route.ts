import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

type PlanKey = 'starter' | 'pro';

const PLAN_MAP: Record<PlanKey, { price: number; name: string }> = {
  starter: { price: 499, name: 'Starter Plan' },
  pro: { price: 1799, name: 'Pro Plan' },
};

function getClientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

function createPaytrToken(input: string, merchantKey: string) {
  return crypto.createHmac('sha256', merchantKey).update(input).digest('base64');
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = process.env.PAYTR_MERCHANT_ID;
    const merchantKey = process.env.PAYTR_MERCHANT_KEY;
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT;
    const baseUrl = process.env.NEXTAUTH_URL;

    if (!merchantId || !merchantKey || !merchantSalt || !baseUrl) {
      return NextResponse.json({ error: 'PayTR yapılandırması eksik' }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: 'Oturum doğrulanamadı' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const body = await request.json();
    const planType = body?.planType as PlanKey;
    const plan = PLAN_MAP[planType];
    if (!plan) {
      return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 });
    }

    const merchantOid = `paytr-${Date.now()}-${userId.slice(0, 8)}`;
    const userIp = getClientIp(request);
    const email = user.email;
    const paymentAmount = Math.round(plan.price * 100).toString();
    const basket = Buffer.from(JSON.stringify([[plan.name, paymentAmount, 1]])).toString('base64');

    const noInstallment = '0';
    const maxInstallment = '0';
    const currency = 'TL';
    const testMode = process.env.PAYTR_TEST_MODE === 'true' ? '1' : '0';
    const non3d = '0';

    const hashInput = `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${basket}${noInstallment}${maxInstallment}${currency}${testMode}${non3d}`;
    const paytrToken = createPaytrToken(`${hashInput}${merchantSalt}`, merchantKey);

    const vat = Number((plan.price * 0.18).toFixed(2));
    const amountWithVat = Number((plan.price + vat).toFixed(2));
    const commission = Number((plan.price * 0.1).toFixed(2));

    await prisma.payment.create({
      data: {
        userId,
        amount: plan.price,
        amountWithVat,
        vat,
        commission,
        paymentMethod: 'paytr',
        status: 'pending',
        paymentId: merchantOid,
        planType,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const callbackUrl = `${baseUrl}/api/payment/paytr/callback`;
    const successUrl = `${baseUrl}/dashboard?success=true`;
    const failUrl = `${baseUrl}/dashboard/settings?tab=billing&canceled=true`;

    const formPayload = new URLSearchParams({
      merchant_id: merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email,
      payment_amount: paymentAmount,
      paytr_token: paytrToken,
      user_basket: basket,
      debug_on: testMode,
      no_installment: noInstallment,
      max_installment: maxInstallment,
      user_name: user.name || user.email,
      user_address: user.businessName || 'Istanbul',
      user_phone: user.phone || '05000000000',
      merchant_ok_url: successUrl,
      merchant_fail_url: failUrl,
      timeout_limit: '30',
      currency,
      test_mode: testMode,
      non_3d: non3d,
      callback_url: callbackUrl,
      lang: 'tr',
    });

    const tokenResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formPayload,
      cache: 'no-store',
    });

    const tokenData = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok || tokenData?.status !== 'success' || !tokenData?.token) {
      await prisma.payment.updateMany({
        where: { paymentId: merchantOid },
        data: { status: 'failed' },
      });
      return NextResponse.json(
        { error: tokenData?.reason || 'PayTR token alınamadı' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      token: tokenData.token,
      iframeUrl: `https://www.paytr.com/odeme/guvenli/${tokenData.token}`,
      merchantOid,
    });
  } catch (error) {
    console.error('PayTR init error:', error);
    return NextResponse.json({ error: 'PayTR ödeme başlatılamadı' }, { status: 500 });
  }
}
