'use client';

import { useState, useCallback } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { Modal } from '@/components/molecules/Modal';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge, statusVariant } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService, type AdminBooking } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

const BOOKING_STATUSES = ['CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELED'] as const;

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1f2e35] px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
      {message}
    </div>
  );
}

export function AdminBookingsContent() {
  const t = useTranslations('admin.bookings');
  const tc = useTranslations('admin.common');

  const STATUS_LABEL: Record<string, string> = {
    CONFIRMED: t('statusConfirmed'), ATTENDED: t('statusPresent'),
    NO_SHOW: t('statusAbsent'), CANCELED: t('statusCanceled'),
  };

  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [statusTarget, setStatusTarget] = useState<AdminBooking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminBooking | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const bookings = useResource(
    () => adminService.listBookings(1, 50, activeStatus),
    [activeStatus, refreshKey],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openStatusModal(b: AdminBooking) {
    setStatusTarget(b);
    setNewStatus(b.status);
  }

  async function handleStatusUpdate() {
    if (!statusTarget) return;
    setIsSubmitting(true);
    try {
      await adminService.updateBookingStatus(statusTarget.id, newStatus);
      showToast(t('toastStatusUpdated'));
      setStatusTarget(null);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastStatusError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setIsSubmitting(true);
    try {
      await adminService.cancelBooking(cancelTarget.id);
      showToast(t('toastCanceled'));
      setCancelTarget(null);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastCancelError'));
    } finally {
      setIsSubmitting(false);
    }
  }

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
        {BOOKING_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(activeStatus === s ? undefined : s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeStatus === s
                ? 'bg-[#3c8ea8] text-white'
                : 'bg-white border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8]'
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
        <span className="ml-auto text-sm text-[#8097a3]">
          {!bookings.isLoading && bookings.data ? t('count', { count: bookings.data.total }) : ''}
        </span>
      </div>

      {bookings.isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : bookings.error ? (
        <ErrorState message={bookings.error} />
      ) : (
        <DataTable
          keyField="id"
          emptyText={t('noResults')}
          rows={(bookings.data?.data ?? []).map((b) => ({ ...b, _raw: b }))}
          columns={[
            {
              key: 'classSession',
              label: t('colSession'),
              render: (_v, row) => (row as AdminBooking).classSession
                ? new Date((row as AdminBooking).classSession.date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
                : '—',
            },
            {
              key: 'classSession',
              label: t('colClass'),
              render: (_v, row) => (row as AdminBooking).classSession?.class?.title ?? '—',
            },
            { key: 'user', label: t('colStudent'), render: (v) => (v as any)?.name ?? '—' },
            { key: 'status', label: t('colStatus'),
              render: (v) => (<StatusBadge label={STATUS_LABEL[v as string] ?? (v as string)} variant={statusVariant(v as string)} />),
            },
            { key: 'createdAt', label: t('colBookedAt'),
              render: (v) => new Date(v as string).toLocaleDateString('en-US'),
            },
            { key: '_raw', label: t('colActions'),
              render: (v) => {
                const b = v as AdminBooking;
                return (
                  <div className="flex gap-2">
                    <button onClick={() => openStatusModal(b)}
                      className="rounded px-2 py-1 text-xs border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors">
                      {t('btnStatus')}
                    </button>
                    {b.status !== 'CANCELED' && (
                      <button onClick={() => setCancelTarget(b)}
                        className="rounded px-2 py-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                        {t('btnCancel')}
                      </button>
                    )}
                  </div>
                );
              },
            },
          ]}
        />
      )}

      <Modal
        title={t('changeStatusTitle')}
        open={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        footer={
          <>
            <button
              onClick={() => setStatusTarget(null)}
              className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]"
            >
              {tc('cancel')}
            </button>
            <button
              onClick={handleStatusUpdate}
              disabled={isSubmitting}
              className="rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50"
            >
              {isSubmitting ? tc('saving') : tc('save')}
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('newStatus')}</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
          >
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelTarget !== null}
        title={t('cancelTitle')}
        message={t('cancelMsg')}
        confirmLabel={t('cancelConfirm')}
        danger
        isLoading={isSubmitting}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      {toast && <Toast message={toast} />}
    </div>
  );
}

