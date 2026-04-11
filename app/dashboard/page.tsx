'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  DollarSign, TrendingUp, MousePointerClick, Megaphone,
  Lightbulb, Star, PlusCircle, ArrowRight, Zap,
  BarChart2, Target, Users, Eye
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { BudgetDistributionChart } from '@/components/dashboard/BudgetDistribution';
import { MOCK_DASHBOARD_STATS, PLATFORM_CONFIG } from '@/lib/mockData';
import { Platform } from '@/lib/types';

type DBCampaign = {
  id: string;
  title: string;
  budget: number | null;
  status: string;
  aiAnalysis: string | null;
};

const MOCK_BUDGET_DISTRIBUTION = [
  { platform: 'meta' as Platform, percentage: 50, dailyAmount: 225 },
  { platform: 'google' as Platform, percentage: 35, dailyAmount: 157 },
  { platform: 'instagram' as Platform, percentage: 15, dailyAmount: 68 },
];

const DAILY_CHART = [
  { day: 'Pzt', spend: 420, clicks: 3100 },
  { day: 'Sal', spend: 380, clicks: 2800 },
  { day: 'Çar', spend: 450, clicks: 3400 },
  { day: 'Per', spend: 510, clicks: 3900 },
  { day: 'Cum', spend: 490, clicks: 3700 },
  { day: 'Cmt', spend: 320, clicks: 2400 },
  { day: 'Paz', spend: 290, clicks: 2100 },
];

