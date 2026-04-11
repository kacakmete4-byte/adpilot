'use client';

import { PLATFORM_CONFIG } from '@/lib/mockData';
import { Platform } from '@/lib/types';

interface BudgetItem {
  platform: Platform;
  percentage: number;
  dailyAmount: number;
}

interface BudgetDistributionProps {
  data: BudgetItem[];
  totalBudget: number;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  meta: '#1877F2',
  google: '#EA4335',
  instagram: '#E4405F',
  tiktok: '#000000',
  youtube: '#FF0000',
};

export function BudgetDistributionChart({ data, totalBudget }: BudgetDistributionProps) {
  return (
    <div className="space-y-4">
      {/* Renkli bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {data.map((item) => (
          <div
            key={item.platform}
            style={{
              width: `${item.percentage}%`,
              backgroundColor: PLATFORM_COLORS[item.platform],
            }}
            className="rounded-full transition-all duration-500"
            title={`${PLATFORM_CONFIG[item.platform]?.name}: %${item.percentage}`}
          />
        ))}
      </div>

      {/* Platform listesi */}
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.platform} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: PLATFORM_COLORS[item.platform] }}
              />
              <span className="text-sm text-slate-700 font-medium">
                {PLATFORM_CONFIG[item.platform]?.name || item.platform}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">%{item.percentage}</span>
              <span className="text-sm font-semibold text-slate-900">
                {item.dailyAmount.toLocaleString('tr-TR')} ₺/gün
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Toplam */}
      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
        <span className="text-sm text-slate-500 font-medium">Toplam Günlük Bütçe</span>
        <span className="text-base font-bold text-slate-900">{totalBudget.toLocaleString('tr-TR')} ₺</span>
      </div>
    </div>
  );
}

// --- Mini versiyon: Dashboard için ---
interface MiniChartData {
  platform: Platform;
  percentage: number;
}

export function MiniDonut({ data }: { data: MiniChartData[] }) {
  // Basit yüzey çubukları
  return (
    <div className="flex gap-1 items-end h-16">
      {data.map((item, i) => (
        <div key={item.platform} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${item.percentage * 0.6}px`,
              backgroundColor: PLATFORM_COLORS[item.platform],
              opacity: 0.85,
            }}
          />
          <span className="text-xs text-slate-500">{item.percentage}%</span>
        </div>
      ))}
    </div>
  );
}
