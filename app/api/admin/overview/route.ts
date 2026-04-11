import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const [
      totalUsers,
      totalCampaigns,
      totalTickets,
      completedPayments,
      recentUsers,
      recentPayments,
      recentTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.campaign.count(),
      prisma.supportTicket.count(),
      prisma.payment.findMany({ where: { status: 'completed' } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          amountWithVat: true,
          amount: true,
          commission: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.supportTicket.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          name: true,
          email: true,
          subject: true,
          status: true,
          category: true,
          createdAt: true,
        },
      }),
    ]);

    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amountWithVat || p.amount || 0), 0);
    const totalCommission = completedPayments.reduce((sum, p) => sum + (p.commission || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalCampaigns,
        totalTickets,
        totalRevenue,
        totalCommission,
      },
      recentUsers,
      recentPayments,
      recentTickets,
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ success: false, error: 'Admin verileri alınamadı' }, { status: 500 });
  }
}
