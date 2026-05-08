import { cn } from '@/utils/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface SiteButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/30 hover:bg-[var(--color-brand-dark)] hover:shadow-lg hover:shadow-[var(--color-brand)]/40 active:scale-[0.97]',
  outline:
    'border border-[var(--color-brand)] text-[var(--color-brand)] bg-transparent hover:bg-[var(--color-brand)]/8 active:scale-[0.97]',
  ghost:
    'text-[var(--color-muted)] bg-transparent hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] active:scale-[0.97]',
};

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-sm rounded-lg',
  md: 'px-6 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3.5 text-base rounded-xl',
};

export function SiteButton({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth,
  className,
  ...props
}: SiteButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        'disabled:opacity-50 disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
