'use client';

import { StatCard } from '@/components/atoms/StatCard';
import { StatusBadge, statusVariant } from '@/components/atoms/StatusBadge';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonStats, SkeletonTable } from '@/components/molecules/AdminStates';
import { DataTable } from '@/components/organisms/DataTable';
import { useResource } from '@/hooks/use-resource';
import { adminService } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

export function AdminDashboardContent() {
  const t = useTranslations('admin.dashboard');
  const analytics = useResource(() => adminService.getAnalytics());
  const users = useResource(() => adminService.listUsers());

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {/* Stats */}
      {analytics.isLoading ? (
        <SkeletonStats count={6} />
      ) : analytics.error ? (
        <ErrorState message={analytics.error} />
      ) : analytics.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label={t('students')}
            value={String(analytics.data.users.total)}
            hint={t('thisMonth', { n: analytics.data.users.newThisMonth })}
            trend="up"
            trendValue={`${analytics.data.users.newThisMonth}`}
            icon="US"
            delay={0}
          />
          <StatCard
            label={t('mrr')}
            value={`$\u00a0${analytics.data.subscriptions.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            hint={t('activeSubscriptions')}
            icon="MR"
            delay={80}
          />
          <StatCard
            label={t('revenue')}
            value={`$\u00a0${analytics.data.revenue.thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            hint={t('approvedPayments')}
            icon="RV"
            delay={160}
          />
          <StatCard
            label={t('leads')}
            value={String(analytics.data.leads.total)}
            hint={t('conversionRate', { n: analytics.data.leads.conversionRate })}
            icon="LD"
            delay={240}
          />
          <StatCard
            label={t('bookings')}
            value={String(analytics.data.bookings.totalThisMonth)}
            hint={t('cancellationRate', { n: analytics.data.bookings.cancellationRate })}
            icon="BK"
            delay={320}
          />
          <StatCard
            label={t('openTickets')}
            value={String(analytics.data.support.openTickets)}
            hint={t('activeSupport')}
            icon="TK"
            delay={400}
          />
        </div>
      ) : null}

      {/* Subscription breakdown */}
      {analytics.data && (
        <div className="animate-fade-up delay-300 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t('subActive'),   val: analytics.data.subscriptions.active,   v: 'success' },
            { label: t('subTrial'),    val: analytics.data.subscriptions.trialing, v: 'gold' },
            { label: t('subExpired'),  val: analytics.data.subscriptions.pastDue,  v: 'warning' },
            { label: t('subCanceled'), val: analytics.data.subscriptions.canceled, v: 'error' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between rounded-2xl border border-[#e5dfc9] bg-white px-5 py-4 shadow-sm"
            >
              <p className="text-sm font-medium text-[#5f7480]">{s.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#1f2e35]">{s.val}</span>
                <StatusBadge label={s.label} variant={s.v as 'success' | 'gold' | 'warning' | 'error'} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent users */}
      <div className="animate-fade-up delay-400 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#5f7480]">{t('recentStudents')}</h2>
        {users.isLoading ? (
          <SkeletonTable rows={5} cols={4} />
        ) : users.error ? (
          <ErrorState message={users.error} />
        ) : (
          <DataTable
            keyField="id"
            rows={(users.data?.data ?? []).slice(0, 8).map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              createdAt: new Date(u.createdAt).toLocaleDateString('en-US'),
            }))}
            columns={[
              { key: 'name', label: t('colName') },
              { key: 'email', label: t('colEmail') },
              {
                key: 'role',
                label: t('colRole'),
                render: (v) => (
                  <StatusBadge label={String(v)} variant={v === 'ADMIN' ? 'gold' : 'neutral'} />
                ),
              },
              { key: 'createdAt', label: t('colJoined'), className: 'text-[#5f7480]' },
            ]}
          />
        )}
      </div>
    </div>
  );
}

