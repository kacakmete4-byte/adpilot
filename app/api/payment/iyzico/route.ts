import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const Iyzipay = require('iyzipay');

type PlanKey = 'starter' | 'pro';

const PLAN_MAP: Record<PlanKey, { price: number; name: string }> = {
  starter: { price: 499, name: 'Starter Plan' },
  pro: { price: 1799, name: 'Pro Plan' },
};

function createIyzipayClient() {
  if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY || !process.env.IYZICO_BASE_URL) {
    return null;
  }

  return new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL,
  });
}

function initCheckoutForm(iyzipay: any, payload: any) {
  return new Promise<any>((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(payload, (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const iyzipay = createIyzipayClient();
    if (!iyzipay) {
      return NextResponse.json({ error: 'Iyzico yapılandırması eksik' }, { status: 500 });
    }

    if (!process.env.NEXTAUTH_URL) {
      return NextResponse.json({ error: 'NEXTAUTH_URL yapılandırması eksik' }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id as string | undefined;
    if (!sessionUserId) {
      return NextResponse.json({ error: 'Oturum doğrulanamadı' }, { status: 401 });
    }

    const { planType } = await request.json();
    const selectedPlan = PLAN_MAP[planType as PlanKey];

    if (!selectedPlan) {
      return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const conversationId = `adp-${Date.now()}-${sessionUserId}`;
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/payment/iyzico/callback`;

    const checkoutPayload = {
      locale: 'tr',
      conversationId,
      price: selectedPlan.price.toFixed(2),
      paidPrice: selectedPlan.price.toFixed(2),
      currency: 'TRY',
      basketId: `basket-${sessionUserId}-${Date.now()}`,
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: user.id,
        name: (user.name || 'Adpilot').split(' ')[0],
        surname: (user.name || 'User').split(' ').slice(1).join(' ') || 'User',
        gsmNumber: user.phone || '+905555555555',
        email: user.email,
        identityNumber: '11111111111',
        registrationAddress: 'Istanbul',
        ip: '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000',
      },
      shippingAddress: {
        contactName: user.name || 'Adpilot User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Istanbul',
        zipCode: '34000',
      },
      billingAddress: {
        contactName: user.name || 'Adpilot User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Istanbul',
        zipCode: '34000',
      },
      basketItems: [
        {
          id: `plan-${planType}`,
          name: selectedPlan.name,
          category1: 'SaaS',
          itemType: 'VIRTUAL',
          price: selectedPlan.price.toFixed(2),
        },
      ],
    };

    const initialized = await initCheckoutForm(iyzipay, checkoutPayload);

    if (!initialized || String(initialized.status).toLowerCase() !== 'success') {
      return NextResponse.json(
        { error: initialized?.errorMessage || 'Iyzico checkout başlatılamadı' },
        { status: 400 }
      );
    }

    const vatValue = Number((selectedPlan.price * 0.18).toFixed(2));
    const amountWithVatValue = Number((selectedPlan.price + vatValue).toFixed(2));
    const commissionValue = Number((selectedPlan.price * 0.1).toFixed(2));

    await prisma.payment.create({
      data: {
        userId: sessionUserId,
        amount: selectedPlan.price,
        amountWithVat: amountWithVatValue,
        vat: vatValue,
        commission: commissionValue,
        paymentMethod: 'iyzico',
        status: 'pending',
        paymentId: conversationId,
        planType,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      conversationId,
      checkoutFormContent: initialized.checkoutFormContent,
      paymentPageUrl: initialized.paymentPageUrl,
      token: initialized.token,
    });
  } catch (error) {
    console.error('Iyzico checkout error:', error);
    return NextResponse.json({ error: 'Ödeme işlemi başlatılamadı' }, { status: 500 });
  }
}
