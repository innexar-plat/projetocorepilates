import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: string;
  hint?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  icon?: ReactNode;
  className?: string;
  delay?: number;
};

export function StatCard({ label, value, hint, trend, trendValue, icon, className, delay = 0 }: Props) {
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-[#5f7480]';
  const trendArrow = trend === 'up' ? '^' : trend === 'down' ? 'v' : '->';

  return (
    <div
      className={cn(
        'animate-fade-up rounded-2xl bg-white p-6',
        'border border-[#e5dfc9] shadow-sm',
        'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f7480]">{label}</p>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3c8ea8]/10 text-base text-[#3c8ea8]">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-[#1f2e35]">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {trendValue && (
          <span className={cn('text-xs font-semibold', trendColor)}>
            {trendArrow} {trendValue}
          </span>
        )}
        {hint && <span className="text-xs text-[#5f7480]">{hint}</span>}
      </div>
    </div>
  );
}

