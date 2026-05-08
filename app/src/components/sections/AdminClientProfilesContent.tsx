'use client';

import { useState, useCallback } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Modal } from '@/components/molecules/Modal';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService, type AdminClientProfile } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

// Helpers

function bool(v: boolean) {
  return v ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-[#8097a3]">No</span>;
}

function text(v: string | null | undefined, fallback = '-') {
  return v ? <span>{v}</span> : <span className="text-[#c8bfa8]">{fallback}</span>;
}

function row(label: string, value: React.ReactNode) {
  return (
    <div key={label} className="flex justify-between gap-4 border-b border-[#f0ebe0] pb-2 last:border-0">
      <span className="text-xs font-medium text-[#8097a3] uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm text-[#1f2e35] text-right">{value}</span>
    </div>
  );
}

// Component

type ProfileWithUser = AdminClientProfile & { user?: { name: string; email: string } };

export function AdminClientProfilesContent() {
  const t = useTranslations('admin.healthProfiles');
  const tc = useTranslations('admin.common');

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminClientProfile | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    dateOfBirth: '',
    gender: '',
    street: '',
    complement: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    allergies: '',
    medications: '',
    preExistingConditions: '',
    surgeries: '',
    parqHeartCondition: false,
    parqChestPainActivity: false,
    parqChestPainRest: false,
    parqDizziness: false,
    parqBoneJoint: false,
    parqBloodPressureMeds: false,
    parqOtherReason: false,
    parqNotes: '',
    physicianClearance: false,
    physicianName: '',
    physicianPhone: '',
    fitnessLevel: '',
    goals: '',
    physicalAssessmentNotes: '',
    liabilityWaiverAccepted: false,
    photoVideoConsent: false,
    dataProcessingConsent: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const profiles = useResource(
    () => adminService.listClientProfiles(page, 20),
    [page, refreshKey],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openDetail(p: AdminClientProfile) {
    setSelected(p);
    setShowDetail(true);
  }

  function openEditProfile(p: AdminClientProfile) {
    setSelected(p);
    setEditForm({
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
      gender: p.gender ?? '',
      street: p.street ?? '',
      complement: p.complement ?? '',
      city: p.city ?? '',
      state: p.state ?? '',
      zipCode: p.zipCode ?? '',
      country: p.country ?? 'US',
      emergencyName: p.emergencyName ?? '',
      emergencyPhone: p.emergencyPhone ?? '',
      emergencyRelation: p.emergencyRelation ?? '',
      allergies: p.allergies ?? '',
      medications: p.medications ?? '',
      preExistingConditions: p.preExistingConditions ?? '',
      surgeries: p.surgeries ?? '',
      parqHeartCondition: p.parqHeartCondition,
      parqChestPainActivity: p.parqChestPainActivity,
      parqChestPainRest: p.parqChestPainRest,
      parqDizziness: p.parqDizziness,
      parqBoneJoint: p.parqBoneJoint,
      parqBloodPressureMeds: p.parqBloodPressureMeds,
      parqOtherReason: p.parqOtherReason,
      parqNotes: p.parqNotes ?? '',
      physicianClearance: p.physicianClearance,
      physicianName: p.physicianName ?? '',
      physicianPhone: p.physicianPhone ?? '',
      fitnessLevel: p.fitnessLevel ?? '',
      goals: p.goals ?? '',
      physicalAssessmentNotes: p.physicalAssessmentNotes ?? '',
      liabilityWaiverAccepted: p.liabilityWaiverAccepted,
      photoVideoConsent: p.photoVideoConsent,
      dataProcessingConsent: p.dataProcessingConsent,
    });
    setShowEdit(true);
  }

  function openDeleteConfirm(p: AdminClientProfile) {
    setSelected(p);
    setShowDeleteConfirm(true);
  }

  async function saveProfile() {
    if (!selected) return;
    setIsSaving(true);
    try {
      const maybe = (value: string) => {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
      };

      await adminService.updateClientProfile(selected.userId, {
        dateOfBirth: editForm.dateOfBirth || undefined,
        gender: (editForm.gender as any) || undefined,
        street: maybe(editForm.street),
        complement: maybe(editForm.complement),
        city: maybe(editForm.city),
        state: maybe(editForm.state),
        zipCode: maybe(editForm.zipCode),
        country: (editForm.country || 'US').toUpperCase(),
        emergencyName: maybe(editForm.emergencyName),
        emergencyPhone: maybe(editForm.emergencyPhone),
        emergencyRelation: maybe(editForm.emergencyRelation),
        allergies: maybe(editForm.allergies),
        medications: maybe(editForm.medications),
        preExistingConditions: maybe(editForm.preExistingConditions),
        surgeries: maybe(editForm.surgeries),
        parqHeartCondition: editForm.parqHeartCondition,
        parqChestPainActivity: editForm.parqChestPainActivity,
        parqChestPainRest: editForm.parqChestPainRest,
        parqDizziness: editForm.parqDizziness,
        parqBoneJoint: editForm.parqBoneJoint,
        parqBloodPressureMeds: editForm.parqBloodPressureMeds,
        parqOtherReason: editForm.parqOtherReason,
        parqNotes: maybe(editForm.parqNotes),
        physicianClearance: editForm.physicianClearance,
        physicianName: maybe(editForm.physicianName),
        physicianPhone: maybe(editForm.physicianPhone),
        fitnessLevel: maybe(editForm.fitnessLevel),
        goals: maybe(editForm.goals),
        physicalAssessmentNotes: maybe(editForm.physicalAssessmentNotes),
        liabilityWaiverAccepted: editForm.liabilityWaiverAccepted,
        photoVideoConsent: editForm.photoVideoConsent,
        dataProcessingConsent: editForm.dataProcessingConsent,
      } as any);
      showToast(t('toastProfileUpdated'));
      setShowEdit(false);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastProfileError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProfile() {
    if (!selected) return;
    setIsSaving(true);
    try {
      await adminService.deleteClientProfile(selected.userId);
      showToast(t('toastProfileDeleted'));
      setShowDeleteConfirm(false);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastProfileDeleteError'));
    } finally {
      setIsSaving(false);
    }
  }

  const FIELD = 'w-full rounded-lg border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] placeholder-[#90a4af] outline-none focus:border-[#3c8ea8] focus:ring-2 focus:ring-[#3c8ea8]/20';
  const LABEL = 'block text-xs font-medium text-[#5f7480] mb-1';

  const anyParq = (p: AdminClientProfile) =>
    p.parqHeartCondition || p.parqChestPainActivity || p.parqChestPainRest ||
    p.parqDizziness || p.parqBoneJoint || p.parqBloodPressureMeds || p.parqOtherReason;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {profiles.isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : profiles.error ? (
        <ErrorState message={profiles.error} />
      ) : (
        <>
          <DataTable
            keyField="id"
            emptyText={t('noResults')}
            rows={(profiles.data?.data ?? []).map((p) => ({ ...p, _raw: p }))}
            columns={[
              {
                key: 'userId',
                label: 'Aluno',
                render: (_v, row) => {
                  const p = row as ProfileWithUser;
                  return (
                    <div className="leading-tight">
                      <p className="text-sm font-medium text-[#1f2e35]">{p.user?.name || '-'}</p>
                      <p className="text-xs text-[#8097a3]">{p.user?.email || p.userId}</p>
                    </div>
                  );
                },
              },
              {
                key: 'isComplete',
                label: 'Perfil',
                render: (v) => (<StatusBadge label={v ? t('statusComplete') : t('statusIncomplete')} variant={v ? 'success' : 'warning'} />),
              },
              {
                key: 'parqHeartCondition',
                label: 'PAR-Q',
                render: (_v, row) => {
                  const p = row as AdminClientProfile;
                  const hasYes = anyParq(p);
                  return (
                    <StatusBadge
                      label={hasYes ? (p.physicianClearance ? 'Clearance OK' : 'Flags !') : 'All Clear'}
                      variant={hasYes ? (p.physicianClearance ? 'warning' : 'error') : 'success'}
                    />
                  );
                },
              },
              {
                key: 'liabilityWaiverAccepted',
                label: 'Waiver',
                render: (v) => (
                  <StatusBadge label={v ? 'Signed' : 'Pending'} variant={v ? 'success' : 'error'} />
                ),
              },
              {
                key: 'fitnessLevel',
                label: 'Fitness Level',
                render: (v) => <span className="text-sm text-[#5f7480]">{(v as string) || '-'}</span>,
              },
              { key: 'updatedAt', label: t('colUpdated'),
                render: (v) => new Date(v as string).toLocaleDateString('en-US'),
              },
              { key: '_raw', label: t('colActions'),
                render: (_v, row) => {
                  const p = row as AdminClientProfile;
                  return (
                    <div className="flex gap-1.5">
                      <button onClick={() => openDetail(p)}
                        className="rounded px-2 py-1 text-xs border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors">
                        {t('btnView')}
                      </button>
                      <button onClick={() => openEditProfile(p)}
                        className="rounded px-2 py-1 text-xs border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors">
                        Editar
                      </button>
                      <button onClick={() => openDeleteConfirm(p)}
                        className="rounded px-2 py-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                        Excluir
                      </button>
                    </div>
                  );
                },
              },
            ]}
          />

          {/* Pagination */}
          {(profiles.data?.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-[#d4e2e5] px-3 py-1.5 text-sm text-[#5f7480] disabled:opacity-40 hover:border-[#3c8ea8]">
                {tc('prev')}
              </button>
              <span className="text-sm text-[#8097a3]">{tc('pageOf', { page, total: profiles.data?.totalPages ?? 1 })}</span>
              <button disabled={page === (profiles.data?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-[#d4e2e5] px-3 py-1.5 text-sm text-[#5f7480] disabled:opacity-40 hover:border-[#3c8ea8]">
                {tc('next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        title={t('detailTitle')}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        size="lg"
        footer={
          <button
            onClick={() => setShowDetail(false)}
            className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]"
          >
            {tc('close')}
          </button>
        }
      >
        {selected && (
          <div className="space-y-6 overflow-y-auto max-h-[65vh]">
            {/* Personal */}
            <section>
              <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest mb-3">Personal</h3>
              <div className="space-y-2">
                {row('User ID', <span className="font-mono text-xs">{selected.userId}</span>)}
                {row('Date of Birth', text(selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString('en-US') : null))}
                {row('Gender', text(selected.gender))}
                {row('Address', text([selected.street, selected.city, selected.state, selected.zipCode, selected.country].filter(Boolean).join(', ') || null))}
              </div>
            </section>

            {/* Emergency Contact */}
            <section>
              <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest mb-3">Emergency Contact</h3>
              <div className="space-y-2">
                {row('Name', text(selected.emergencyName))}
                {row('Phone', text(selected.emergencyPhone))}
                {row('Relation', text(selected.emergencyRelation))}
              </div>
            </section>

            {/* Health History */}
            <section>
              <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest mb-3">Health History</h3>
              <div className="space-y-2">
                {row('Allergies', text(selected.allergies))}
                {row('Medications', text(selected.medications))}
                {row('Pre-existing Conditions', text(selected.preExistingConditions))}
                {row('Surgeries / Injuries', text(selected.surgeries))}
              </div>
            </section>

            {/* PAR-Q */}
            <section>
              <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest mb-3">PAR-Q</h3>
              <div className="space-y-2">
                {row('Heart Condition', bool(selected.parqHeartCondition))}
                {row('Chest Pain (Activity)', bool(selected.parqChestPainActivity))}
                {row('Chest Pain (Rest)', bool(selected.parqChestPainRest))}
                {row('Dizziness / Fainting', bool(selected.parqDizziness))}
                {row('Bone / Joint Problem', bool(selected.parqBoneJoint))}
                {row('Blood Pressure Meds', bool(selected.parqBloodPressureMeds))}
                {row('Other Reason', bool(selected.parqOtherReason))}
                {selected.parqNotes && row('Notes', text(selected.parqNotes))}
                {row('Physician Clearance', bool(selected.physicianClearance))}
                {selected.physicianClearance && (
                  <>
                    {row('Physician Name', text(selected.physicianName))}
                    {row('Physician Phone', text(selected.physicianPhone))}
                  </>
                )}
              </div>
            </section>

            {/* Legal */}
            <section>
              <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest mb-3">Legal Consents</h3>
              <div className="space-y-2">
                {row('Liability Waiver', bool(selected.liabilityWaiverAccepted))}
                {row('Photo / Video', bool(selected.photoVideoConsent))}
                {row('Data Processing', bool(selected.dataProcessingConsent))}
              </div>
            </section>

            {/* Physical Assessment */}
            {(selected.fitnessLevel || selected.goals || selected.physicalAssessmentNotes) && (
              <section>
                <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest mb-3">Physical Assessment</h3>
                <div className="space-y-2">
                  {row('Fitness Level', text(selected.fitnessLevel))}
                  {row('Goals', text(selected.goals))}
                  {row('Notes', text(selected.physicalAssessmentNotes))}
                  {row('Assessed At', text(selected.assessedAt ? new Date(selected.assessedAt).toLocaleDateString('en-US') : null))}
                </div>
              </section>
            )}
          </div>
        )}
      </Modal>

      {/* Full Edit Modal */}
      <Modal
        title="Editar perfil de saude"
        open={showEdit}
        onClose={() => setShowEdit(false)}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowEdit(false)}
              className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]"
            >
              Cancelar
            </button>
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </>
        }
      >
        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest">Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Date of Birth</label>
                <input type="date" className={FIELD} value={editForm.dateOfBirth} onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Gender</label>
                <select className={FIELD} value={editForm.gender} onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}>
                  <option value="">Select...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Street</label>
                <input className={FIELD} value={editForm.street} onChange={(e) => setEditForm((f) => ({ ...f, street: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Complement</label>
                <input className={FIELD} value={editForm.complement} onChange={(e) => setEditForm((f) => ({ ...f, complement: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>City</label>
                <input className={FIELD} value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>State</label>
                <input className={FIELD} value={editForm.state} onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Zip Code</label>
                <input className={FIELD} value={editForm.zipCode} onChange={(e) => setEditForm((f) => ({ ...f, zipCode: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Country (ISO2)</label>
                <input className={FIELD} maxLength={2} value={editForm.country} onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Name</label>
                <input className={FIELD} value={editForm.emergencyName} onChange={(e) => setEditForm((f) => ({ ...f, emergencyName: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input className={FIELD} value={editForm.emergencyPhone} onChange={(e) => setEditForm((f) => ({ ...f, emergencyPhone: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Relation</label>
                <input className={FIELD} value={editForm.emergencyRelation} onChange={(e) => setEditForm((f) => ({ ...f, emergencyRelation: e.target.value }))} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest">Health History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Allergies</label>
                <textarea rows={3} className={`${FIELD} resize-none`} value={editForm.allergies} onChange={(e) => setEditForm((f) => ({ ...f, allergies: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Medications</label>
                <textarea rows={3} className={`${FIELD} resize-none`} value={editForm.medications} onChange={(e) => setEditForm((f) => ({ ...f, medications: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Pre-existing Conditions</label>
                <textarea rows={3} className={`${FIELD} resize-none`} value={editForm.preExistingConditions} onChange={(e) => setEditForm((f) => ({ ...f, preExistingConditions: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Surgeries / Injuries</label>
                <textarea rows={3} className={`${FIELD} resize-none`} value={editForm.surgeries} onChange={(e) => setEditForm((f) => ({ ...f, surgeries: e.target.value }))} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest">PAR-Q</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.parqHeartCondition} onChange={(e) => setEditForm((f) => ({ ...f, parqHeartCondition: e.target.checked }))} /> Heart condition</label>
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.parqChestPainActivity} onChange={(e) => setEditForm((f) => ({ ...f, parqChestPainActivity: e.target.checked }))} /> Chest pain during activity</label>
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.parqChestPainRest} onChange={(e) => setEditForm((f) => ({ ...f, parqChestPainRest: e.target.checked }))} /> Chest pain at rest</label>
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.parqDizziness} onChange={(e) => setEditForm((f) => ({ ...f, parqDizziness: e.target.checked }))} /> Dizziness / fainting</label>
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.parqBoneJoint} onChange={(e) => setEditForm((f) => ({ ...f, parqBoneJoint: e.target.checked }))} /> Bone / joint issue</label>
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.parqBloodPressureMeds} onChange={(e) => setEditForm((f) => ({ ...f, parqBloodPressureMeds: e.target.checked }))} /> Blood pressure meds</label>
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.parqOtherReason} onChange={(e) => setEditForm((f) => ({ ...f, parqOtherReason: e.target.checked }))} /> Other reason not to exercise</label>
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.physicianClearance} onChange={(e) => setEditForm((f) => ({ ...f, physicianClearance: e.target.checked }))} /> Physician clearance</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>PAR-Q Notes</label>
                <textarea rows={3} className={`${FIELD} resize-none`} value={editForm.parqNotes} onChange={(e) => setEditForm((f) => ({ ...f, parqNotes: e.target.value }))} />
              </div>
              <div className="space-y-3">
                <div>
                  <label className={LABEL}>Physician Name</label>
                  <input className={FIELD} value={editForm.physicianName} onChange={(e) => setEditForm((f) => ({ ...f, physicianName: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Physician Phone</label>
                  <input className={FIELD} value={editForm.physicianPhone} onChange={(e) => setEditForm((f) => ({ ...f, physicianPhone: e.target.value }))} />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest">Physical Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Fitness Level</label>
                <select className={FIELD} value={editForm.fitnessLevel} onChange={(e) => setEditForm((f) => ({ ...f, fitnessLevel: e.target.value }))}>
                  <option value="">Select...</option>
                  <option value="SEDENTARY">Sedentary</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Goals</label>
                <textarea rows={3} className={`${FIELD} resize-none`} value={editForm.goals} onChange={(e) => setEditForm((f) => ({ ...f, goals: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Assessment Notes</label>
              <textarea rows={4} className={`${FIELD} resize-none`} value={editForm.physicalAssessmentNotes} onChange={(e) => setEditForm((f) => ({ ...f, physicalAssessmentNotes: e.target.value }))} />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-[#3c8ea8] uppercase tracking-widest">Legal Consents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.liabilityWaiverAccepted} onChange={(e) => setEditForm((f) => ({ ...f, liabilityWaiverAccepted: e.target.checked }))} /> Liability waiver accepted</label>
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.photoVideoConsent} onChange={(e) => setEditForm((f) => ({ ...f, photoVideoConsent: e.target.checked }))} /> Photo/video consent</label>
              <label className="flex items-center gap-2 text-sm text-[#1f2e35]"><input type="checkbox" checked={editForm.dataProcessingConsent} onChange={(e) => setEditForm((f) => ({ ...f, dataProcessingConsent: e.target.checked }))} /> Data processing consent</label>
            </div>
          </section>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1f2e35] px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
          {toast}
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Excluir perfil de saude"
        message={`Tem certeza que deseja excluir o perfil de ${selected?.user?.name ?? selected?.userId ?? 'aluno'}?`}
        onConfirm={deleteProfile}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isSaving}
        confirmLabel="Excluir"
      />
    </div>
  );
}

