import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

type Platform = 'meta' | 'google' | 'instagram' | 'tiktok' | 'youtube';
type Goal = 'awareness' | 'traffic' | 'leads' | 'sales' | 'engagement' | 'appInstalls' | '';

type CampaignProjection = {
  id: string;
  title: string;
  platform: Platform;
  status: 'draft' | 'active' | 'paused' | 'completed';
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  createdAt: Date;
};

function asGoal(value: string | null | undefined): Goal {
  const allowed = ['awareness', 'traffic', 'leads', 'sales', 'engagement', 'appInstalls'];
  return allowed.includes(String(value)) ? (value as Goal) : '';
}

function roasByGoal(goal: Goal) {
  const map: Record<Goal, number> = {
    awareness: 2.1,
    traffic: 2.7,
    leads: 3.2,
    sales: 3.8,
    engagement: 2.4,
    appInstalls: 2.9,
    '': 2.8,
  };

  return map[goal] || 2.8;
}

function statusMultiplier(status: string) {
  if (status === 'active') return 1;
  if (status === 'completed') return 1.05;
  if (status === 'paused') return 0.45;
  return 0.2;
}

function safePlatform(platforms: unknown): Platform {
  const first = Array.isArray(platforms) ? String(platforms[0] || '') : '';
  const allowed: Platform[] = ['meta', 'google', 'instagram', 'tiktok', 'youtube'];
  return allowed.includes(first as Platform) ? (first as Platform) : 'meta';
}

function create7DaySeries(totalDailyBudget: number) {
  const result: { date: string; spend: number; clicks: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);

    const weekdayBoost = day.getDay() >= 1 && day.getDay() <= 4 ? 1.1 : 0.92;
    const spend = Math.max(0, Math.round(totalDailyBudget * weekdayBoost));
    const clicks = Math.round(spend * 7.1);

    result.push({
      date: day.toISOString().split('T')[0],
      spend,
      clicks,
    });
  }

  return result;
}

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
      take: 100,
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        aiAnalysis: true,
        createdAt: true,
      },
    });

    const projections: CampaignProjection[] = campaigns.map((campaign) => {
      let dailyBudget = Number(campaign.budget || 0);
      let platform: Platform = 'meta';
      let goal: Goal = '';

      try {
        if (campaign.aiAnalysis) {
          const parsed = JSON.parse(campaign.aiAnalysis);
          dailyBudget = Number(parsed?.formData?.dailyBudget || dailyBudget || 0);
          platform = safePlatform(parsed?.formData?.selectedPlatforms);
          goal = asGoal(parsed?.formData?.adGoal);
        }
      } catch {
        // eski kayitlar fallback ile devam eder
      }

      const daysActive = Math.max(1, Math.min(30, Math.ceil((Date.now() - new Date(campaign.createdAt).getTime()) / 86400000)));
      const spend = Math.round(dailyBudget * daysActive * statusMultiplier(campaign.status));
      const clicks = Math.round(spend * 7.1);
      const impressions = Math.round(clicks * 29);
      const conversions = Math.round(clicks * 0.024);
      const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
      const cpc = clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0;
      const roas = roasByGoal(goal);

      return {
        id: campaign.id,
        title: campaign.title,
        platform,
        status: campaign.status as CampaignProjection['status'],
        spend,
        impressions,
        clicks,
        conversions,
        ctr,
        cpc,
        roas,
        createdAt: campaign.createdAt,
      };
    });

    const totals = projections.reduce(
      (acc, campaign) => {
        acc.spend += campaign.spend;
        acc.impressions += campaign.impressions;
        acc.clicks += campaign.clicks;
        acc.conversions += campaign.conversions;
        return acc;
      },
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    );

    const avgRoas = projections.length > 0
      ? Number((projections.reduce((sum, c) => sum + c.roas, 0) / projections.length).toFixed(2))
      : 0;

    const totalDailyBudget = projections.reduce((sum, c) => sum + Math.round(c.spend / Math.max(1, Math.min(30, Math.ceil((Date.now() - c.createdAt.getTime()) / 86400000)))), 0);

    const platformMap: Record<Platform, { spend: number; clicks: number; impressions: number; roasSum: number; count: number; status: string }> = {
      meta: { spend: 0, clicks: 0, impressions: 0, roasSum: 0, count: 0, status: 'active' },
      google: { spend: 0, clicks: 0, impressions: 0, roasSum: 0, count: 0, status: 'active' },
      instagram: { spend: 0, clicks: 0, impressions: 0, roasSum: 0, count: 0, status: 'active' },
      tiktok: { spend: 0, clicks: 0, impressions: 0, roasSum: 0, count: 0, status: 'active' },
      youtube: { spend: 0, clicks: 0, impressions: 0, roasSum: 0, count: 0, status: 'active' },
    };

    for (const c of projections) {
      const row = platformMap[c.platform];
      row.spend += c.spend;
      row.clicks += c.clicks;
      row.impressions += c.impressions;
      row.roasSum += c.roas;
      row.count += 1;
      if (c.status === 'paused') {
        row.status = 'paused';
      }
    }

    const platformPerformance = Object.entries(platformMap)
      .filter(([, v]) => v.count > 0)
      .map(([platform, v]) => ({
        platform,
        spend: v.spend,
        clicks: v.clicks,
        impressions: v.impressions,
        avgCtr: v.impressions > 0 ? Number(((v.clicks / v.impressions) * 100).toFixed(2)) : 0,
        avgRoas: Number((v.roasSum / v.count).toFixed(2)),
        status: v.status,
      }));

    return NextResponse.json({
      success: true,
      totals,
      avgRoas,
      campaignCount: projections.length,
      dailyData: create7DaySeries(totalDailyBudget),
      platformPerformance,
      campaigns: projections.map((c) => ({
        campaignId: c.id,
        campaignName: c.title,
        platform: c.platform,
        status: c.status,
        totalSpend: c.spend,
        totalImpressions: c.impressions,
        totalClicks: c.clicks,
        totalConversions: c.conversions,
        avgCtr: c.ctr,
        avgCpc: c.cpc,
        roas: c.roas,
        startDate: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('Reports overview error:', error);
    return NextResponse.json({ success: false, error: 'Rapor verileri alınamadı' }, { status: 500 });
  }
}
