'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart2, TrendingUp, Eye, MousePointerClick,
  Filter, Calendar, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { PLATFORM_CONFIG } from '@/lib/mockData';
import clsx from 'clsx';

type DateFilter = '7d' | '30d' | '90d' | 'all';

type ReportRow = {
  campaignId: string;
  campaignName: string;
  platform: keyof typeof PLATFORM_CONFIG;
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  roas: number;
  startDate: string;
};

type ReportsResponse = {
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  avgRoas: number;
  campaignCount: number;
  dailyData: Array<{ date: string; spend: number; clicks: number }>;
  campaigns: ReportRow[];
};

export default function ReportsPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30d');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<ReportsResponse>({
    totals: { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
    avgRoas: 0,
    campaignCount: 0,
    dailyData: [],
    campaigns: [],
  });

  const DATE_FILTERS: { value: DateFilter; label: string }[] = [
    { value: '7d', label: 'Son 7 Gun' },
    { value: '30d', label: 'Son 30 Gun' },
    { value: '90d', label: 'Son 90 Gun' },
    { value: 'all', label: 'Tumu' },
  ];

  useEffect(() => {
    const loadReports = async () => {
      try {
        setError('');
        const response = await fetch('/api/reports/overview');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Raporlar getirilemedi');
        }

        setReportData({
          totals: data?.totals || { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
          avgRoas: data?.avgRoas || 0,
          campaignCount: data?.campaignCount || 0,
          dailyData: data?.dailyData || [],
          campaigns: data?.campaigns || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Raporlar getirilemedi');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    if (platformFilter === 'all') return reportData.campaigns;
    return reportData.campaigns.filter((r) => r.platform === platformFilter);
  }, [reportData.campaigns, platformFilter]);

  const totals = useMemo(() => {
    return filteredReports.reduce(
      (acc, r) => ({
        spend: acc.spend + r.totalSpend,
        impressions: acc.impressions + r.totalImpressions,
        clicks: acc.clicks + r.totalClicks,
        conversions: acc.conversions + r.totalConversions,
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    );
  }, [filteredReports]);

  const recentData = reportData.dailyData.length > 0
    ? reportData.dailyData
    : [{ date: new Date().toISOString(), spend: 0, clicks: 0 }];

  const maxVal = Math.max(...recentData.map((d) => d.spend), 1);

  return (
    <div>
      <Header
        title="Raporlar"
        subtitle="Kampanya performansinizi detayli analiz edin"
        action={
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
            Rapor Indir
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Donem:
            </span>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {DATE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setDateFilter(f.value)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    dateFilter === f.value
                      ? 'bg-white text-blue-600 shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 flex items-center gap-1.5">
              <Filter className="w-4 h-4" /> Platform:
            </span>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tum Platformlar</option>
              <option value="meta">Meta (Facebook)</option>
              <option value="google">Google Ads</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Toplam Harcama"
            value={totals.spend.toLocaleString('tr-TR')}
            prefix="TL"
            change={18}
            color="blue"
            icon={<BarChart2 className="w-5 h-5" />}
          />
          <StatCard
            title="Toplam Gosterim"
            value={(totals.impressions / 1000).toFixed(1)}
            suffix="K"
            change={12}
            color="purple"
            icon={<Eye className="w-5 h-5" />}
          />
          <StatCard
            title="Toplam Tiklama"
            value={totals.clicks.toLocaleString('tr-TR')}
            change={22}
            color="green"
            icon={<MousePointerClick className="w-5 h-5" />}
          />
          <StatCard
            title="Toplam Donusum"
            value={totals.conversions.toString()}
            change={8}
            color="amber"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-700">
            Raporlar yukleniyor...
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Gunluk Harcama Trendi"
              subtitle="Son 7 gunun kampanya verisi"
              icon={<BarChart2 className="w-4 h-4" />}
              action={<Badge variant="blue">Canli Veri</Badge>}
            />
            <div className="mt-4">
              <div className="flex items-end gap-2 h-44">
                {recentData.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500">TL{d.spend}</span>
                    <div className="w-full" style={{ height: '130px', display: 'flex', alignItems: 'flex-end' }}>
                      <div
                        className="w-full rounded-t-lg bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer group relative"
                        style={{ height: `${(d.spend / maxVal) * 130}px` }}
                        title={`${d.date}: TL${d.spend}`}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                {[
                  { label: 'Ort. CPC', value: `TL${totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : '0.00'}` },
                  { label: 'Ort. CTR', value: `%${totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00'}` },
                  { label: 'Ort. ROAS', value: `${reportData.avgRoas.toFixed(1)}x` },
                  { label: 'Donusum Orani', value: `%${totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) : '0.00'}` },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Platform Performansi"
              subtitle="Platforma gore karsilastirma"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <div className="space-y-4 mt-2">
              {filteredReports.map((report) => {
                const platformInfo = PLATFORM_CONFIG[report.platform];
                const efficiency = ((report.roas - 1) * 100).toFixed(0);
                return (
                  <div key={report.campaignId} className="p-3.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: platformInfo?.color || '#ccc' }}
                        />
                        <span className="text-xs font-semibold text-slate-800">
                          {platformInfo?.name || report.platform}
                        </span>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-slate-500">Harcama</p>
                        <p className="text-sm font-bold text-slate-900">TL{report.totalSpend.toLocaleString('tr-TR')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">ROAS</p>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-bold text-emerald-600">{report.roas.toFixed(1)}x</p>
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Tiklama</p>
                        <p className="text-sm font-bold text-slate-900">{report.totalClicks.toLocaleString('tr-TR')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">CTR</p>
                        <p className="text-sm font-bold text-slate-900">%{report.avgCtr.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Verimlilik</span>
                        <span>%{efficiency}</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full">
                        <div
                          className="h-1.5 bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(Number(efficiency), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Kampanya Detaylari</h3>
              <p className="text-xs text-slate-500 mt-0.5">{filteredReports.length} kampanya listeleniyor</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Kampanya', 'Platform', 'Durum', 'Harcama', 'Gosterim', 'Tiklama', 'CTR', 'CPC', 'ROAS'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const platformInfo = PLATFORM_CONFIG[report.platform];
                  return (
                    <tr key={report.campaignId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-slate-800 max-w-[200px] truncate">{report.campaignName}</p>
                        <p className="text-xs text-slate-400">{new Date(report.startDate).toLocaleDateString('tr-TR')}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platformInfo?.color }} />
                          <span className="text-xs text-slate-600">{platformInfo?.name.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">
                        TL{report.totalSpend.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {(report.totalImpressions / 1000).toFixed(1)}K
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {report.totalClicks.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        %{report.avgCtr.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        TL{report.avgCpc.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-emerald-600">{report.roas.toFixed(1)}x</span>
                          {report.roas >= 3 ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {!loading && filteredReports.length === 0 && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
            Bu filtreye uygun kampanya raporu bulunamadi.
          </div>
        )}
      </div>
    </div>
  );
}
