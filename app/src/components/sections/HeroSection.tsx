'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FadeIn } from '@/components/atoms/FadeIn';
import type { Locale } from '@/i18n/routing';

const PILATES_IMAGE = '/fundobraziliancorepilates.png';

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 10-16 0" />
      </svg>
    ),
    key: 'featureInstructors' as const,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 3l9 7v11a1 1 0 01-1 1H4a1 1 0 01-1-1V10z" /><path d="M9 22V12h6v10" />
      </svg>
    ),
    key: 'featureEnvironment' as const,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    key: 'featureAttention' as const,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    key: 'featureTransform' as const,
  },
] as const;

type Props = { locale: Locale };

export function HeroSection({ locale }: Props) {
  const t = useTranslations('home.hero');

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-[92vh] overflow-hidden flex items-center">

        {/* Background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${PILATES_IMAGE}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
          }}
        />

        {/* Gradient overlay — heavier on left for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(10,6,2,0.92) 0%, rgba(10,6,2,0.68) 48%, rgba(10,6,2,0.22) 100%)',
          }}
        />

        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-56"
          style={{ background: 'linear-gradient(to top, var(--color-paper) 0%, transparent 100%)' }}
        />

        {/* Content */}
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-32 pt-48 sm:px-8 lg:pb-40 lg:pt-56">
          <div className="max-w-3xl">

            <FadeIn variant="up" delay={1}>
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5
                  text-[11px] font-bold uppercase tracking-[0.22em] text-white/70"
                style={{
                  border: '1px solid rgba(196,151,90,0.35)',
                  background: 'rgba(196,151,90,0.12)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] animate-pulse" />
                Brazilian Core Pilates · Sebastian, FL
              </span>
            </FadeIn>

            {/* Big headline matching mockup */}
            <FadeIn variant="up" delay={2} className="mt-7">
              <h1
                className="font-black text-white leading-[0.96]"
                style={{
                  fontFamily: 'var(--font-display), Georgia, serif',
                  fontSize: 'clamp(52px, 8.5vw, 102px)',
                  letterSpacing: '-0.03em',
                }}
              >
                {t('headlineLine1')}
                <br />
                {t('headlineLine2')}
                <br />
                <span style={{ color: 'var(--color-brand)' }}>
                  {t('headlineLine3')}
                </span>
              </h1>
            </FadeIn>

            <FadeIn variant="up" delay={3} className="mt-7">
              <p
                className="text-[13px] font-semibold uppercase tracking-[0.22em] text-white/50"
                style={{ fontFamily: 'var(--font-body), sans-serif' }}
              >
                {t('tagline')}
              </p>
            </FadeIn>

            <FadeIn variant="up" delay={4} className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/cadastro"
                locale={locale}
                className="group inline-flex items-center gap-2 rounded-full
                  bg-[var(--color-brand)] px-8 py-3.5
                  text-sm font-bold uppercase tracking-[0.12em] text-white
                  shadow-lg shadow-[var(--color-brand)]/30
                  transition-all duration-200
                  hover:bg-[var(--color-brand-dark)] hover:scale-[1.03] hover:shadow-xl"
              >
                {t('ctaBook')}
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/aulas"
                locale={locale}
                className="inline-flex items-center gap-2 rounded-full
                  border border-white/30 bg-white/8 backdrop-blur-md
                  px-8 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white/85
                  transition-all duration-200
                  hover:bg-white/14 hover:border-white/50 hover:text-white"
              >
                {t('ctaSecondary')}
              </Link>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* ── Feature strip ─────────────────────────────────── */}
      <div className="relative z-10 border-y border-[var(--color-border)]/60 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="flex flex-wrap items-center justify-center divide-x divide-[var(--color-border)]/60">
            {FEATURES.map((f) => (
              <div key={f.key} className="flex items-center gap-2.5 px-4 py-4 sm:px-7">
                <span className="text-[var(--color-brand)] shrink-0">{f.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink)] whitespace-nowrap sm:text-[11px]">
                  {t(f.key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

