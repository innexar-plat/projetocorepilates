'use client';

import { Card } from '@/components/atoms/Card';
import { MetricCard } from '@/components/molecules/MetricCard';
import { SimpleTable } from '@/components/organisms/SimpleTable';
import { useResource } from '@/hooks/use-resource';
import { portalService } from '@/services/portal.service';
import { useTranslations } from 'next-intl';

export function PortalDashboardContent() {
  const t = useTranslations('portal.dashboard');
  const me = useResource(() => portalService.getMe());
  const subscription = useResource(() => portalService.getSubscription());
  const bookings = useResource(() => portalService.getBookings());
  const payments = useResource(() => portalService.getPayments());

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{t('authenticated')}</p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{me.data?.name ?? '...'}</h2>
        <p className="text-sm text-[var(--color-muted)]">{me.data?.email ?? ''}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t('plan')}
          value={subscription.data?.plan?.name ?? t('noPlan')}
          hint={subscription.data?.status ?? t('noSubscription')}
        />
        <MetricCard
          label={t('classesUsed')}
          value={String(subscription.data?.classesUsedThisMonth ?? 0)}
          hint={t('currentCycle')}
        />
        <MetricCard label={t('bookings')} value={String(bookings.data?.length ?? 0)} hint={t('total')} />
        <MetricCard label={t('payments')} value={String(payments.data?.total ?? 0)} hint={t('records')} />
      </div>

      {bookings.error ? <p className="text-red-600">{bookings.error}</p> : null}
      <SimpleTable
        title={t('recentBookings')}
        rows={(bookings.data ?? []).slice(0, 8).map((item) => ({
          id: item.id,
          status: item.status,
          classSessionId: item.classSessionId,
        }))}
        columns={[
          { key: 'id', label: t('id') },
          { key: 'status', label: 'Status' },
          { key: 'classSessionId', label: t('session') },
        ]}
      />
    </div>
  );
}
