'use client';

import { useState } from 'react';
import {
  BarChart2, TrendingUp, Eye, MousePointerClick,
  Filter, Calendar, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { MOCK_REPORTS } from '@/lib/mockData';
import { PLATFORM_CONFIG } from '@/lib/mockData';
import clsx from 'clsx';

type DateFilter = '7d' | '30d' | '90d' | 'all';

export default function ReportsPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30d');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const DATE_FILTERS: { value: DateFilter; label: string }[] = [
    { value: '7d', label: 'Son 7 Gün' },
    { value: '30d', label: 'Son 30 Gün' },
    { value: '90d', label: 'Son 90 Gün' },
    { value: 'all', label: 'Tümü' },
  ];

  // Toplam istatistikler
  const totals = MOCK_REPORTS.reduce(
    (acc, r) => ({
      spend: acc.spend + r.totalSpend,
      impressions: acc.impressions + r.totalImpressions,
      clicks: acc.clicks + r.totalClicks,
      conversions: acc.conversions + r.totalConversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  );

  // Son 7 günlük veriler
  const recentData = MOCK_REPORTS[0].dailyData.slice(-7);
  const maxVal = Math.max(...recentData.map((d) => d.spend));

  return (
    <div>
      <Header
        title="Raporlar"
        subtitle="Kampanya performansınızı detaylı analiz edin"
        action={
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
            Rapor İndir
          </Button>
        }
      />

      <div className="px-8 py-8 space-y-6">

        {/* Filtreler */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Dönem:
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
              <option value="all">Tüm Platformlar</option>
              <option value="meta">Meta (Facebook)</option>
              <option value="google">Google Ads</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Toplam Harcama"
            value={totals.spend.toLocaleString('tr-TR')}
            prefix="₺"
            change={18}
            color="blue"
            icon={<BarChart2 className="w-5 h-5" />}
          />
          <StatCard
            title="Toplam Gösterim"
            value={(totals.impressions / 1000).toFixed(1)}
            suffix="K"
            change={12}
            color="purple"
            icon={<Eye className="w-5 h-5" />}
          />
          <StatCard
            title="Toplam Tıklama"
            value={totals.clicks.toLocaleString('tr-TR')}
            change={22}
            color="green"
            icon={<MousePointerClick className="w-5 h-5" />}
          />
          <StatCard
            title="Toplam Dönüşüm"
            value={totals.conversions.toString()}
            change={8}
            color="amber"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Grafik + Tablo Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Günlük Harcama Grafiği */}
          <Card className="xl:col-span-2">
            <CardHeader
              title="Günlük Harcama Trendi"
              subtitle="Son 7 günün kampanya verisi"
              icon={<BarChart2 className="w-4 h-4" />}
              action={<Badge variant="blue">Meta Kampanya</Badge>}
            />
            <div className="mt-4">
              <div className="flex items-end gap-2 h-44">
                {recentData.map((d, i) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500">₺{d.spend}</span>
                    <div className="w-full" style={{ height: '130px', display: 'flex', alignItems: 'flex-end' }}>
                      <div
                        className="w-full rounded-t-lg bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer group relative"
                        style={{ height: `${(d.spend / maxVal) * 130}px` }}
                        title={`${d.date}: ₺${d.spend}`}
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
                  { label: 'Ort. CPC', value: '₺0.87' },
                  { label: 'Ort. CTR', value: '%3.42' },
                  { label: 'Ort. ROAS', value: '3.8x' },
                  { label: 'Dönüşüm Oranı', value: '%2.4' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Platform Karşılaştırması */}
          <Card>
            <CardHeader
              title="Platform Performansı"
              subtitle="Platforma göre karşılaştırma"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <div className="space-y-4 mt-2">
              {MOCK_REPORTS.map((report) => {
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
                        <p className="text-sm font-bold text-slate-900">₺{report.totalSpend.toLocaleString('tr-TR')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">ROAS</p>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-bold text-emerald-600">{report.roas.toFixed(1)}x</p>
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Tıklama</p>
                        <p className="text-sm font-bold text-slate-900">{report.totalClicks.toLocaleString('tr-TR')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">CTR</p>
                        <p className="text-sm font-bold text-slate-900">%{report.avgCtr.toFixed(2)}</p>
                      </div>
                    </div>
                    {/* Verimlilik barı */}
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

        {/* Kampanya Detay Tablosu */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Kampanya Detayları</h3>
              <p className="text-xs text-slate-500 mt-0.5">{MOCK_REPORTS.length} kampanya listeleniyor</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Kampanya', 'Platform', 'Durum', 'Harcama', 'Gösterim', 'Tıklama', 'CTR', 'CPC', 'ROAS'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_REPORTS.map((report, i) => {
                  const platformInfo = PLATFORM_CONFIG[report.platform];
                  return (
                    <tr key={report.campaignId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-slate-800 max-w-[200px] truncate">{report.campaignName}</p>
                        <p className="text-xs text-slate-400">{report.startDate}</p>
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
                        ₺{report.totalSpend.toLocaleString('tr-TR')}
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
                        ₺{report.avgCpc.toFixed(2)}
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
      </div>
    </div>
  );
}
