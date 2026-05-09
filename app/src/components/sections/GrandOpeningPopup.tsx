'use client';

import { useEffect, useState } from 'react';
import { getMarketingContent } from '@/lib/site-content';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { PreRegistrationCard } from '@/components/sections/PreRegistrationCard';

const DISMISS_KEY = 'bcp-grand-opening-popup-v1';
const OPEN_DELAY_MS = 30_000;

type Props = { locale: Locale };

export function GrandOpeningPopup({ locale }: Readonly<Props>) {
  const marketing = getMarketingContent(locale);
  const copy = marketing.popup;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    if (globalThis.localStorage.getItem(DISMISS_KEY) === 'hidden') return;
    const timer = globalThis.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => globalThis.clearTimeout(timer);
  }, []);

  function closePopup() {
    setOpen(false);
    if (globalThis.window !== undefined) {
      globalThis.localStorage.setItem(DISMISS_KEY, 'hidden');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closePopup}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-[1.75rem] bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]"
        style={{ animation: 'fadeUp 220ms ease both' }}
      >
        {/* Close button */}
        <button
          onClick={closePopup}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-white transition hover:bg-black/20 sm:right-5 sm:top-5"
          aria-label="Close popup"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left â€” event info */}
            <div className="bg-[linear-gradient(180deg,rgba(22,30,36,1),rgba(28,40,46,0.98))] p-6 text-white sm:p-8">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                  {copy.badge}
                </span>
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                  {copy.eyebrow}
                </span>
              </div>

              {/* Title */}
              <h2
                className="mt-5 text-2xl font-black leading-tight text-white sm:text-3xl"
                style={{ fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '-0.025em' }}
              >
                {copy.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/70">{copy.subtitle}</p>
              <p className="mt-2 text-xs text-white/50">{copy.note}</p>

              {/* CTA buttons */}
              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <Link
                  href="/professores"
                  locale={locale}
                  onClick={closePopup}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-brand)] px-5 py-2.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--color-brand-dark)] sm:w-auto"
                >
                  {copy.primaryCta}
                </Link>
                <a
                  href="#popup-pre-registration-form"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] sm:w-auto"
                >
                  {copy.secondaryCta}
                </a>
              </div>

              {/* Date/Time/Location */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{copy.dateLabel}</p>
                  <p className="mt-2 text-sm font-semibold">{copy.dateValue}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{copy.timeLabel}</p>
                  <p className="mt-2 text-sm font-semibold">{copy.timeValue}</p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{copy.locationLabel}</p>
                <p className="mt-2 text-sm font-semibold">{copy.locationValue}</p>
              </div>

              {/* Highlights */}
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{copy.highlightsLabel}</p>
                <ul className="mt-3 space-y-2 text-sm text-white/80">
                  {copy.highlights.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-[var(--color-brand)]">â€¢</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Founders */}
              <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{copy.teachersLabel}</p>
                  <p className="mt-2 text-sm font-semibold">{copy.teachersValue}</p>
                </div>
                <Link
                  href="/professores"
                  locale={locale}
                  onClick={closePopup}
                  className="w-full rounded-full border border-white/15 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] sm:w-auto"
                >
                  {marketing.teachersNavLabel}
                </Link>
              </div>
            </div>

            {/* Right â€” form */}
            <div id="popup-pre-registration-form" className="p-6 sm:p-8">
              <PreRegistrationCard
                locale={locale}
                source={`grand-opening-popup-${locale}`}
                compact
                onSuccess={closePopup}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

