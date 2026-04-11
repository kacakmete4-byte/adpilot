import { NextRequest, NextResponse } from 'next/server';
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

    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error('Campaign list error:', error);
    return NextResponse.json({ success: false, error: 'Kampanyalar alınamadı' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await request.json();
    const formData = body?.formData;
    const suggestion = body?.suggestion;

    if (!formData?.businessName || !formData?.adGoal || !formData?.dailyBudget) {
      return NextResponse.json({ success: false, error: 'Eksik kampanya verisi' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        title: String(formData.businessName).slice(0, 120),
        content: JSON.stringify({ ad_examples: suggestion?.ad_examples || [] }),
        budget: Number(formData.dailyBudget),
        sector: String(formData.sector || ''),
        goal: String(formData.adGoal || ''),
        status: 'draft',
        aiAnalysis: JSON.stringify({ formData, suggestion }),
      },
    });

    return NextResponse.json({ success: true, campaignId: campaign.id, campaign });
  } catch (error) {
    console.error('Campaign create error:', error);
    return NextResponse.json({ success: false, error: 'Kampanya oluşturulamadı' }, { status: 500 });
  }
}
