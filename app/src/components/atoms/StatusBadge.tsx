import { cn } from '@/utils/cn';

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';

const STYLES: Record<Variant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  error:   'bg-red-50 text-red-700 ring-1 ring-red-200',
  info:    'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  neutral: 'bg-[#eef4f6] text-[#5f7480] ring-1 ring-[#d4e2e5]',
  gold:    'bg-[#3c8ea8]/10 text-[#a07820] ring-1 ring-[#3c8ea8]/30',
};

type Props = {
  label: string;
  variant?: Variant;
  className?: string;
};

export function StatusBadge({ label, variant = 'neutral', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        STYLES[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}

// Helpers to map domain enums to badge variants
export function statusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    ACTIVE:     'success',
    SUCCEEDED:  'success',
    CONFIRMED:  'success',
    CONVERTED:  'success',
    OPEN:       'info',
    NEW:        'info',
    CONTACTED:  'info',
    TRIALING:   'gold',
    ATTENDED:   'success',
    QUALIFIED:  'gold',
    PAST_DUE:   'warning',
    PENDING:    'warning',
    PROCESSING: 'warning',
    CANCELED:   'error',
    CANCELLED:  'error',
    FAILED:     'error',
    LOST:       'error',
    INACTIVE:   'neutral',
    RESOLVED:   'neutral',
    CLOSED:     'neutral',
    NO_SHOW:    'neutral',
  };
  return map[status?.toUpperCase()] ?? 'neutral';
}

