import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: number; // % değişim
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'rose';
  description?: string;
}

export function StatCard({ title, value, change, prefix, suffix, icon, color = 'blue', description }: StatCardProps) {
  const colorConfig = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'bg-rose-100' },
  };

  const cc = colorConfig[color];

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5">
            {prefix && <span className="text-lg font-semibold text-slate-600">{prefix}</span>}
            {value}
            {suffix && <span className="text-sm font-medium text-slate-500 ml-1">{suffix}</span>}
          </p>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-xl flex-shrink-0', cc.icon)}>
            <span className={clsx('w-5 h-5', cc.text)}>{icon}</span>
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <div
            className={clsx(
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
              isPositive && 'bg-emerald-50 text-emerald-700',
              isNegative && 'bg-red-50 text-red-700',
              !isPositive && !isNegative && 'bg-slate-100 text-slate-600'
            )}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
          <span className="text-xs text-slate-400">geçen haftaya göre</span>
        </div>
      )}
    </div>
  );
}
