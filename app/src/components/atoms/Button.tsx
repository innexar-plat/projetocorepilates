import { cn } from '@/utils/cn';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className, variant = 'primary', ...props }: Props) {
  const variants: Record<Variant, string> = {
    primary:
      'bg-[var(--color-brand)] text-[var(--color-ink)] hover:brightness-95 focus-visible:outline-[var(--color-brand)]',
    secondary:
      'bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-black focus-visible:outline-[var(--color-ink)]',
    ghost:
      'bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] focus-visible:outline-[var(--color-ink)]',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
