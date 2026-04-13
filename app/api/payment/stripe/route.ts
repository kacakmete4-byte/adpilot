import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXTAUTH_URL) {
      return NextResponse.json(
        { error: 'Stripe yapılandırması eksik' },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id as string | undefined;
    if (!sessionUserId) {
      return NextResponse.json({ error: 'Oturum doğrulanamadı' }, { status: 401 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { planType } = await request.json();

    // Plan fiyatları
    const plans = {
      starter: { price: 49900, name: 'Starter Plan' },
      pro: { price: 179900, name: 'Pro Plan' },
    };

    const plan = plans[planType as keyof typeof plans];
    if (!plan) {
      return NextResponse.json({ error: 'Geçersiz plan tipi' }, { status: 400 });
    }

    const amountValue = plan.price / 100; // Stripe kuruş cinsinden, biz ₺ olarak saklıyoruz
    const vatValue = Number((amountValue * 0.18).toFixed(2));
    const amountWithVatValue = Number((amountValue + vatValue).toFixed(2));
    const commissionValue = Number((amountValue * 0.1).toFixed(2));

    // Kayıt/para kaybına karşı önce ödeme kaydını açıyoruz.
    const pendingPayment = await prisma.payment.create({
      data: {
        userId: sessionUserId,
        amount: amountValue,
        amountWithVat: amountWithVatValue,
        vat: vatValue,
        commission: commissionValue,
        paymentMethod: 'stripe',
        status: 'pending',
        planType,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Stripe Checkout Session oluştur
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'try',
            product_data: {
              name: plan.name,
              description: 'ADPILOT AI Reklam Platformu Aboneliği',
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/settings?tab=billing&canceled=true`,
      metadata: {
        userId: sessionUserId,
        planType: planType,
        paymentRecordId: pendingPayment.id,
      },
    });

    await prisma.payment.update({
      where: { id: pendingPayment.id },
      data: {
        paymentId:
          typeof checkoutSession.payment_intent === 'string'
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent?.id ?? null,
        stripeSessionId: checkoutSession.id,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Ödeme işlemi başlatılamadı' },
      { status: 500 }
    );
  }
}