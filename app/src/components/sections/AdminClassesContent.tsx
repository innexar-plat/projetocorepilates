'use client';

import { useState, useCallback } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { Modal } from '@/components/molecules/Modal';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService, type AdminClass, type CreateClassDto } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

const EMPTY_FORM: CreateClassDto = {
  title: '',
  instructor: '',
  maxCapacity: 8,
  durationMin: 60,
  dayOfWeek: 'MONDAY',
  startTime: '08:00',
  isActive: true,
};

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1f2e35] px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
      {message}
    </div>
  );
}

export function AdminClassesContent() {
  const t = useTranslations('admin.classes');
  const tc = useTranslations('admin.common');

  const DAYS = [
    { value: 'SUNDAY',    label: t('days.SUNDAY') },
    { value: 'MONDAY',    label: t('days.MONDAY') },
    { value: 'TUESDAY',   label: t('days.TUESDAY') },
    { value: 'WEDNESDAY', label: t('days.WEDNESDAY') },
    { value: 'THURSDAY',  label: t('days.THURSDAY') },
    { value: 'FRIDAY',    label: t('days.FRIDAY') },
    { value: 'SATURDAY',  label: t('days.SATURDAY') },
  ];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminClass | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminClass | null>(null);
  const [form, setForm] = useState<CreateClassDto>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const classes = useResource(() => adminService.listClasses(), [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setShowCreateModal(true);
  }

  function openEdit(c: AdminClass) {
    setForm({
      title: c.title,
      instructor: c.instructor ?? '',
      maxCapacity: c.maxCapacity,
      durationMin: c.durationMin,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      isActive: c.isActive,
    });
    setEditTarget(c);
    setShowCreateModal(true);
  }

  function setField<K extends keyof CreateClassDto>(k: K, v: CreateClassDto[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await adminService.updateClass(editTarget.id, form);
        showToast(t('toastUpdated'));
      } else {
        await adminService.createClass(form);
        showToast(t('toastCreated'));
      }
      setShowCreateModal(false);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setIsSubmitting(true);
    try {
      await adminService.deactivateClass(deactivateTarget.id);
      showToast(t('toastDeactivated'));
      setDeactivateTarget(null);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastDeactivateError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <button
            onClick={openCreate}
            className="rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white hover:bg-[#367f96]"
          >
            {t('newClass')}
          </button>
        }
      />

      {classes.isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : classes.error ? (
        <ErrorState message={classes.error} />
      ) : (
        <DataTable
          keyField="id"
          emptyText={t('noResults')}
          rows={(classes.data ?? []).map((c) => ({ ...c, _raw: c }))}
          columns={[
            { key: 'title', label: t('colClass') },
            { key: 'instructor', label: t('colInstructor'), render: (v) => (v as string) || '—' },
            { key: 'dayOfWeek', label: t('colDay'),
              render: (v) => DAYS.find((d) => d.value === String(v))?.label ?? String(v),
            },
            { key: 'startTime', label: t('colTime') },
            { key: 'durationMin', label: t('colDuration'), render: (v) => `${v} min` },
            { key: 'maxCapacity', label: t('colSpots') },
            { key: 'isActive', label: t('colStatus'),
              render: (v) => (<StatusBadge label={v ? t('statusActive') : t('statusInactive')} variant={v ? 'success' : 'neutral'} />),
            },
            { key: '_raw', label: t('colActions'),
              render: (v) => {
                const c = v as AdminClass;
                return (
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)}
                      className="rounded px-2 py-1 text-xs border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors">
                      {t('btnEdit')}
                    </button>
                    {c.isActive && (
                      <button onClick={() => setDeactivateTarget(c)}
                        className="rounded px-2 py-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                        {t('btnDeactivate')}
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
        title={editTarget ? t('modalTitleEdit') : t('modalTitleNew')}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]"
            >
              {tc('cancel')}
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting}
              className="rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50">
              {isSubmitting ? tc('saving') : tc('save')}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldTitle')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldInstructor')}</label>
            <input
              type="text"
              value={form.instructor}
              onChange={(e) => setField('instructor', e.target.value)}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldDay')}</label>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setField('dayOfWeek', e.target.value)}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldTime')}</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setField('startTime', e.target.value)}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldDuration')}</label>
            <input
              type="number"
              min={15}
              max={180}
              value={form.durationMin}
              onChange={(e) => setField('durationMin', Number(e.target.value))}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldMaxSpots')}</label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.maxCapacity}
              onChange={(e) => setField('maxCapacity', Number(e.target.value))}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
              className="rounded accent-[#3c8ea8]"
            />
            <label htmlFor="isActive" className="text-sm text-[#5f7480]">{t('fieldActive')}</label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deactivateTarget !== null}
        title={t('deactivateTitle')}
        message={t('deactivateMsg', { title: deactivateTarget?.title ?? '' })}
        confirmLabel={t('deactivateConfirm')}
        danger
        isLoading={isSubmitting}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />

      {toast && <Toast message={toast} />}
    </div>
  );
}

