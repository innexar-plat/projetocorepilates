'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { useMemo } from 'react';
import { useResource } from '@/hooks/use-resource';
import { buildCheckoutQuery, buildTurmaGroups, fetchCheckoutContext } from '@/utils/checkout-flow';
import { CheckoutStepper } from './CheckoutStepper';

type CheckoutClassStepProps = {
  planId: string;
  locale: Locale;
};

export function CheckoutClassStep({ planId, locale }: CheckoutClassStepProps) {
  const t = useTranslations('checkoutFlow');
  const resource = useResource(() => fetchCheckoutContext(planId), [planId]);
  const turmaGroups = useMemo(
    () => buildTurmaGroups(resource.data?.sessions ?? [], locale),
    [locale, resource.data?.sessions],
  );

  return (
    <main className="premium-bg mx-auto flex min-h-screen w-full max-w-6xl rounded-3xl px-4 py-8 sm:px-6">
      <div className="w-full space-y-6">
        <CheckoutStepper currentStep="class" />

        <section className="glass-card rounded-3xl p-6 sm:p-7">
          <Link
            href="/planos"
            locale={locale}
            className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
          >
            {t('backPlans')}
          </Link>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">{t('steps.class.title')}</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--color-ink)]">{t('class.heading')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">{t('class.subtitle')}</p>

          {resource.isLoading ? <p className="mt-5 text-sm text-[var(--color-muted)]">{t('loading')}</p> : null}

          {resource.data?.plan ? (
            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{t('selectedPlan')}</p>
              <h2 className="mt-1 text-xl font-bold text-[var(--color-ink)]">{resource.data.plan.name}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{resource.data.plan.description ?? t('planFallback')}</p>
            </div>
          ) : null}

          {resource.error ? (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{resource.error}</p>
          ) : null}

          {!resource.isLoading && !resource.error ? (
            <div className="mt-8 space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{t('class.catalogTitle')}</p>
                  <p className="text-sm text-[var(--color-muted)]">{t('class.catalogSubtitle', { count: turmaGroups.length })}</p>
                </div>
                <p className="text-xs text-[var(--color-muted)]">{t('class.autoBookingHint')}</p>
              </div>

              {turmaGroups.length === 0 ? (
                <p className="rounded-xl border border-[var(--color-border)] bg-white/70 px-4 py-3 text-sm text-[var(--color-muted)]">
                  {t('class.empty')}
                </p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {turmaGroups.map((group) => (
                    <article key={group.key} className="rounded-2xl border border-[var(--color-border)] bg-white/80 p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">{t('class.cardLabel')}</p>
                          <h3 className="mt-1 text-xl font-black text-[var(--color-ink)]">{group.title}</h3>
                          <p className="mt-1 text-sm text-[var(--color-muted)]">{group.instructor}</p>
                        </div>
                        <span className="rounded-full bg-[var(--color-brand)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
                          {t('class.duration', { count: group.durationMin })}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{t('class.days')}</p>
                          <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{group.daysLabel}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{t('class.time')}</p>
                          <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{group.timeLabel}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{t('class.nextClass')}</p>
                          <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{group.nextSessionLabel}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{t('class.slots')}</p>
                          <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                            {t('class.slotCount', { count: group.nextAvailableSlots, total: group.maxCapacity })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-4">
                        <p className="text-xs text-[var(--color-muted)]">{t('class.upcomingCount', { count: group.totalSessions })}</p>
                        <Link
                          href={`/checkout/conta?${buildCheckoutQuery({ plan: planId, session: group.nextSessionId })}`}
                          locale={locale}
                          className="rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--color-brand)]/25 transition-colors hover:bg-[var(--color-brand-dark)]"
                        >
                          {t('class.select')}
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}