const maxSpend = Math.max(...DAILY_CHART.map((d) => d.spend));

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<DBCampaign[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const response = await fetch('/api/campaigns');
        const data = await response.json();
        if (response.ok && Array.isArray(data?.campaigns)) {
          setCampaigns(data.campaigns);
        }
      } catch (error) {
        console.error('Campaign load error:', error);
      } finally {
        setCampaignLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const parsedCampaigns = useMemo(() => {
    return campaigns.map((campaign) => {
      let businessName = campaign.title;
      let selectedPlatforms: Platform[] = ['meta'];
      let dailyBudget = campaign.budget || 0;

      try {
        if (campaign.aiAnalysis) {
          const parsed = JSON.parse(campaign.aiAnalysis);
          businessName = parsed?.formData?.businessName || businessName;
          selectedPlatforms = parsed?.formData?.selectedPlatforms || selectedPlatforms;
          dailyBudget = Number(parsed?.formData?.dailyBudget || dailyBudget || 0);
        }
      } catch {
        // Parse edilemeyen eski kayıtlarda title/budget fallback kullanılır.
      }

      return {
        id: campaign.id,
        status: campaign.status as 'draft' | 'active' | 'paused' | 'completed',
        businessName,
        selectedPlatforms,
        dailyBudget,
      };
    });
  }, [campaigns]);

  const stats = {
    ...MOCK_DASHBOARD_STATS,
    todayBudget: parsedCampaigns.reduce((sum, c) => sum + c.dailyBudget, 0) || MOCK_DASHBOARD_STATS.todayBudget,
    activeCampaigns: parsedCampaigns.length,
  };

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={today}
        action={
          <Link href="/dashboard/create-ad">
            <Button icon={<PlusCircle className="w-4 h-4" />}>
              Yeni Kampanya
            </Button>
          </Link>
        }
      />

      <div className="px-8 py-8 space-y-8">

        {/* AI Öneri Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AI Önerisi</p>
              <p className="text-blue-100 text-sm mt-0.5">{stats.topRecommendation}</p>
            </div>
          </div>
          <Link href="/dashboard/create-ad">
            <button className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-2">
              Uygula <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-fade-in-up stagger-1">
            <StatCard
              title="Bugünkü Bütçe"
              value={stats.todayBudget.toLocaleString('tr-TR')}
              prefix="₺"
              change={12}
              color="blue"
              icon={<DollarSign className="w-5 h-5" />}
              description="Aktif kampanyalar toplamı"
            />
          </div>
          <div className="animate-fade-in-up stagger-2">
            <StatCard
              title="Toplam Gösterim"
              value={(stats.totalImpressions / 1000).toFixed(1)}
              suffix="K"
              change={8}
              color="purple"
              icon={<Eye className="w-5 h-5" />}
              description="Bu ay"
            />
          </div>
          <div className="animate-fade-in-up stagger-3">
            <StatCard
              title="Toplam Tıklama"
              value={stats.totalClicks.toLocaleString('tr-TR')}
              change={15}
              color="green"
              icon={<MousePointerClick className="w-5 h-5" />}
              description="Bu ay"
            />
          </div>
          <div className="animate-fade-in-up stagger-4">
            <StatCard
              title="Ortalama ROAS"
              value={stats.avgRoas.toFixed(1)}
              suffix="x"
              change={5}
              color="amber"
              icon={<TrendingUp className="w-5 h-5" />}
              description="Reklam harcama getirisi"
            />
          </div>
        </div>

        {/* Ana İçerik Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Haftalık Harcama Grafiği */}
          <Card className="xl:col-span-2">
            <CardHeader
              title="Haftalık Harcama"
              subtitle="Son 7 günlük kampanya performansı"
              icon={<BarChart2 className="w-4 h-4" />}
              action={<Badge variant="blue">Bu Hafta</Badge>}
            />
            <div className="flex items-end gap-2 h-40 mt-4">
              {DAILY_CHART.map((d, i) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500">{d.spend}₺</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${i === 6 ? 'bg-slate-200' : 'bg-blue-500'}`}
                      style={{ height: `${(d.spend / maxSpend) * 100}px` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Toplam Harcama</p>
                <p className="text-base font-bold text-slate-900">₺2.860</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Ort. Günlük</p>
                <p className="text-base font-bold text-slate-900">₺408</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">En İyi Gün</p>
                <p className="text-base font-bold text-slate-900">Perşembe</p>
              </div>
            </div>
          </Card>

          {/* Bütçe Dağılımı */}
          <Card>
            <CardHeader
              title="Platform Dağılımı"
              subtitle="Önerilen bütçe dağılımı"
              icon={<Target className="w-4 h-4" />}
            />
            <BudgetDistributionChart data={MOCK_BUDGET_DISTRIBUTION} totalBudget={450} />
          </Card>
        </div>

        {/* Alt Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Aktif Kampanyalar */}
          <Card className="xl:col-span-2">
            <CardHeader
              title="Aktif Kampanyalar"
              subtitle={`${stats.activeCampaigns} kampanya çalışıyor`}
              icon={<Megaphone className="w-4 h-4" />}
              action={
                <Link href="/dashboard/reports">
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    Tümünü gör <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              }
            />
            <div className="space-y-3">
              {parsedCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{campaign.businessName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={campaign.status} />
                        <span className="text-xs text-slate-500">
                          {campaign.selectedPlatforms.map((p) =>
                            PLATFORM_CONFIG[p]?.name.split(' ')[0]
                          ).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      ₺{campaign.dailyBudget.toLocaleString('tr-TR')}<span className="text-xs text-slate-500 font-normal">/gün</span>
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                      {campaign.selectedPlatforms.length} platform
                    </p>
                  </div>
                </div>
              ))}

              {!campaignLoading && parsedCampaigns.length === 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                  Henüz kampanya yok. "Yeni Kampanya Oluştur" ile ilk reklamını başlatabilirsin.
                </div>
              )}

              <Link href="/dashboard/create-ad">
                <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all text-sm font-medium">
                  <PlusCircle className="w-4 h-4" />
                  Yeni Kampanya Oluştur
                </button>
              </Link>
            </div>
          </Card>

          {/* Sağ Panel: Notlar + En İyi Kanal */}
          <div className="space-y-4">

            {/* En İyi Kanal */}
            <Card>
              <CardHeader
                title="En İyi Kanal"
                icon={<Star className="w-4 h-4" />}
              />
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🔵</div>
                <p className="font-bold text-blue-900">Meta (Facebook)</p>
                <p className="text-sm text-blue-700 mt-1">Bu ay en yüksek ROAS</p>
                <div className="mt-3 flex justify-center gap-4 text-xs text-blue-700">
                  <div>
                    <p className="font-bold text-base text-blue-900">4.1x</p>
                    <p>ROAS</p>
                  </div>
                  <div className="w-px bg-blue-200" />
                  <div>
                    <p className="font-bold text-base text-blue-900">3.35%</p>
                    <p>CTR</p>
                  </div>
                  <div className="w-px bg-blue-200" />
                  <div>
                    <p className="font-bold text-base text-blue-900">₺0.83</p>
                    <p>CPC</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* AI Notları */}
            <Card>
              <CardHeader
                title="AI Notları"
                icon={<Lightbulb className="w-4 h-4" />}
              />
              <ul className="space-y-3">
                {[
                  { text: 'Hafta içi reklamlar %20 daha verimli', type: 'tip' },
                  { text: 'Görsel içerik metin içerikten %30 daha iyi performans', type: 'insight' },
                  { text: 'Bütçenizi perşembe günü için artırın', type: 'action' },
                ].map((note, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">
                      {note.type === 'tip' ? '💡' : note.type === 'insight' ? '📊' : '⚡'}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">{note.text}</p>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Tahmini Dönüş */}
            <Card>
              <CardHeader
                title="Tahmini Dönüş"
                icon={<Users className="w-4 h-4" />}
              />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Bu ay harcama</span>
                  <span className="text-sm font-bold text-slate-900">₺{stats.totalSpendThisMonth.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Tahmini gelir</span>
                  <span className="text-sm font-bold text-emerald-600">₺{(stats.totalSpendThisMonth * stats.avgRoas).toLocaleString('tr-TR')}</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-700">Tahmini kâr</span>
                  <span className="text-sm font-bold text-emerald-700">
                    ₺{((stats.totalSpendThisMonth * stats.avgRoas) - stats.totalSpendThisMonth).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
