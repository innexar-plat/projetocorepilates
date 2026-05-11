'use client';

import { useState, useCallback, useMemo, type ChangeEvent } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { Modal } from '@/components/molecules/Modal';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService, type AdminClass, type CreateClassDto, type UpdateClassDto } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

const EMPTY_FORM: CreateClassDto = {
  title: '',
  instructor: '',
  maxCapacity: 8,
  durationMin: 60,
  dayOfWeek: 'MONDAY',
  startTime: '08:00',
  isActive: true,
  imageUrl: '',
};

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const DAY_ORDER: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [applyImageToSameTitle, setApplyImageToSameTitle] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [groupBy, setGroupBy] = useState<'ACTIVITY' | 'DAY'>('ACTIVITY');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDay, setFilterDay] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDurationMin, setBulkDurationMin] = useState('');
  const [bulkMaxCapacity, setBulkMaxCapacity] = useState('');
  const [bulkInstructor, setBulkInstructor] = useState('');
  const [bulkImageUrl, setBulkImageUrl] = useState('');
  const [bulkIsActive, setBulkIsActive] = useState<'UNCHANGED' | 'ACTIVE' | 'INACTIVE'>('UNCHANGED');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const classes = useResource(() => adminService.listClasses(), [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const classesData = classes.data ?? [];

  const dayLabelByValue = useMemo(
    () => DAYS.reduce((acc, d) => ({ ...acc, [d.value]: d.label }), {} as Record<string, string>),
    [DAYS],
  );

  const typeOptions = useMemo(
    () => Array.from(new Set(classesData.map((c) => c.title))).sort((a, b) => a.localeCompare(b)),
    [classesData],
  );

  const filteredClasses = useMemo(() => {
    return classesData.filter((cls) => {
      const matchesSearch =
        filterSearch.trim().length === 0 ||
        cls.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
        cls.instructor.toLowerCase().includes(filterSearch.toLowerCase());
      const matchesDay = filterDay === 'ALL' || cls.dayOfWeek === filterDay;
      const matchesType = filterType === 'ALL' || cls.title === filterType;
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' ? cls.isActive : !cls.isActive);

      return matchesSearch && matchesDay && matchesType && matchesStatus;
    });
  }, [classesData, filterDay, filterSearch, filterStatus, filterType]);

  const groupedClasses = useMemo(() => {
    const map = new Map<string, { label: string; items: AdminClass[] }>();

    for (const cls of filteredClasses) {
      const key = groupBy === 'ACTIVITY' ? cls.title : cls.dayOfWeek;
      const label = groupBy === 'ACTIVITY' ? cls.title : (dayLabelByValue[cls.dayOfWeek] ?? cls.dayOfWeek);
      if (!map.has(key)) {
        map.set(key, { label, items: [] });
      }
      map.get(key)!.items.push(cls);
    }

    const entries = Array.from(map.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      items: value.items.sort((a, b) => {
        const dayDiff = (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99);
        if (dayDiff !== 0) return dayDiff;
        const timeDiff = a.startTime.localeCompare(b.startTime);
        if (timeDiff !== 0) return timeDiff;
        return a.title.localeCompare(b.title);
      }),
    }));

    return entries.sort((a, b) => {
      if (groupBy === 'DAY') {
        return (DAY_ORDER[a.key] ?? 99) - (DAY_ORDER[b.key] ?? 99);
      }
      return a.label.localeCompare(b.label);
    });
  }, [dayLabelByValue, filterDay, filteredClasses, groupBy]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleSelected =
    filteredClasses.length > 0 && filteredClasses.every((cls) => selectedIdSet.has(cls.id));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setApplyImageToSameTitle(true);
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
      imageUrl: c.imageUrl ?? '',
    });
    setEditTarget(c);
    setApplyImageToSameTitle(true);
    setShowCreateModal(true);
  }

  function setField<K extends keyof CreateClassDto>(k: K, v: CreateClassDto[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleGroup(groupKey: string) {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleSelectAllVisible() {
    const visibleIds = filteredClasses.map((cls) => cls.id);
    if (visibleIds.length === 0) return;

    setSelectedIds((prev) => {
      const prevSet = new Set(prev);
      const isEveryVisibleSelected = visibleIds.every((id) => prevSet.has(id));
      if (isEveryVisibleSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }
      const merged = new Set([...prev, ...visibleIds]);
      return Array.from(merged);
    });
  }

  async function onPhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
      showToast(t('toastInvalidImageType'));
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      showToast(t('toastImageTooLarge'));
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const uploaded = await adminService.uploadClassPhoto(file);
      setField('imageUrl', uploaded.url);
      showToast(t('toastPhotoUploaded'));
    } catch (e: any) {
      showToast(e.message ?? t('toastPhotoUploadFailed'));
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await adminService.updateClass(editTarget.id, form);
        if (applyImageToSameTitle) {
          const result = await adminService.updateClassImageByTitle(
            editTarget.title,
            form.imageUrl?.trim() || undefined,
          );
          if (result.updatedCount > 1) {
            showToast(t('toastImageAppliedMany', { count: result.updatedCount }));
          } else {
            showToast(t('toastUpdated'));
          }
        } else {
          showToast(t('toastUpdated'));
        }
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

  async function handleBulkUpdate() {
    if (selectedIds.length === 0) {
      showToast(t('bulkSelectAtLeastOne'));
      return;
    }

    const patch: UpdateClassDto = {};

    if (bulkDurationMin.trim() !== '') {
      const value = Number(bulkDurationMin);
      if (!Number.isFinite(value) || value < 15 || value > 240) {
        showToast(t('bulkInvalidDuration'));
        return;
      }
      patch.durationMin = value;
    }

    if (bulkMaxCapacity.trim() !== '') {
      const value = Number(bulkMaxCapacity);
      if (!Number.isFinite(value) || value < 1 || value > 100) {
        showToast(t('bulkInvalidCapacity'));
        return;
      }
      patch.maxCapacity = value;
    }

    if (bulkInstructor.trim() !== '') {
      patch.instructor = bulkInstructor.trim();
    }

    if (bulkImageUrl.trim() !== '') {
      patch.imageUrl = bulkImageUrl.trim();
    }

    if (bulkIsActive !== 'UNCHANGED') {
      patch.isActive = bulkIsActive === 'ACTIVE';
    }

    if (Object.keys(patch).length === 0) {
      showToast(t('bulkSetAtLeastOneField'));
      return;
    }

    setIsBulkSubmitting(true);
    try {
      const results = await Promise.allSettled(selectedIds.map((id) => adminService.updateClass(id, patch)));
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (successCount > 0 && failCount === 0) {
        showToast(t('bulkSuccess', { success: successCount }));
      } else if (successCount > 0) {
        showToast(t('bulkPartial', { success: successCount, fail: failCount }));
      } else {
        showToast(t('bulkFailed'));
      }

      if (successCount > 0) {
        setSelectedIds([]);
        refresh();
      }
    } finally {
      setIsBulkSubmitting(false);
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
        <div className="space-y-4">
          <div className="rounded-xl border border-[#d4e2e5] bg-white p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <input
                type="text"
                placeholder={t('filtersSearchPlaceholder')}
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
              />

              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className="rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
              >
                <option value="ALL">{t('filtersAllDays')}</option>
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
              >
                <option value="ALL">{t('filtersAllTypes')}</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                className="rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
              >
                <option value="ALL">{t('filtersAllStatus')}</option>
                <option value="ACTIVE">{t('filtersOnlyActive')}</option>
                <option value="INACTIVE">{t('filtersOnlyInactive')}</option>
              </select>

              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'ACTIVITY' | 'DAY')}
                className="rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
              >
                <option value="ACTIVITY">{t('groupByActivity')}</option>
                <option value="DAY">{t('groupByDay')}</option>
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#5f7480]">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="rounded-md border border-[#d4e2e5] px-2.5 py-1.5 hover:bg-[#f3f8fa]"
              >
                {allVisibleSelected ? t('clearVisible') : t('selectVisible')}
              </button>
              <span>{t('countFiltered', { count: filteredClasses.length })}</span>
              <span>{t('countSelected', { count: selectedIds.length })}</span>
            </div>
          </div>

          <div className="rounded-xl border border-[#d4e2e5] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f7480]">{t('bulkTitle')}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <input
                type="number"
                min={15}
                max={240}
                placeholder={t('bulkDurationPlaceholder')}
                value={bulkDurationMin}
                onChange={(e) => setBulkDurationMin(e.target.value)}
                className="rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
              />
              <input
                type="number"
                min={1}
                max={100}
                placeholder={t('bulkMaxSpotsPlaceholder')}
                value={bulkMaxCapacity}
                onChange={(e) => setBulkMaxCapacity(e.target.value)}
                className="rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
              />
              <input
                type="text"
                placeholder={t('bulkInstructorPlaceholder')}
                value={bulkInstructor}
                onChange={(e) => setBulkInstructor(e.target.value)}
                className="rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
              />
              <input
                type="text"
                placeholder={t('bulkPhotoUrlPlaceholder')}
                value={bulkImageUrl}
                onChange={(e) => setBulkImageUrl(e.target.value)}
                className="rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
              />
              <select
                value={bulkIsActive}
                onChange={(e) => setBulkIsActive(e.target.value as 'UNCHANGED' | 'ACTIVE' | 'INACTIVE')}
                className="rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
              >
                <option value="UNCHANGED">{t('bulkStatusUnchanged')}</option>
                <option value="ACTIVE">{t('bulkSetActive')}</option>
                <option value="INACTIVE">{t('bulkSetInactive')}</option>
              </select>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={handleBulkUpdate}
                disabled={isBulkSubmitting || selectedIds.length === 0}
                className="rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50"
              >
                {isBulkSubmitting ? t('bulkApplying') : t('bulkApply')}
              </button>
            </div>
          </div>

          {filteredClasses.length === 0 ? (
            <div className="rounded-xl border border-[#d4e2e5] bg-white p-6 text-sm text-[#5f7480]">
              {t('noResults')}
            </div>
          ) : (
            groupedClasses.map((group) => {
              const isCollapsed = collapsedGroups[group.key] ?? false;
              return (
                <section key={group.key} className="overflow-hidden rounded-xl border border-[#d4e2e5] bg-white">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center justify-between bg-[#f9fcfd] px-4 py-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1f2e35]">{group.label}</p>
                      <p className="text-xs text-[#6f8591]">{t('countFiltered', { count: group.items.length })}</p>
                    </div>
                    <span className="text-xs text-[#5f7480]">{isCollapsed ? t('expand') : t('collapse')}</span>
                  </button>

                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-t border-[#d4e2e5] bg-white text-left text-[11px] uppercase tracking-[0.08em] text-[#6f8591]">
                            <th className="px-3 py-2">{t('tableSelect')}</th>
                            <th className="px-3 py-2">{t('colClass')}</th>
                            <th className="px-3 py-2">{t('colInstructor')}</th>
                            <th className="px-3 py-2">{t('colDay')}</th>
                            <th className="px-3 py-2">{t('colTime')}</th>
                            <th className="px-3 py-2">{t('colDuration')}</th>
                            <th className="px-3 py-2">{t('colSpots')}</th>
                            <th className="px-3 py-2">{t('colStatus')}</th>
                            <th className="px-3 py-2">{t('colActions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((c) => (
                            <tr key={c.id} className="border-t border-[#edf3f5] text-[#31444d]">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedIdSet.has(c.id)}
                                  onChange={() => toggleSelectOne(c.id)}
                                  className="rounded accent-[#3c8ea8]"
                                />
                              </td>
                              <td className="px-3 py-2 font-medium">{c.title}</td>
                              <td className="px-3 py-2">{c.instructor}</td>
                              <td className="px-3 py-2">{dayLabelByValue[c.dayOfWeek] ?? c.dayOfWeek}</td>
                              <td className="px-3 py-2">{c.startTime}</td>
                              <td className="px-3 py-2">{c.durationMin} min</td>
                              <td className="px-3 py-2">{c.maxCapacity}</td>
                              <td className="px-3 py-2">
                                <StatusBadge label={c.isActive ? t('statusActive') : t('statusInactive')} variant={c.isActive ? 'success' : 'neutral'} />
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEdit(c)}
                                    className="rounded border border-[#d4e2e5] px-2 py-1 text-xs text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors"
                                  >
                                    {t('btnEdit')}
                                  </button>
                                  {c.isActive && (
                                    <button
                                      onClick={() => setDeactivateTarget(c)}
                                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                      {t('btnDeactivate')}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
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
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-[#5f7480]">{t('fieldPhotoUrl')}</label>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#d4e2e5] px-3 py-2 text-xs font-medium text-[#5f7480] hover:bg-[#f3f8fa]">
                {isUploadingPhoto ? t('photoUploading') : t('photoUploadButton')}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={onPhotoSelected}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-[#8aa0ac]">{t('photoHint')}</span>
            </div>
            <input
              type="text"
              placeholder="/my-class-photo.jpg or https://..."
              value={form.imageUrl ?? ''}
              onChange={(e) => setField('imageUrl', e.target.value)}
              className="w-full rounded-lg border border-[#d4e2e5] px-3 py-2 text-sm outline-none focus:border-[#3c8ea8]"
            />
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt={t('photoPreviewAlt')}
                className="mt-2 h-24 w-full rounded-lg object-cover border border-[#d4e2e5]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            {editTarget && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="applyImageToSameTitle"
                  checked={applyImageToSameTitle}
                  onChange={(e) => setApplyImageToSameTitle(e.target.checked)}
                  className="rounded accent-[#3c8ea8]"
                />
                <label htmlFor="applyImageToSameTitle" className="text-xs text-[#5f7480]">
                  {t('applyImageToSameTitle')}
                </label>
              </div>
            )}
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

