import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

function fallbackInsights(totalCampaigns: number, totalBudget: number) {
  return [
    `Aktif kampanya adedin ${totalCampaigns}. En iyi performans için benzer hedefli 2 kampanyayı birleştirip A/B test yap.`,
    `Günlük toplam bütçen yaklaşık ${totalBudget.toLocaleString('tr-TR')} TL. Hafta içi payını artırmak dönüşüm maliyetini düşürebilir.`,
    'Kreatifleri 7 günde bir yenile; aynı görsel uzun süre kalınca CTR düşüyor.',
  ];
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
      take: 20,
      select: { title: true, status: true, budget: true, goal: true, sector: true },
    });

    const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0);

    if (!process.env.OPENAI_API_KEY || campaigns.length === 0) {
      return NextResponse.json({ success: true, insights: fallbackInsights(campaigns.length, totalBudget) });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
Aşağıdaki kampanya özetinden hareketle kısa, uygulanabilir 3 adet reklam optimizasyon önerisi üret.
Cevap dili Türkçe olsun.
Her öneri tek cümle olsun.

Kampanya sayısı: ${campaigns.length}
Toplam günlük bütçe: ${totalBudget}
Kampanyalar: ${JSON.stringify(campaigns)}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 300,
      messages: [
        { role: 'system', content: 'Sen performans pazarlama danışmanısın. Kısa ve aksiyon odaklı yaz.' },
        { role: 'user', content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content || '';
    const lines = content
      .split('\n')
      .map((line) => line.replace(/^[-*\d\.\)\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 3);

    return NextResponse.json({
      success: true,
      insights: lines.length > 0 ? lines : fallbackInsights(campaigns.length, totalBudget),
    });
  } catch (error) {
    console.error('AI insights error:', error);
    return NextResponse.json({ success: false, error: 'AI öngörüleri alınamadı' }, { status: 500 });
  }
}
