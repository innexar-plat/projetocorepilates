'use client';

import { useState, useCallback } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { Modal } from '@/components/molecules/Modal';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge, statusVariant } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService, type AdminLead } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

const STATUSES = ['NEW', 'CONTACTED', 'NEGOTIATING', 'CONVERTED', 'LOST'] as const;

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1f2e35] px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
      {message}
    </div>
  );
}

export function AdminLeadsContent() {
  const t = useTranslations('admin.leads');
  const tc = useTranslations('admin.common');

  const STATUS_LABEL: Record<string, string> = {
    NEW: t('statusNew'), CONTACTED: t('statusContacted'), NEGOTIATING: t('statusNegotiating'),
    CONVERTED: t('statusConverted'), LOST: t('statusLost'),
  };

  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const leads = useResource(
    () => adminService.listLeads(1, 50, activeStatus, debouncedSearch),
    [activeStatus, debouncedSearch, refreshKey],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setSearch(v);
    clearTimeout((window as any)._leadSearch);
    (window as any)._leadSearch = setTimeout(() => setDebouncedSearch(v), 400);
  }

  function openModal(lead: AdminLead) {
    setSelectedLead(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes ?? '');
    setShowModal(true);
  }

  async function handleUpdate() {
    if (!selectedLead) return;
    setIsSubmitting(true);
    try {
      await adminService.updateLeadStatus(selectedLead.id, editStatus, editNotes);
      showToast(t('toastUpdated'));
      setShowModal(false);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastError'));
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

      {/* Filter pill row + search */}
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
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeStatus === s
                ? 'bg-[#3c8ea8] text-white'
                : 'bg-white border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8]'
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder={t('searchPlaceholder')}
            className="rounded-lg border border-[#d4e2e5] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#3c8ea8]"
          />
          <span className="text-sm text-[#8097a3]">
            {!leads.isLoading && leads.data ? t('count', { count: leads.data.total }) : ''}
          </span>
        </div>
      </div>

      {leads.isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : leads.error ? (
        <ErrorState message={leads.error} />
      ) : (
        <DataTable
          keyField="id"
          emptyText={t('noResults')}
          rows={(leads.data?.data ?? []).map((l) => ({ ...l, _raw: l }))}
          columns={[
            { key: 'name', label: t('colName') },
            { key: 'email', label: t('colEmail') },
            { key: 'phone', label: t('colPhone'), render: (v) => (v as string) || '—' },
            { key: 'source', label: t('colSource'), render: (v) => (v as string) || '—' },
            {
              key: 'status',
              label: t('colStatus'),
              render: (v) => (
                <StatusBadge label={STATUS_LABEL[v as string] ?? (v as string)} variant={statusVariant(v as string)} />
              ),
            },
            {
              key: 'createdAt',
              label: t('colDate'),
              render: (v) => new Date(v as string).toLocaleDateString('en-US'),
            },
            {
              key: '_raw',
              label: t('colActions'),
              render: (v) => (
                <button
                  onClick={() => openModal(v as AdminLead)}
                  className="rounded px-2 py-1 text-xs border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors"
                >
                  {t('btnEdit')}
                </button>
              ),
            },
          ]}
        />
      )}

      <Modal
        title={t('modalTitle', { name: selectedLead?.name ?? '' })}
        open={showModal}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]"
            >
              {tc('cancel')}
            </button>
            <button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50"
            >
              {isSubmitting ? tc('saving') : tc('save')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldStatus')}</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm text-[#1f2e35] outline-none focus:border-[#3c8ea8]"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldNotes')}</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm text-[#1f2e35] outline-none focus:border-[#3c8ea8] resize-none"
              placeholder={t('notesPlaceholder')}
            />
          </div>
          {selectedLead && (
            <div className="rounded-lg bg-[#f3f8fa] p-3 text-xs text-[#5f7480] space-y-1">
              <p><strong>{t('fieldEmail')}</strong> {selectedLead.email}</p>
              {selectedLead.phone && <p><strong>{t('fieldPhone')}</strong> {selectedLead.phone}</p>}
              {selectedLead.source && <p><strong>{t('fieldSource')}</strong> {selectedLead.source}</p>}
              <p><strong>{t('fieldJoined')}</strong> {new Date(selectedLead.createdAt).toLocaleDateString('en-US')}</p>
            </div>
          )}
        </div>
      </Modal>

      {toast && <Toast message={toast} />}
    </div>
  );
}

