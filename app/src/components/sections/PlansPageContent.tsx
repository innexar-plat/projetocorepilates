'use client';

import { FadeIn } from '@/components/atoms/FadeIn';
import { PlanCard } from '@/components/molecules/PlanCard';
import { useResource } from '@/hooks/use-resource';
import { websiteService } from '@/services/website.service';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';

export function PlansPageContent() {
  const t = useTranslations('plans');
  const locale = useLocale() as Locale;
  const classesPerMonthLabel = String(t.raw('classesPerMonth'));
  const plans = useResource(() => websiteService.listPlans());

  const hasPlans = Boolean(plans.data && plans.data.length > 0);

  return (
    <div className="premium-bg mx-auto w-full max-w-7xl rounded-3xl px-4 py-16 sm:px-6">
      <FadeIn variant="up" className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
          {t('eyebrow')}
        </p>
        <h1 className="mt-2 text-4xl font-black text-[var(--color-ink)] sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--color-muted)]">
          {t('subtitle')}
        </p>
        {!plans.isLoading && !hasPlans && !plans.error && (
          <p className="mt-3 text-sm text-[var(--color-muted)]/70">
            {locale === 'pt'
              ? 'Nenhum plano ativo encontrado no momento. Fale com nossa equipe para mais detalhes.'
              : locale === 'es'
                ? 'No se encontraron planes activos por ahora. Habla con nuestro equipo para más detalles.'
                : 'No active plans found right now. Contact our team for more details.'}
          </p>
        )}
      </FadeIn>

      {plans.isLoading && (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-[var(--color-paper-2)]" />
          ))}
        </div>
      )}

      {plans.error && (
        <p className="mt-8 text-center text-red-600">{plans.error}</p>
      )}

      {!plans.isLoading && hasPlans && (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.data!.map((plan, i) => (
            <FadeIn key={plan.id} variant="up" delay={((i % 3) + 1) as 1 | 2 | 3}>
              <PlanCard
                planId={plan.id}
                name={plan.name}
                description={plan.description ?? null}
                price={plan.price}
                isPromotion={plan.isPromotion}
                originalPrice={plan.originalPrice}
                promotionalPrice={plan.promotionalPrice}
                classesPerMonth={plan.classesPerMonth ?? 999}
                featured={i === 1}
                ctaLabel={t('cta')}
                unlimitedLabel={t('unlimited')}
                classesLabel={classesPerMonthLabel}
                perMonthLabel={t('perMonth')}
                locale={locale}
              />
            </FadeIn>
          ))}
        </div>
      )}

      {/* FAQ teaser */}
      <FadeIn variant="up" className="glass-card mt-20 rounded-2xl p-8 text-center">
        <p className="text-lg font-bold text-[var(--color-ink)]">{t('faqTitle')}</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t('faqSubtitle')}</p>
        <a
          href="/contato"
          className="mt-4 inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--color-brand)] transition-colors hover:bg-[var(--color-brand)] hover:text-white"
        >
          {t('faqCta')} →
        </a>
      </FadeIn>
    </div>
  );
}

