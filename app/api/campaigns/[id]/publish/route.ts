import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

type PlatformResult = {
  platform: string;
  success: boolean;
  message: string;
  queued?: boolean;
  externalIds?: Record<string, string>;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapGoalToMetaObjective(goal?: string) {
  switch (goal) {
    case 'traffic':
      return 'OUTCOME_TRAFFIC';
    case 'leads':
      return 'OUTCOME_LEADS';
    case 'sales':
      return 'OUTCOME_SALES';
    case 'engagement':
      return 'OUTCOME_ENGAGEMENT';
    default:
      return 'OUTCOME_AWARENESS';
  }
}

function mapGoalToGoogleChannel(goal?: string) {
  if (goal === 'awareness' || goal === 'engagement') return 'DISPLAY';
  return 'SEARCH';
}

async function metaPost(path: string, params: URLSearchParams) {
  const response = await fetch(`https://graph.facebook.com/v19.0/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Meta API hatası');
  }
  return data;
}

async function publishMetaCampaign(input: {
  businessName: string;
  dailyBudget: number;
  targetLocation?: string;
  goal?: string;
  adText?: string;
  website?: string;
  budgetAmount: number;
}): Promise<PlatformResult> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountIdRaw = process.env.META_AD_ACCOUNT_ID;
  const pageId = process.env.META_PAGE_ID;

  if (!accessToken || !adAccountIdRaw || !pageId) {
    return {
      platform: 'meta',
      success: true,
      queued: true,
      message: 'Meta yayını bağlantı ayarları tamamlanınca otomatik gönderilecek (beklemeye alındı).',
    };
  }

  const adAccountId = adAccountIdRaw.startsWith('act_') ? adAccountIdRaw : `act_${adAccountIdRaw}`;
  const objective = mapGoalToMetaObjective(input.goal);
  const budget = Math.max(50, Math.round(input.budgetAmount));
  const dailyBudgetMinor = budget * 100;

  const campaign = await metaPost(`${adAccountId}/campaigns`, new URLSearchParams({
    access_token: accessToken,
    name: `${input.businessName} - ${new Date().toISOString().slice(0, 10)}`,
    objective,
    status: 'PAUSED',
    special_ad_categories: '[]',
  }));

  const adSet = await metaPost(`${adAccountId}/adsets`, new URLSearchParams({
    access_token: accessToken,
    name: `${input.businessName} - Otomatik Ad Set`,
    campaign_id: String(campaign.id),
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'REACH',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget: String(dailyBudgetMinor),
    status: 'PAUSED',
    targeting: JSON.stringify({
      geo_locations: { countries: ['TR'] },
    }),
  }));

  const finalLink = input.website || process.env.NEXTAUTH_URL || 'https://adpanel.vercel.app';
  const creative = await metaPost(`${adAccountId}/adcreatives`, new URLSearchParams({
    access_token: accessToken,
    name: `${input.businessName} - Otomatik Kreatif`,
    object_story_spec: JSON.stringify({
      page_id: pageId,
      link_data: {
        link: finalLink,
        message: input.adText || `${input.businessName} için özel teklifleri hemen inceleyin.`,
      },
    }),
  }));

  const ad = await metaPost(`${adAccountId}/ads`, new URLSearchParams({
    access_token: accessToken,
    name: `${input.businessName} - Otomatik Reklam`,
    adset_id: String(adSet.id),
    creative: JSON.stringify({ creative_id: String(creative.id) }),
    status: 'PAUSED',
  }));

  return {
    platform: 'meta',
    success: true,
    message: 'Meta kampanyası oluşturuldu (PAUSED). Panelden inceleyip aktif edebilirsiniz.',
    externalIds: {
      campaignId: String(campaign.id),
      adSetId: String(adSet.id),
      creativeId: String(creative.id),
      adId: String(ad.id),
    },
  };
}

async function googleRequest(path: string, body: unknown) {
  const accessToken = process.env.GOOGLE_ADS_ACCESS_TOKEN;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  if (!accessToken || !developerToken) {
    throw new Error('Google Ads token yapılandırması eksik');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json',
  };

  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId.replace(/-/g, '');
  }

  const response = await fetch(`https://googleads.googleapis.com/v17/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.error?.message || data?.error?.details?.[0]?.message;
    throw new Error(detail || 'Google Ads API hatası');
  }

  return data;
}

async function publishGoogleCampaign(input: {
  businessName: string;
  sector?: string;
  budgetAmount: number;
  adText?: string;
  website?: string;
  goal?: string;
}): Promise<PlatformResult> {
  const customerIdRaw = process.env.GOOGLE_ADS_CUSTOMER_ID;
  if (!customerIdRaw) {
    return {
      platform: 'google',
      success: true,
      queued: true,
      message: 'Google yayını bağlantı ayarları tamamlanınca otomatik gönderilecek (beklemeye alındı).',
    };
  }

  const customerId = customerIdRaw.replace(/-/g, '');
  const budgetMicros = Math.max(50, Math.round(input.budgetAmount)) * 1_000_000;

  const budgetResp = await googleRequest(`customers/${customerId}/campaignBudgets:mutate`, {
    operations: [
      {
        create: {
          name: `${input.businessName} Budget ${Date.now()}`,
          amountMicros: String(budgetMicros),
          deliveryMethod: 'STANDARD',
          explicitlyShared: false,
        },
      },
    ],
  });

  const budgetResourceName = budgetResp?.results?.[0]?.resourceName;
  if (!budgetResourceName) {
    throw new Error('Google kampanya bütçesi oluşturulamadı');
  }

  const campaignResp = await googleRequest(`customers/${customerId}/campaigns:mutate`, {
    operations: [
      {
        create: {
          name: `${input.businessName} Campaign ${Date.now()}`,
          status: 'PAUSED',
          advertisingChannelType: mapGoalToGoogleChannel(input.goal),
          campaignBudget: budgetResourceName,
          networkSettings: {
            targetGoogleSearch: true,
            targetSearchNetwork: true,
            targetContentNetwork: false,
            targetPartnerSearchNetwork: false,
          },
          manualCpc: {},
          startDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        },
      },
    ],
  });

  const campaignResourceName = campaignResp?.results?.[0]?.resourceName;
  if (!campaignResourceName) {
    throw new Error('Google kampanyası oluşturulamadı');
  }

  const adGroupResp = await googleRequest(`customers/${customerId}/adGroups:mutate`, {
    operations: [
      {
        create: {
          name: `${input.businessName} Ad Group`,
          campaign: campaignResourceName,
          status: 'ENABLED',
          type: 'SEARCH_STANDARD',
          cpcBidMicros: '1000000',
        },
      },
    ],
  });

  const adGroupResourceName = adGroupResp?.results?.[0]?.resourceName;
  if (!adGroupResourceName) {
    throw new Error('Google ad group oluşturulamadı');
  }

  const keywordText = `${input.sector || input.businessName} hizmetleri`;
  await googleRequest(`customers/${customerId}/adGroupCriteria:mutate`, {
    operations: [
      {
        create: {
          adGroup: adGroupResourceName,
          status: 'ENABLED',
          keyword: {
            text: keywordText,
            matchType: 'BROAD',
          },
        },
      },
    ],
  });

  const finalUrl = input.website || process.env.NEXTAUTH_URL || 'https://adpanel.vercel.app';
  const headlineBase = input.businessName.slice(0, 30);
  const descBase = (input.adText || `${input.businessName} için doğru çözüm burada.`).slice(0, 90);

  const adResp = await googleRequest(`customers/${customerId}/adGroupAds:mutate`, {
    operations: [
      {
        create: {
          adGroup: adGroupResourceName,
          status: 'PAUSED',
          ad: {
            finalUrls: [finalUrl],
            responsiveSearchAd: {
              headlines: [
                { text: `${headlineBase}`.slice(0, 30) },
                { text: 'Hemen Teklif Al' },
                { text: 'Size Ozel Cozumler' },
              ],
              descriptions: [
                { text: descBase },
                { text: 'Hedefli reklamlarla daha cok musteriye ulasin.' },
              ],
            },
          },
        },
      },
    ],
  });

  return {
    platform: 'google',
    success: true,
    message: 'Google kampanyası oluşturuldu (PAUSED). Panelden inceleyip aktif edebilirsiniz.',
    externalIds: {
      campaign: String(campaignResourceName),
      adGroup: String(adGroupResourceName),
      ad: String(adResp?.results?.[0]?.resourceName || ''),
    },
  };
}

function normalizeSplit(selected: string[], split: Record<string, number>, totalBudget: number) {
  if (Object.keys(split).length > 0) return split;

  if (selected.length === 0 || totalBudget <= 0) return {};

  const per = Math.round(totalBudget / selected.length);
  const output: Record<string, number> = {};
  selected.forEach((p, idx) => {
    output[p] = idx === selected.length - 1 ? Math.max(0, totalBudget - per * (selected.length - 1)) : per;
  });
  return output;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Kampanya bulunamadı' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const forcedPlatforms = Array.isArray(body?.platforms) ? body.platforms : null;

    const analysis = parseJson<any>(campaign.aiAnalysis, {});
    const formData = analysis?.formData || {};
    const suggestion = analysis?.suggestion || {};

    const selectedPlatforms: string[] = (forcedPlatforms && forcedPlatforms.length > 0
      ? forcedPlatforms
      : Array.isArray(formData?.selectedPlatforms)
        ? formData.selectedPlatforms
        : []
    ).map((p: unknown) => String(p).toLowerCase());

    const totalBudget = Number(campaign.budget || formData?.dailyBudget || 0);
    const budgetSplit = normalizeSplit(selectedPlatforms, suggestion?.budget_split || {}, totalBudget);

    const businessName = String(formData?.businessName || campaign.title || 'Advara Kampanya');
    const adText = Array.isArray(suggestion?.ad_examples) ? suggestion.ad_examples[0] : undefined;
    const website = String(formData?.website || '').trim() || undefined;

    const results: PlatformResult[] = [];

    for (const platform of selectedPlatforms) {
      try {
        if (platform === 'meta' || platform === 'instagram') {
          results.push(await publishMetaCampaign({
            businessName,
            dailyBudget: totalBudget,
            targetLocation: formData?.targetLocation,
            goal: formData?.adGoal,
            adText,
            website,
            budgetAmount: Number(budgetSplit[platform] || 0),
          }));
          continue;
        }

        if (platform === 'google') {
          results.push(await publishGoogleCampaign({
            businessName,
            sector: String(formData?.sector || campaign.sector || ''),
            budgetAmount: Number(budgetSplit[platform] || 0),
            adText,
            website,
            goal: formData?.adGoal,
          }));
          continue;
        }

        results.push({
          platform,
          success: true,
          queued: true,
          message: `${platform} için otomatik yayın altyapısı hazırlanıyor, kampanya beklemeye alındı.`,
        });
      } catch (error) {
        results.push({
          platform,
          success: false,
          message: error instanceof Error ? error.message : 'Yayın sırasında hata oluştu',
        });
      }
    }

    const hasSuccess = results.some((r) => r.success);
    const hasQueued = results.some((r) => r.queued);
    const hasDirectPublish = results.some((r) => r.success && !r.queued);

    const updatedAnalysis = {
      ...analysis,
      publish: {
        lastRunAt: new Date().toISOString(),
        results,
      },
    };

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: hasSuccess ? 'active' : campaign.status,
        aiAnalysis: JSON.stringify(updatedAnalysis),
      },
    });

    return NextResponse.json({
      success: hasSuccess,
      results,
      message: hasDirectPublish
        ? 'Kampanya seçili mecralar için yayın sistemine gönderildi.'
        : hasQueued
          ? 'Kampanya beklemeye alındı. Hesap bağlantıları tamamlanınca otomatik gönderilecek.'
          : 'Yayın denemesi tamamlandı ancak aktif gönderim yapılamadı.',
    });
  } catch (error) {
    console.error('Campaign publish error:', error);
    return NextResponse.json({ success: false, error: 'Kampanya yayına alınamadı' }, { status: 500 });
  }
}
