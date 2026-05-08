'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge, statusVariant } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#d4e2e5] bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-[#8097a3]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1f2e35]">{value}</p>
    </div>
  );
}

function formatUSD(dollars: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars);
}

export function AdminFinanceiroContent() {
  const t = useTranslations('admin.finance');
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);

  const PAYMENT_STATUS_LABEL: Record<string, string> = {
    PENDING: t('statusPending'),
    PAID: t('statusPaid'),
    FAILED: t('statusFailed'),
    REFUNDED: t('statusRefunded'),
  };

  const payments = useResource(
    () => adminService.listPayments(1, 50, activeStatus),
    [activeStatus],
  );

  const paidPayments = (payments.data?.data ?? []).filter((p) => p.status === 'PAID');
  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const pendingCount = (payments.data?.data ?? []).filter((p) => p.status === 'PENDING').length;
  const failedCount = (payments.data?.data ?? []).filter((p) => p.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {/* KPI Cards */}
      {!payments.isLoading && payments.data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label={t('kpiTotal')} value={formatUSD(totalPaid)} />
          <KpiCard label={t('kpiPayments')} value={String(paidPayments.length)} />
          <KpiCard label={t('kpiPending')} value={String(pendingCount)} />
          <KpiCard label={t('kpiFailed')} value={String(failedCount)} />
        </div>
      )}

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
          {t('colStatus')}
        </button>
        {Object.entries(PAYMENT_STATUS_LABEL).map(([s, label]) => (
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
          {!payments.isLoading && payments.data ? t('count', { count: payments.data.total }) : ''}
        </span>
      </div>

      {payments.isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : payments.error ? (
        <ErrorState message={payments.error} />
      ) : (
        <DataTable
          keyField="id"
          emptyText={t('noResults')}
          rows={payments.data?.data ?? []}
          columns={[
            { key: 'user', label: t('colStudent'), render: (v) => (v as any)?.name ?? 'ï¿½' },
            {
              key: 'amount',
              label: t('colAmount'),
              render: (v) => <span className="font-medium text-[#1f2e35]">{formatUSD(v as number)}</span>,
            },
            { key: 'description', label: t('colDescription'), render: (v) => (v as string) || 'ï¿½' },
            {
              key: 'status',
              label: t('colStatus'),
              render: (v) => (
                <StatusBadge
                  label={PAYMENT_STATUS_LABEL[v as string] ?? (v as string)}
                  variant={statusVariant(v as string)}
                />
              ),
            },
            {
              key: 'createdAt',
              label: t('colDate'),
              render: (v) => new Date(v as string).toLocaleDateString('en-US'),
            },
            {
              key: 'currency',
              label: t('colCurrency'),
              render: (v) => <span className="font-mono text-xs text-[#8097a3]">{(v as string)?.toUpperCase() ?? '\u2014'}</span>,
            },
          ]}
        />
      )}
    </div>
  );
}

