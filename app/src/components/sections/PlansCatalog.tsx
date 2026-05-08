'use client';

import { Card } from '@/components/atoms/Card';
import { useResource } from '@/hooks/use-resource';
import { websiteService } from '@/services/website.service';
import { useTranslations } from 'next-intl';

export function PlansCatalog() {
  const t = useTranslations('plans');
  const plans = useResource(() => websiteService.listPlans());

  if (plans.isLoading) return <p>{t('loading')}</p>;
  if (plans.error) return <p className="text-red-600">{plans.error}</p>;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(plans.data ?? []).map((plan) => (
        <Card key={plan.id}>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
            {plan.classesPerMonth >= 999 ? t('unlimited') : t('classesPerMonth', { count: plan.classesPerMonth })}
          </p>
          <h3 className="mt-2 text-xl font-bold text-[var(--color-ink)]">{plan.name}</h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{plan.description ?? t('noDescription')}</p>
          <p className="mt-5 text-2xl font-black text-[var(--color-ink)]">
            {plan.isPromotion && plan.originalPrice && Number(plan.originalPrice) > Number(plan.price) && (
              <span className="mr-2 text-sm font-semibold text-[var(--color-muted)] line-through">
                ${Number(plan.originalPrice).toFixed(2)}
              </span>
            )}
            ${Number(plan.promotionalPrice ?? plan.price).toFixed(2)}{t('perMonth')}
          </p>
        </Card>
      ))}
    </div>
  );
}
