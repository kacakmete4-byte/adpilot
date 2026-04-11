import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Payment'ı güncelle
        await prisma.payment.updateMany({
          where: { stripeSessionId: session.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });

        // User'ın subscription'ını güncelle
        const payment = await prisma.payment.findFirst({
          where: { stripeSessionId: session.id },
        });

        if (payment) {
          const activeUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 gün

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

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        // TODO: Subscription failed payment handling
        // Subscription ID'si invoice objesinde farklı bir yerde olabilir
        console.log('Invoice payment failed:', invoice.id);

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }
}