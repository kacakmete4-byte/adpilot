import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
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

    // Veritabanına payment kaydı oluştur
    await prisma.payment.create({
      data: {
        userId: userId,
        amount: plan.price / 100, // Stripe kuruş cinsinden, biz ₺ olarak saklıyoruz
        currency: 'TRY',
        status: 'pending',
        stripeSessionId: session.id,
        planType: planType,
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