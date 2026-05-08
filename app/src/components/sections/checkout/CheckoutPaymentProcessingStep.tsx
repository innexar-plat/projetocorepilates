'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { portalService, type PortalFlowStatus } from '@/services/portal.service';
import { CheckoutStepper } from './CheckoutStepper';

type CheckoutPaymentProcessingStepProps = {
  locale: Locale;
};

const MAX_RETRIES = 30;
const POLL_INTERVAL_MS = 2500;

export function CheckoutPaymentProcessingStep({ locale }: CheckoutPaymentProcessingStepProps) {
  const t = useTranslations('checkoutFlow');
  const router = useRouter();

  const [flow, setFlow] = useState<PortalFlowStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const progressLabel = useMemo(() => {
    const percent = Math.min(Math.round((retryCount / MAX_RETRIES) * 100), 100);
    return t('processing.progress', { percent });
  }, [retryCount, t]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function checkFlowStatus() {
      try {
        const response = await portalService.getFlowStatus();
        if (!active) return;

        setFlow(response);

        if (response.profileCompleted) {
          router.replace('/portal/dashboard');
          return;
        }

        if (response.canStartOnboarding) {
          router.replace('/portal/onboarding');
          return;
        }

        if (retryCount >= MAX_RETRIES) {
          setIsChecking(false);
          setErrorMessage(t('processing.timeout'));
          return;
        }

        timer = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, POLL_INTERVAL_MS);
      } catch {
        if (!active) return;
        setIsChecking(false);
        setErrorMessage(t('processing.error'));
      }
    }

    checkFlowStatus();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [retryCount, router, t]);

  function retryNow() {
    setErrorMessage(null);
    setIsChecking(true);
    setRetryCount(0);
  }

  return (
    <main className="premium-bg mx-auto flex min-h-screen w-full max-w-5xl rounded-3xl px-4 py-8 sm:px-6">
      <div className="w-full space-y-6">
        <CheckoutStepper currentStep="payment" />

        <section className="glass-card rounded-3xl p-7 text-center sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">{t('steps.payment.title')}</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--color-ink)] sm:text-4xl">{t('processing.title')}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--color-muted)]">{t('processing.subtitle')}</p>

          <div className="mx-auto mt-8 h-16 w-16 animate-spin rounded-full border-4 border-[var(--color-brand)]/20 border-t-[var(--color-brand)]" />

          <p className="mt-5 text-sm font-semibold text-[var(--color-ink)]">{isChecking ? t('processing.checking') : t('processing.checked')}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{progressLabel}</p>

          {flow ? (
            <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-[var(--color-border)] bg-white/70 p-4 text-left text-sm text-[var(--color-muted)]">
              <p><span className="font-semibold text-[var(--color-ink)]">{t('processing.statusPlan')}:</span> {flow.hasPlan ? t('processing.yes') : t('processing.no')}</p>
              <p><span className="font-semibold text-[var(--color-ink)]">{t('processing.statusPayment')}:</span> {flow.hasPayment ? t('processing.yes') : t('processing.no')}</p>
              <p><span className="font-semibold text-[var(--color-ink)]">{t('processing.statusSubscription')}:</span> {flow.hasActiveSubscription ? t('processing.yes') : t('processing.no')}</p>
              <p><span className="font-semibold text-[var(--color-ink)]">{t('processing.nextStep')}:</span> {flow.nextStep}</p>
            </div>
          ) : null}

          {errorMessage ? (
            <p className="mx-auto mt-5 max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={retryNow}
              className="rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-dark)]"
            >
              {t('processing.retry')}
            </button>

            <Link
              href="/portal/onboarding"
              locale={locale}
              className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            >
              {t('processing.openOnboarding')}
            </Link>

            <Link
              href="/portal/pagamentos"
              locale={locale}
              className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            >
              {t('processing.openPayments')}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}