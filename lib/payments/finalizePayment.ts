import { prisma } from '@/lib/prisma';

type PaymentLookup = {
  id?: string;
  paymentId?: string;
  stripeSessionId?: string;
};

function buildWhereClause(lookup: PaymentLookup) {
  const clauses = [] as Array<Record<string, string>>;
  if (lookup.id) clauses.push({ id: lookup.id });
  if (lookup.paymentId) clauses.push({ paymentId: lookup.paymentId });
  if (lookup.stripeSessionId) clauses.push({ stripeSessionId: lookup.stripeSessionId });

  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0];
  return { OR: clauses };
}

function generateInvoiceNo(paymentId: string) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const suffix = paymentId.slice(-6).toUpperCase();
  return `INV-${y}${m}${day}-${suffix}`;
}

async function activateSubscription(userId: string, planType?: string | null) {
  const activeUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      planType: planType ?? 'starter',
      status: 'active',
      startDate: new Date(),
      endDate: activeUntil,
      nextBillingDate: activeUntil,
      autoRenew: true,
    },
    create: {
      userId,
      planType: planType ?? 'starter',
      status: 'active',
      startDate: new Date(),
      endDate: activeUntil,
      nextBillingDate: activeUntil,
      autoRenew: true,
    },
  });
}

export async function finalizePayment(lookup: PaymentLookup) {
  const where = buildWhereClause(lookup);
  if (!where) return null;

  const payment = await prisma.payment.findFirst({ where });
  if (!payment) return null;

  const invoiceNo = payment.invoiceNo || generateInvoiceNo(payment.id);
  const issuedDate = payment.issuedDate || new Date();

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'completed',
      completedAt: payment.completedAt || new Date(),
      invoiceNo,
      issuedDate,
    },
  });

  await activateSubscription(updated.userId, updated.planType);
  return updated;
}

export async function failPayment(lookup: PaymentLookup) {
  const where = buildWhereClause(lookup);
  if (!where) return null;

  const payment = await prisma.payment.findFirst({ where });
  if (!payment) return null;

  return prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'failed' },
  });
}
