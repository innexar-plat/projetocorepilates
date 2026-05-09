'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { PreRegistrationCard } from '@/components/sections/PreRegistrationCard';
import { getMarketingContent } from '@/lib/site-content';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

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

  return (
    <Modal title={copy.title} open={open} onClose={closePopup} size="lg">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <div className="rounded-3xl bg-[linear-gradient(180deg,rgba(25,36,43,1),rgba(31,46,53,0.96))] p-4 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
              {copy.badge}
            </span>
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
              {copy.eyebrow}
            </span>
          </div>

          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-white sm:text-lg">{copy.subtitle}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/72">{copy.note}</p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/professores" locale={locale} className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-brand)] px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--color-brand-dark)] sm:w-auto">
              {copy.primaryCta}
            </Link>
            <a href="#popup-pre-registration-form" className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] sm:w-auto">
              {copy.secondaryCta}
            </a>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{copy.dateLabel}</p>
              <p className="mt-2 text-sm font-semibold">{copy.dateValue}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{copy.timeLabel}</p>
              <p className="mt-2 text-sm font-semibold">{copy.timeValue}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{copy.locationLabel}</p>
            <p className="mt-2 text-sm font-semibold">{copy.locationValue}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{copy.highlightsLabel}</p>
            <ul className="mt-3 grid gap-2 text-sm text-white/85">
              {copy.highlights.map((item) => (
                <li key={item} className="flex gap-2 rounded-2xl border border-white/10 bg-black/10 px-3 py-3">
                  <span className="text-[var(--color-brand)]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{copy.teachersLabel}</p>
              <p className="mt-2 text-sm font-semibold">{copy.teachersValue}</p>
            </div>
            <Link href="/professores" locale={locale} className="w-full rounded-full border border-white/15 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] sm:w-auto">
              {marketing.teachersNavLabel}
            </Link>
          </div>
        </div>

        <div id="popup-pre-registration-form">
          <PreRegistrationCard locale={locale} source={`grand-opening-popup-${locale}`} compact onSuccess={closePopup} />
        </div>
      </div>
    </Modal>
  );
}