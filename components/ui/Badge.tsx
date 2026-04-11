import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'slate' | 'purple';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'blue', size = 'md' }: BadgeProps) {
  const variants = {
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-100',
    red: 'bg-red-50 text-red-700 border border-red-100',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-100',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={clsx('inline-flex items-center rounded-lg font-medium', variants[variant], sizes[size])}>
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'paused' | 'completed' | 'draft';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    active: { label: 'Aktif', variant: 'green' as const, dot: 'bg-emerald-500' },
    paused: { label: 'Duraklatıldı', variant: 'yellow' as const, dot: 'bg-amber-500' },
    completed: { label: 'Tamamlandı', variant: 'slate' as const, dot: 'bg-slate-400' },
    draft: { label: 'Taslak', variant: 'blue' as const, dot: 'bg-blue-400' },
  };

  const { label, variant, dot } = config[status];

  return (
    <Badge variant={variant}>
      <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5', dot)} />
      {label}
    </Badge>
  );
}
