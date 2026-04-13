import { NextRequest, NextResponse } from 'next/server';
import { failPayment, finalizePayment } from '@/lib/payments/finalizePayment';

const Iyzipay = require('iyzipay');

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

function retrieveCheckoutForm(iyzipay: any, payload: any) {
  return new Promise<any>((resolve, reject) => {
    iyzipay.checkoutForm.retrieve(payload, (err: any, result: any) => {
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

    const form = await request.formData();
    const token = form.get('token')?.toString();
    const conversationId = form.get('conversationId')?.toString();

    if (!token) {
      return NextResponse.json({ error: 'Token bulunamadı' }, { status: 400 });
    }

    const retrieved = await retrieveCheckoutForm(iyzipay, {
      locale: 'tr',
      conversationId: conversationId || '',
      token,
    });

    const paymentStatus = String(retrieved?.paymentStatus || '').toUpperCase();
    const retrievedConversationId = retrieved?.conversationId || conversationId || null;

    if (paymentStatus === 'SUCCESS' && retrievedConversationId) {
      await finalizePayment({ paymentId: retrievedConversationId });

      const successUrl = `${process.env.NEXTAUTH_URL || 'https://advara.vercel.app'}/dashboard?success=true`;
      return NextResponse.redirect(successUrl);
    }

    if (retrievedConversationId) {
      await failPayment({ paymentId: retrievedConversationId });
    }

    const failedUrl = `${process.env.NEXTAUTH_URL || 'https://advara.vercel.app'}/dashboard/subscription?canceled=true`;
    return NextResponse.redirect(failedUrl);
  } catch (error) {
    console.error('Iyzico callback error:', error);
    return NextResponse.json({ error: 'Callback işlenemedi' }, { status: 500 });
  }
}
