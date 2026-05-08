'use client';

import { useTranslations } from 'next-intl';

type CheckoutStepperProps = {
  currentStep: 'class' | 'account' | 'review' | 'payment';
};

const STEP_ORDER = ['plan', 'class', 'account', 'review', 'payment', 'onboarding'] as const;

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  const t = useTranslations('checkoutFlow');
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <section className="glass-card rounded-3xl p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">{t('journey')}</p>
      <h2 className="mt-1 text-xl font-black text-[var(--color-ink)]">{t('title')}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {STEP_ORDER.map((stepId, index) => {
          const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'pending';
          const badgeClass =
            state === 'done'
              ? 'bg-emerald-100 text-emerald-700'
              : state === 'active'
                ? 'bg-[var(--color-brand)]/15 text-[var(--color-brand)]'
                : 'bg-amber-100 text-amber-700';

          return (
            <div key={stepId} className="rounded-xl border border-[var(--color-border)] bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  {t('stepLabel', { count: index + 1 })}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${badgeClass}`}>
                  {t(`status.${state}`)}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-[var(--color-ink)]">{t(`steps.${stepId}.title`)}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">{t(`steps.${stepId}.description`)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}