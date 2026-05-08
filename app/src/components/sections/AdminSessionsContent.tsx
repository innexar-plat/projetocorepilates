'use client';

import { useState, useCallback } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { Modal } from '@/components/molecules/Modal';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge, statusVariant } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService, type AdminSession, type AdminClass } from '@/services/admin.service';
import { useLocale, useTranslations } from 'next-intl';

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1f2e35] px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
      {message}
    </div>
  );
}

export function AdminSessionsContent() {
  const t = useTranslations('admin.sessions');
  const tc = useTranslations('admin.common');
  const locale = useLocale();

  const SESSION_STATUS_LABEL: Record<string, string> = {
    SCHEDULED: t('statusScheduled'), COMPLETED: t('statusCompleted'), CANCELED: t('statusCanceled'),
  };

  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AdminSession | null>(null);
  const [createForm, setCreateForm] = useState({ classId: '', date: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const sessions = useResource(
    () => adminService.listSessions(1, 50, selectedClassId, activeStatus),
    [activeStatus, selectedClassId, refreshKey],
  );
  const classes = useResource(() => adminService.listClasses(), []);

  const WEEKDAY_LABEL: Record<string, string> = locale.startsWith('pt')
    ? {
        MONDAY: 'Segunda-feira',
        TUESDAY: 'Terça-feira',
        WEDNESDAY: 'Quarta-feira',
        THURSDAY: 'Quinta-feira',
        FRIDAY: 'Sexta-feira',
        SATURDAY: 'Sábado',
        SUNDAY: 'Domingo',
      }
    : locale.startsWith('es')
      ? {
          MONDAY: 'Lunes',
          TUESDAY: 'Martes',
          WEDNESDAY: 'Miércoles',
          THURSDAY: 'Jueves',
          FRIDAY: 'Viernes',
          SATURDAY: 'Sábado',
          SUNDAY: 'Domingo',
        }
      : {
          MONDAY: 'Monday',
          TUESDAY: 'Tuesday',
          WEDNESDAY: 'Wednesday',
          THURSDAY: 'Thursday',
          FRIDAY: 'Friday',
          SATURDAY: 'Saturday',
          SUNDAY: 'Sunday',
        };

  const WEEKDAY_ORDER: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
  };

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreate() {
    if (!createForm.classId || !createForm.date) {
      showToast(t('toastRequired'));
      return;
    }
    setIsSubmitting(true);
    try {
      await adminService.createSession({
        classId: createForm.classId,
        date: new Date(createForm.date).toISOString(),
        notes: createForm.notes || undefined,
      });
      showToast(t('toastCreated'));
      setShowCreateModal(false);
      setCreateForm({ classId: '', date: '', notes: '' });
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastCreateError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setIsSubmitting(true);
    try {
      await adminService.cancelSession(cancelTarget.id);
      showToast(t('toastCanceled'));
      setCancelTarget(null);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastCancelError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const classList = (classes.data ?? []) as AdminClass[];
  const orderedClassList = [...classList].sort((a, b) => {
    const dayDiff = (WEEKDAY_ORDER[a.dayOfWeek] ?? 99) - (WEEKDAY_ORDER[b.dayOfWeek] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    const timeDiff = a.startTime.localeCompare(b.startTime);
    if (timeDiff !== 0) return timeDiff;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <button onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white hover:bg-[#367f96]">
            {t('newSession')}
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedClassId ?? ''}
          onChange={(e) => setSelectedClassId(e.target.value || undefined)}
          className="rounded-lg border border-[#d4e2e5] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#3c8ea8]"
        >
          <option value="">{t('allClasses')}</option>
          {orderedClassList.map((c) => (
            <option key={c.id} value={c.id}>{`${WEEKDAY_LABEL[c.dayOfWeek] ?? c.dayOfWeek} · ${c.startTime} · ${c.title}`}</option>
          ))}
        </select>
        {['SCHEDULED', 'COMPLETED', 'CANCELED'].map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(activeStatus === s ? undefined : s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeStatus === s
                ? 'bg-[#3c8ea8] text-white'
                : 'bg-white border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8]'
            }`}
          >
            {SESSION_STATUS_LABEL[s]}
          </button>
        ))}
        <span className="ml-auto text-sm text-[#8097a3]">
          {!sessions.isLoading && sessions.data ? t('count', { count: sessions.data.total }) : ''}
        </span>
      </div>

      {sessions.isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : sessions.error ? (
        <ErrorState message={sessions.error} />
      ) : (
        <DataTable
          keyField="id"
          emptyText={t('noResults')}
          rows={(sessions.data?.data ?? []).map((s) => ({ ...s, _raw: s }))}
          columns={[
            { key: 'date', label: t('colDateTime'),
              render: (v) => new Date(v as string).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }),
            },
            {
              key: 'class',
              label: locale.startsWith('pt') ? 'Dia da semana' : locale.startsWith('es') ? 'Día de la semana' : 'Weekday',
              render: (_v, row) => {
                const day = (row as AdminSession).class?.dayOfWeek;
                return WEEKDAY_LABEL[day] ?? day ?? '—';
              },
            },
            {
              key: 'class',
              label: t('colClass'),
              render: (_v, row) => ((row as AdminSession).class?.title ?? '—'),
            },
            {
              key: 'class',
              label: t('colInstructor'),
              render: (_v, row) => ((row as AdminSession).class?.instructor || '—'),
            },
            { key: '_count', label: t('colBookings'), render: (v) => (v as any)?.bookings ?? 0 },
            { key: 'status', label: t('colStatus'),
              render: (v) => (<StatusBadge label={SESSION_STATUS_LABEL[v as string] ?? (v as string)} variant={statusVariant(v as string)} />),
            },
            { key: '_raw', label: t('colActions'),
              render: (v) => {
                const s = v as AdminSession;
                if (s.status !== 'SCHEDULED') return <span className="text-xs text-[#c4b99a]">—</span>;
                return (
                  <button onClick={() => setCancelTarget(s)}
                    className="rounded px-2 py-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    {t('btnCancel')}
                  </button>
                );
              },
            },
          ]}
        />
      )}

      <Modal
        title={t('modalTitle')}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]"
            >
              {tc('cancel')}
            </button>
            <button onClick={handleCreate} disabled={isSubmitting}
              className="rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50">
              {isSubmitting ? tc('processing') : t('newSession')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldClass')}</label>
            <select
              value={createForm.classId}
              onChange={(e) => setCreateForm((f) => ({ ...f, classId: e.target.value }))}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
            >
              <option value="">{t('selectClass')}</option>
              {orderedClassList.filter((c) => c.isActive).map((c) => (
                <option key={c.id} value={c.id}>{`${WEEKDAY_LABEL[c.dayOfWeek] ?? c.dayOfWeek} · ${c.startTime} · ${c.title}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldDateTime')}</label>
            <input
              type="datetime-local"
              value={createForm.date}
              onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldNotes')}</label>
            <textarea
              value={createForm.notes}
              onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8] resize-none"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelTarget !== null}
        title={t('cancelTitle')}
        message={t('cancelMsg', { date: cancelTarget ? new Date(cancelTarget.date).toLocaleString(locale) : '' })}
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

