'use client';

import { useState, useCallback } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Modal } from '@/components/molecules/Modal';
import { EnrollmentWizard } from '@/components/molecules/EnrollmentWizard';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService, type AdminUser } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1f2e35] px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
      {message}
    </div>
  );
}

export function AdminUsersContent() {
  const t = useTranslations('admin.students');
  const tc = useTranslations('admin.common');

  const ROLE_LABEL: Record<string, string> = { ADMIN: t('roleAdmin'), CLIENT: t('roleStudent') };

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showEnrollWizard, setShowEnrollWizard] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newRole, setNewRole] = useState<'ADMIN' | 'CLIENT'>('CLIENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const plans = useResource(() => adminService.listPlans(), []);

  const users = useResource(
    () => adminService.listUsers(1, 50, debouncedSearch),
    [debouncedSearch, refreshKey],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setSearch(v);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => setDebouncedSearch(v), 400);
  }

  function openRoleModal(user: AdminUser) {
    setSelectedUser(user);
    setNewRole(user.role as 'ADMIN' | 'CLIENT');
    setShowRoleModal(true);
  }

  function openDeleteConfirm(user: AdminUser) {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  }

  function openDetail(user: AdminUser) {
    setSelectedUser(user);
    setShowDetailModal(true);
  }

  function openEnrollWizard() {
    setShowEnrollWizard(true);
  }

  async function handleRoleUpdate() {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await adminService.updateUserRole(selectedUser.id, newRole);
      showToast(t('toastRoleChanged', { name: selectedUser.name, role: ROLE_LABEL[newRole] }));
      setShowRoleModal(false);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastRoleError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await adminService.deleteUser(selectedUser.id);
      showToast(t('toastDeactivated', { name: selectedUser.name }));
      setShowDeleteConfirm(false);
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
            onClick={openEnrollWizard}
            className="flex items-center gap-2 rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#367f96] transition-colors"
          >
            <span className="text-base leading-none">+</span> {t('newStudent')}
          </button>
        }
      />

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder={t('searchPlaceholder')}
          className="flex-1 rounded-lg border border-[#d4e2e5] bg-white px-4 py-2 text-sm text-[#1f2e35] placeholder-[#90a4af] outline-none focus:border-[#3c8ea8] focus:ring-2 focus:ring-[#3c8ea8]/20"
        />
        <span className="text-sm text-[#8097a3]">
          {!users.isLoading && users.data ? t('records', { count: users.data.total }) : ''}
        </span>
      </div>

      {users.isLoading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : users.error ? (
        <ErrorState message={users.error} />
      ) : (
        <DataTable
          keyField="id"
          emptyText={t('noResults')}
          rows={(users.data?.data ?? []).map((u) => ({ ...u, _raw: u }))}
          columns={[
            { key: 'name', label: t('colName') },
            { key: 'email', label: t('colEmail') },
            {
              key: 'phone',
              label: t('colPhone'),
              render: (v) => <span className="text-[#8097a3]">{(v as string) || '-'}</span>,
            },
            {
              key: 'role',
              label: t('colRole'),
              render: (v) => (
                <StatusBadge
                  label={ROLE_LABEL[v as string] ?? (v as string)}
                  variant={v === 'ADMIN' ? 'gold' : 'info'}
                />
              ),
            },
            {
              key: 'isActive',
              label: t('colStatus'),
              render: (v) => (
                <StatusBadge label={v ? t('statusActive') : t('statusInactive')} variant={v ? 'success' : 'error'} />
              ),
            },
            {
              key: 'createdAt',
              label: t('colJoined'),
              render: (v) => new Date(v as string).toLocaleDateString('en-US'),
            },
            {
              key: '_raw',
              label: t('colActions'),
              render: (v) => {
                const u = v as AdminUser;
                return (
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => openDetail(u)}
                      className="rounded px-2 py-1 text-xs border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors"
                    >
                      {t('btnView')}
                    </button>
                    <button
                      onClick={() => openRoleModal(u)}
                      className="rounded px-2 py-1 text-xs border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors"
                    >
                      {t('btnProfile')}
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(u)}
                      className="rounded px-2 py-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      {t('btnDeactivate')}
                    </button>
                  </div>
                );
              },
            },
          ]}
        />
      )}

      {/* Enrollment Wizard */}
      <EnrollmentWizard
        open={showEnrollWizard}
        onClose={() => setShowEnrollWizard(false)}
        onSuccess={(name) => {
          showToast(t('toastEnrolled', { name }));
          refresh();
        }}
        plans={plans.data ?? []}
      />

      {/* Modal: Student Details */}
      <Modal
        title={t('detailsTitle')}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="md"
        footer={
          <button
            onClick={() => setShowDetailModal(false)}
            className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]"
          >
            {tc('close')}
          </button>
        }
      >
        {selectedUser && (
          <div className="space-y-3">
            {[
              { label: t('fieldName'), value: selectedUser.name },
              { label: t('fieldEmail'), value: selectedUser.email },
              { label: t('fieldPhone'), value: selectedUser.phone || '-' },
              { label: t('fieldRole'), value: ROLE_LABEL[selectedUser.role] ?? selectedUser.role },
              { label: t('fieldStatus'), value: selectedUser.isActive ? t('statusActive') : t('statusInactive') },
              { label: t('fieldId'), value: selectedUser.id },
              {
                label: t('fieldJoined'),
                value: new Date(selectedUser.createdAt).toLocaleString('en-US'),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-[#f0ebe0] pb-2">
                <span className="text-xs font-medium text-[#8097a3] uppercase tracking-wide">{label}</span>
                <span className="text-sm text-[#1f2e35] font-medium text-right max-w-[60%] break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal: Change Role */}
      <Modal
        title={t('changeRoleTitle', { name: selectedUser?.name ?? '' })}
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setShowRoleModal(false)}
              className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]"
            >
              {tc('cancel')}
            </button>
            <button
              onClick={handleRoleUpdate}
              disabled={isSubmitting}
              className="rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50"
            >
              {isSubmitting ? tc('saving') : tc('save')}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[#5f7480]">{t('changeRolePrompt')}</p>
          {(['CLIENT', 'ADMIN'] as const).map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" value={r} checked={newRole === r} onChange={() => setNewRole(r)} className="accent-[#3c8ea8]" />
              <span className="text-sm text-[#1f2e35]">{ROLE_LABEL[r]}</span>
            </label>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('deactivateTitle')}
        message={t('deactivateMsg', { name: selectedUser?.name ?? '' })}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isSubmitting}
        confirmLabel={t('deactivateConfirm')}
      />

      {toast && <Toast message={toast} />}
    </div>
  );
}

