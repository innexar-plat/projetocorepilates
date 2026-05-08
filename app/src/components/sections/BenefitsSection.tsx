'use client';

import { FadeIn } from '@/components/atoms/FadeIn';
import { useTranslations } from 'next-intl';

/* ── Professional pilates-themed SVG icons ─────────────────────── */
const icons = {
  flexibility: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4" />
      <path d="M7 16c1.5-1 3-1.5 5-1.5s3.5.5 5 1.5" />
    </svg>
  ),
  strength: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M6.5 6.5h11M6.5 17.5h11" /><path d="M3 8.5v7" /><path d="M21 8.5v7" />
      <rect x="4.5" y="8" width="2" height="8" rx="1" /><rect x="17.5" y="8" width="2" height="8" rx="1" />
      <rect x="6.5" y="10.5" width="11" height="3" rx="1.5" />
    </svg>
  ),
  posture: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="4" r="2" />
      <path d="M12 7v6M9 13l-2 5M15 13l2 5M9 13h6" />
    </svg>
  ),
  mindfulness: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M9 9h.01M15 9h.01" /><path d="M8 13s1.5 2 4 2 4-2 4-2" />
    </svg>
  ),
  wellness: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  balance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <line x1="12" y1="3" x2="12" y2="21" /><path d="M6 8l-3 4 3 4M18 8l3 4-3 4" />
      <path d="M3 12h6M15 12h6" />
    </svg>
  ),
} as const;

type BenefitKey = keyof typeof icons;

const BENEFITS: { key: BenefitKey; accent: string }[] = [
  { key: 'flexibility', accent: '#DEB557' },
  { key: 'strength',    accent: '#C9935A' },
  { key: 'posture',     accent: '#7B9E6B' },
  { key: 'mindfulness', accent: '#6B8FAE' },
  { key: 'wellness',    accent: '#C46D7F' },
  { key: 'balance',     accent: '#8B7BAE' },
];

export function BenefitsSection() {
  const t = useTranslations('home.benefits');

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">

      {/* Header */}
      <FadeIn variant="up" className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">
          {t('eyebrow')}
        </p>
        <h2
          className="mt-3 text-4xl font-bold text-[var(--color-ink)] sm:text-5xl"
          style={{ fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '-0.025em' }}
        >
          {t('title')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-[var(--color-muted)]">
          {t('subtitle')}
        </p>
      </FadeIn>

      {/* Cards grid */}
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map((b, i) => (
          <FadeIn
            key={b.key}
            variant={i % 3 === 0 ? 'left' : i % 3 === 2 ? 'right' : 'up'}
            delay={((i % 3) + 1) as 1 | 2 | 3}
          >
            <article
              className="group relative flex flex-col overflow-hidden rounded-2xl
                border border-[var(--color-border)]/70 bg-white
                p-6 transition-all duration-300
                hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/8
                hover:border-transparent"
              style={{
                '--accent': b.accent,
              } as React.CSSProperties}
            >
              {/* Top accent line */}
              <div
                className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: b.accent }}
              />

              {/* Icon */}
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl
                  transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${b.accent}18`, color: b.accent }}
              >
                {icons[b.key]}
              </div>

              {/* Text */}
              <h3
                className="text-lg font-semibold text-[var(--color-ink)]"
                style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              >
                {t(`${b.key}Title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                {t(`${b.key}Desc`)}
              </p>

              {/* Arrow indicator */}
              <div
                className="mt-5 flex items-center gap-1.5 text-xs font-semibold
                  opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ color: b.accent }}
              >
                Learn more
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </article>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
