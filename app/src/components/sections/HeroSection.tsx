'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FadeIn } from '@/components/atoms/FadeIn';
import type { Locale } from '@/i18n/routing';

// Uses the custom background image placed in /public.
const PILATES_IMAGE = '/fundobraziliancorepilates.png';

const StarIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const UsersIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const AwardIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const STATS = [
  { key: 'stat1', Icon: AwardIcon },
  { key: 'stat2', Icon: UsersIcon },
  { key: 'stat3', Icon: StarIcon },
] as const;

type Props = { locale: Locale };

export function HeroSection({ locale }: Props) {
  const t = useTranslations('home.hero');

  return (
    /* -mt-16 pulls the section 64 px (= nav height) upward so the hero
       background sits flush behind the transparent sticky nav */
    <section className="relative -mt-16 min-h-screen overflow-hidden flex items-center">

      {/* Background image — plain CSS so the browser fetches Unsplash directly */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('${PILATES_IMAGE}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
        }}
      />

      {/* Dark warm scrim — heavier on left for text, opens right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(110deg, rgba(14,9,2,0.92) 0%, rgba(14,9,2,0.72) 42%, rgba(14,9,2,0.25) 100%)',
        }}
      />

      {/* Subtle warm vignette at edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 30% 50%, transparent 0%, rgba(10,7,2,0.35) 100%)',
        }}
      />

      {/* Bottom fade into page background */}
      <div
        className="absolute inset-x-0 bottom-0 h-48"
        style={{ background: 'linear-gradient(to top, var(--color-paper) 0%, transparent 100%)' }}
      />

      {/* Content — pt-52 accounts for nav (64px) + breathing room */}
      <div className="relative mx-auto w-full max-w-7xl px-6 pb-36 pt-52 sm:px-8 lg:pb-44 lg:pt-60">
        <div className="max-w-2xl">

          <FadeIn variant="up" delay={1}>
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5
                text-xs font-semibold uppercase tracking-[0.18em] text-white/80"
              style={{
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] animate-pulse" />
              Brazilian Core Pilates
            </span>
          </FadeIn>

          <FadeIn variant="up" delay={2} className="mt-6">
            <h1
              className="font-bold leading-[1.03] text-white"
              style={{
                fontFamily: 'var(--font-display), Georgia, serif',
                fontSize: 'clamp(52px, 8vw, 96px)',
                letterSpacing: '-0.03em',
              }}
            >
              {t('headlinePart1')}
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(135deg,#3c8ea8 0%,#7eb8ca 50%,#2f7084 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t('headlinePart2')}
              </span>
            </h1>
          </FadeIn>

          <FadeIn variant="up" delay={3} className="mt-6">
            <p
              className="max-w-lg text-lg leading-relaxed text-white/65"
              style={{ fontFamily: 'var(--font-body), sans-serif' }}
            >
              {t('subheadline')}
            </p>
          </FadeIn>

          <FadeIn variant="up" delay={4} className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/planos"
              locale={locale}
              className="group inline-flex items-center gap-2 rounded-xl
                bg-[var(--color-brand)] px-8 py-3.5
                text-base font-semibold text-white
                shadow-lg shadow-black/30
                transition-all duration-200
                hover:bg-[var(--color-brand-dark)] hover:scale-[1.03] hover:shadow-xl"
            >
              {t('cta')}
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/aulas"
              locale={locale}
              className="inline-flex items-center gap-2 rounded-xl
                border border-white/35 bg-white/8 backdrop-blur-md
                px-8 py-3.5 text-base font-semibold text-white/90
                transition-all duration-200
                hover:bg-white/15 hover:border-white/55 hover:text-white"
            >
              {t('ctaSecondary')}
            </Link>
          </FadeIn>

          {/* Stats row */}
          <FadeIn variant="up" delay={5} className="mt-14 flex items-center gap-8 lg:gap-12">
            {STATS.map((s) => (
              <div key={s.key} className="border-l border-white/15 pl-6 first:border-0 first:pl-0">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-brand)]">
                    <s.Icon />
                  </span>
                  <p
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '-0.02em' }}
                  >
                    {t(`${s.key}Value`)}
                  </p>
                </div>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                  {t(`${s.key}Label`)}
                </p>
              </div>
            ))}
          </FadeIn>

        </div>
      </div>

      {/* Floating badge — bottom-right, desktop only */}
      <div
        className="absolute bottom-20 right-8 hidden lg:flex items-center gap-3
          rounded-2xl px-5 py-4 shadow-2xl"
        style={{
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <span className="text-[var(--color-brand)]">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-white">5.0 Google Reviews</p>
          <p className="text-xs text-white/50">{t('award')}</p>
        </div>
      </div>
    </section>
  );
}

