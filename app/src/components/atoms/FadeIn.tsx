'use client';

import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/utils/cn';
import React from 'react';
import type { ReactNode } from 'react';

type Variant = 'up' | 'left' | 'right' | 'scale';

interface FadeInProps {
  children: ReactNode;
  variant?: Variant;
  delay?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  threshold?: number;
}

const VARIANT_CLASS: Record<Variant, string> = {
  up:    'site-reveal',
  left:  'site-reveal-left',
  right: 'site-reveal-right',
  scale: 'site-scale',
};

export function FadeIn({
  children,
  variant = 'up',
  delay,
  className,
  threshold = 0.12,
}: FadeInProps) {
  const { ref, inView } = useInView(threshold);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        inView ? VARIANT_CLASS[variant] : 'opacity-0',
        delay && `stagger-${delay}`,
        className,
      )}
    >
      {children}
    </div>
  );
}
