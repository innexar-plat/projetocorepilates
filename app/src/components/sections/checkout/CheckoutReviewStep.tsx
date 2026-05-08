'use client';

import { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/atoms/Button';
import type { Locale } from '@/i18n/routing';
import { useResource } from '@/hooks/use-resource';
import { useTranslations } from 'next-intl';
import { buildCheckoutQuery, buildTurmaGroups, fetchCheckoutContext } from '@/utils/checkout-flow';
import { CheckoutStepper } from './CheckoutStepper';

type CheckoutReviewStepProps = {
  planId: string;
  sessionId: string;
  locale: Locale;
};

export function CheckoutReviewStep({ planId, sessionId, locale }: CheckoutReviewStepProps) {
  const t = useTranslations('checkoutFlow');
  const router = useRouter();
  const resource = useResource(() => fetchCheckoutContext(planId), [planId]);
  const turmaGroups = buildTurmaGroups(resource.data?.sessions ?? [], locale);
  const selectedGroup = turmaGroups.find((group) => group.sessions.some((session) => session.id === sessionId));

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getSession().then((session) => setIsAuthenticated(Boolean(session?.user?.id))).catch(() => undefined);
  }, []);

  async function handleStartCheckout() {
    setErrorMessage(null);

    if (!selectedGroup) {
      setErrorMessage(t('review.classUnavailable'));
      return;
    }

    const currentSession = await getSession();
    if (!currentSession?.user?.id) {
      router.push(`/checkout/conta?${buildCheckoutQuery({ plan: planId, session: sessionId })}`);
      return;
    }

    setIsStartingCheckout(true);

    try {
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/${locale}/checkout/processando?checkout=success`;
      const cancelUrl = `${baseUrl}/${locale}/checkout/revisao?${buildCheckoutQuery({ plan: planId, session: sessionId })}`;

      const response = await fetch('/api/v1/subscriptions/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          classSessionId: sessionId,
          successUrl,
          cancelUrl,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { message?: string })?.message ?? t('review.paymentStartError'));
      }

      const payloadData = (payload as { data?: unknown })?.data;
      const checkoutUrl =
        typeof payloadData === 'object' && payloadData !== null && 'data' in payloadData
          ? ((payloadData as { data?: { url?: string } }).data?.url ?? undefined)
          : ((payloadData as { url?: string } | undefined)?.url ?? undefined);

      if (!checkoutUrl) {
        throw new Error(t('review.paymentUrlMissing'));
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('review.paymentStartError'));
      setIsStartingCheckout(false);
    }
  }

  return (
    <main className="premium-bg mx-auto flex min-h-screen w-full max-w-6xl rounded-3xl px-4 py-8 sm:px-6">
      <div className="w-full space-y-6">
        <CheckoutStepper currentStep="review" />

        <div className="grid w-full gap-6 lg:grid-cols-[1fr_0.92fr]">
          <section className="glass-card rounded-3xl p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/checkout/conta?${buildCheckoutQuery({ plan: planId, session: sessionId })}`}
                locale={locale}
                className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              >
                  {t('review.backAccount')}
              </Link>
              <Link
                href={`/checkout/turma?${buildCheckoutQuery({ plan: planId })}`}
                locale={locale}
                className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              >
                  {t('review.changeClass')}
              </Link>
            </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">{t('steps.review.title')}</p>
              <h1 className="mt-2 text-3xl font-black text-[var(--color-ink)]">{t('review.heading')}</h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
                {t('review.subtitle')}
            </p>

              {resource.isLoading ? <p className="mt-5 text-sm text-[var(--color-muted)]">{t('review.loadingReview')}</p> : null}
            {resource.error ? (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{resource.error}</p>
            ) : null}

            {selectedGroup ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{t('review.planLabel')}</p>
                  <p className="mt-1 text-xl font-bold text-[var(--color-ink)]">{resource.data?.plan.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{resource.data?.plan.description ?? t('review.planFallback')}</p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{t('review.classLabel')}</p>
                  <p className="mt-1 text-xl font-bold text-[var(--color-ink)]">{selectedGroup.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{selectedGroup.instructor}</p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{t('review.routineLabel')}</p>
                  <div className="mt-2 space-y-2 text-sm text-[var(--color-muted)]">
                      <p><span className="font-semibold text-[var(--color-ink)]">{t('review.daysLabel')}:</span> {selectedGroup.daysLabel}</p>
                      <p><span className="font-semibold text-[var(--color-ink)]">{t('review.timeLabel')}:</span> {selectedGroup.timeLabel}</p>
                      <p><span className="font-semibold text-[var(--color-ink)]">{t('review.durationLabel')}:</span> {t('class.duration', { count: selectedGroup.durationMin })}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{t('review.firstClassLabel')}</p>
                  <div className="mt-2 space-y-2 text-sm text-[var(--color-muted)]">
                      <p><span className="font-semibold text-[var(--color-ink)]">{t('review.dateLabel')}:</span> {selectedGroup.nextSessionLabel}</p>
                      <p><span className="font-semibold text-[var(--color-ink)]">{t('review.slotsLabel')}:</span> {selectedGroup.nextAvailableSlots}/{selectedGroup.maxCapacity}</p>
                      <p><span className="font-semibold text-[var(--color-ink)]">{t('review.openSessionsLabel')}:</span> {selectedGroup.totalSessions}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {!isAuthenticated ? (
              <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {t('review.authRequired')}
              </p>
            ) : null}

            {errorMessage ? (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
            ) : null}
          </section>

          <section className="glass-card rounded-3xl p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">{t('steps.payment.title')}</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">{t('review.paymentTitle')}</h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
              <p>{t('review.paymentStep1')}</p>
              <p>{t('review.paymentStep2')}</p>
              <p>{t('review.paymentStep3')}</p>
            </div>

            <Button
              type="button"
              className="mt-6 w-full"
              onClick={handleStartCheckout}
              disabled={resource.isLoading || !selectedGroup || isStartingCheckout}
            >
              {isStartingCheckout ? t('review.redirectingPayment') : t('review.continuePayment')}
            </Button>

            <p className="mt-4 text-xs text-[var(--color-muted)]">
              {t('review.cancelHint')}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}