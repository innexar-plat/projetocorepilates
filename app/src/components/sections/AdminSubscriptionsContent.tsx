'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge, statusVariant } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

export function AdminSubscriptionsContent() {
  const t = useTranslations('admin.subscriptions');
  const tc = useTranslations('admin.common');

  const SUB_STATUS_LABEL: Record<string, string> = {
    ACTIVE: t('statusActive'), CANCELED: t('statusCanceled'),
    EXPIRED: t('statusExpired'), PAUSED: t('statusPaused'),
  };

  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);

  const subscriptions = useResource(
    () => adminService.listSubscriptions(1, 50, activeStatus),
    [activeStatus],
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveStatus(undefined)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeStatus === undefined
              ? 'bg-[#3c8ea8] text-white'
              : 'bg-white border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8]'
          }`}
        >
          {tc('all')}
        </button>
        {Object.entries(SUB_STATUS_LABEL).map(([s, label]) => (
          <button
            key={s}
            onClick={() => setActiveStatus(activeStatus === s ? undefined : s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeStatus === s
                ? 'bg-[#3c8ea8] text-white'
                : 'bg-white border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8]'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-sm text-[#8097a3]">
          {!subscriptions.isLoading && subscriptions.data ? t('count', { count: subscriptions.data.total }) : ''}
        </span>
      </div>

      {subscriptions.isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : subscriptions.error ? (
        <ErrorState message={subscriptions.error} />
      ) : (
        <DataTable
          keyField="id"
          emptyText={t('noResults')}
          rows={subscriptions.data?.data ?? []}
          columns={[
            { key: 'user', label: t('colStudent'), render: (v) => (v as any)?.name ?? '—' },
            { key: 'plan', label: t('colPlan'), render: (v) => (v as any)?.name ?? '—' },
            { key: 'status', label: t('colStatus'),
              render: (v) => (
                <StatusBadge
                  label={SUB_STATUS_LABEL[v as string] ?? (v as string)}
                  variant={statusVariant(v as string)}
                />
              ),
            },
            {
              key: 'createdAt',
              label: t('colStart'),
              render: (v) => v ? new Date(v as string).toLocaleDateString('en-US') : '—',
            },
            {
              key: 'currentPeriodEnd',
              label: t('colExpiry'),
              render: (v) => v ? new Date(v as string).toLocaleDateString('en-US') : '—',
            },
          ]}
        />
      )}
    </div>
  );
}

