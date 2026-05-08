import { cn } from '@/utils/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]',
        className,
      )}
      {...props}
    />
  );
}
