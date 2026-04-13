import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { failPayment, finalizePayment } from '@/lib/payments/finalizePayment';

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe webhook yapılandırması eksik' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
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
        const finalized = await finalizePayment({ stripeSessionId: session.id });

        // Stripe oturumu kayda yazılamamışsa metadata'daki payment id ile finalize et.
        if (!finalized) {
          const paymentRecordId = session.metadata?.paymentRecordId;
          if (paymentRecordId) {
            await finalizePayment({ id: paymentRecordId });
          }
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceAsAny = invoice as any;
        const paymentIntentId =
          typeof invoiceAsAny.payment_intent === 'string'
            ? invoiceAsAny.payment_intent
            : invoiceAsAny.payment_intent?.id;

        if (paymentIntentId) {
          await failPayment({ paymentId: paymentIntentId });
        }

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