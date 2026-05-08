'use client';

import { FadeIn } from '@/components/atoms/FadeIn';
import { useTranslations } from 'next-intl';

const QuoteIcon = () => (
  <svg className="h-8 w-8" viewBox="0 0 32 32" fill="currentColor">
    <path d="M10 8C6.134 8 3 11.134 3 15v1c0 3.866 3.134 7 7 7h1v-6H8c-.552 0-1-.448-1-1v-1c0-2.761 2.239-5 5-5V8zm15 0c-3.866 0-7 3.134-7 15v1c0 3.866 3.134 7 7 7h1v-6h-3c-.552 0-1-.448-1-1v-1c0-2.761 2.239-5 5-5V8z" opacity=".15"/>
    <path d="M9 7C5.134 7 2 10.134 2 14v1c0 3.866 3.134 7 7 7h1v-5H7c-.552 0-1-.448-1-1v-1c0-2.761 2.239-5 5-5V7zm14 0c-3.866 0-7 3.134-7 7v1c0 3.866 3.134 7 7 7h1v-5h-3c-.552 0-1-.448-1-1v-1c0-2.761 2.239-5 5-5V7z"/>
  </svg>
);

const StarIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const TESTIMONIALS = [
  { key: 'alice',  initials: 'AJ', color: '#DEB557' },
  { key: 'maria',  initials: 'MS', color: '#7B9E6B' },
  { key: 'carlos', initials: 'CR', color: '#6B8FAE' },
] as const;

export function TestimonialsSection() {
  const t = useTranslations('home.testimonials');

  return (
    <section className="relative overflow-hidden py-24">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-[var(--color-ink)]" />
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(219,180,87,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">

        <FadeIn variant="up" className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">
            {t('eyebrow')}
          </p>
          <h2
            className="mt-3 text-4xl font-bold text-white sm:text-5xl"
            style={{ fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '-0.025em' }}
          >
            {t('title')}
          </h2>
        </FadeIn>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item, i) => (
            <FadeIn key={item.key} variant="up" delay={((i + 1) as 1 | 2 | 3)}>
              <article
                className="group relative flex flex-col rounded-2xl p-8
                  transition-all duration-300 hover:-translate-y-1.5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Quote mark */}
                <span className="text-[var(--color-brand)] opacity-60">
                  <QuoteIcon />
                </span>

                {/* Stars */}
                <div className="mt-4 flex gap-0.5 text-[var(--color-brand)]">
                  {Array.from({ length: 5 }).map((_, j) => <StarIcon key={j} />)}
                </div>

                {/* Quote text */}
                <p className="mt-4 flex-1 text-base leading-relaxed text-white/70">
                  &ldquo;{t(`${item.key}Quote`)}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center
                      rounded-full text-xs font-bold text-white"
                    style={{ background: item.color }}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t(`${item.key}Name`)}</p>
                    <p className="text-xs text-white/45">{t(`${item.key}Role`)}</p>
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
