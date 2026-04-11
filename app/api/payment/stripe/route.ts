import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe yapılandırması eksik' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { planType, userId } = await request.json();

    // Plan fiyatları
    const plans = {
      starter: { price: 5000, name: 'Starter Plan' }, // 50₺ = 5000 kuruş
      pro: { price: 10000, name: 'Pro Plan' }, // 100₺ = 10000 kuruş
    };

    const plan = plans[planType as keyof typeof plans];
    if (!plan) {
      return NextResponse.json({ error: 'Geçersiz plan tipi' }, { status: 400 });
    }

    // Stripe Checkout Session oluştur
    const session = await stripe.checkout.sessions.create({
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
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/subscription?canceled=true`,
      metadata: {
        userId: userId,
        planType: planType,
      },
    });

    const amountValue = plan.price / 100; // Stripe kuruş cinsinden, biz ₺ olarak saklıyoruz
    const vatValue = Number((amountValue * 0.18).toFixed(2));
    const amountWithVatValue = Number((amountValue + vatValue).toFixed(2));
    const commissionValue = Number((amountValue * 0.1).toFixed(2));

    await prisma.payment.create({
      data: {
        userId: userId,
        amount: amountValue,
        amountWithVat: amountWithVatValue,
        vat: vatValue,
        commission: commissionValue,
        paymentMethod: 'stripe',
        status: 'pending',
        paymentId:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        stripeSessionId: session.id,
        planType: planType,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Ödeme işlemi başlatılamadı' },
      { status: 500 }
    );
  }
}