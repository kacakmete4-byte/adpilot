import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { failPayment, finalizePayment } from '@/lib/payments/finalizePayment';

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
      await finalizePayment({ paymentId: merchantOid });
    } else {
      await failPayment({ paymentId: merchantOid });
    }

    return new NextResponse('OK');
  } catch (error) {
    console.error('PayTR callback error:', error);
    return new NextResponse('FAIL', { status: 500 });
  }
}
