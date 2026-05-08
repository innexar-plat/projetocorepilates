'use client';

import { useState, useCallback } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Modal } from '@/components/molecules/Modal';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService, type AdminPlan, type CreatePlanDto, type UpdatePlanDto } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

const FIELD = 'w-full rounded-lg border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] placeholder-[#90a4af] outline-none focus:border-[#3c8ea8] focus:ring-2 focus:ring-[#3c8ea8]/20';
const LABEL = 'block text-xs font-medium text-[#5f7480] mb-1';

type CreateForm = {
  name: string;
  description: string;
  price: string;
  isPromotion: boolean;
  originalPrice: string;
  promotionalPrice: string;
  classesPerMonth: string;
  stripePriceId: string;
  stripeProductId: string;
  order: string;
};

const EMPTY_CREATE: CreateForm = {
  name: '',
  description: '',
  price: '',
  isPromotion: false,
  originalPrice: '',
  promotionalPrice: '',
  classesPerMonth: '',
  stripePriceId: '',
  stripeProductId: '',
  order: '0',
};

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

function IconClipboardList() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mx-auto h-9 w-9 text-[#8ea4af]" aria-hidden="true">
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M9 4.5h6v3H9z" />
      <path d="M9 11h6M9 15h6" />
    </svg>
  );
}

export function AdminPlansContent() {
  const t = useTranslations('admin.plans');
  const tc = useTranslations('admin.common');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [selected, setSelected] = useState<AdminPlan | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    isPromotion: false,
    originalPrice: '',
    promotionalPrice: '',
    classesPerMonth: '',
    stripePriceId: '',
    stripeProductId: '',
    isActive: true,
    order: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const plans = useResource(() => adminService.listPlans(), [refreshKey]);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function setC(key: keyof CreateForm, v: string) {
    setCreateForm((f) => ({ ...f, [key]: v }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  function openCreate() {
    setCreateForm(EMPTY_CREATE);
    setErrors({});
    setShowCreate(true);
  }

  function openEdit(plan: AdminPlan) {
    setSelected(plan);
    setEditForm({
      name: plan.name,
      description: plan.description ?? '',
      price: String(plan.price),
      isPromotion: Boolean(plan.isPromotion),
      originalPrice: plan.originalPrice != null ? String(plan.originalPrice) : String(plan.price),
      promotionalPrice: plan.promotionalPrice != null ? String(plan.promotionalPrice) : String(plan.price),
      classesPerMonth: String(plan.classesPerMonth),
      stripePriceId: plan.stripePriceId ?? '',
      stripeProductId: plan.stripeProductId ?? '',
      isActive: plan.isActive,
      order: String(plan.order),
    });
    setErrors({});
    setShowEdit(true);
  }

  function openDeactivate(plan: AdminPlan) {
    setSelected(plan);
    setShowDeactivate(true);
  }

  function validateCreate(): boolean {
    const e: Record<string, string> = {};
    if (!createForm.name.trim() || createForm.name.length < 2) e.name = 'Name must be at least 2 characters';
    const price = Number(createForm.price);
    if (!createForm.price || isNaN(price) || price <= 0) e.price = 'Enter a valid price (e.g. 120.00)';

    if (createForm.isPromotion) {
      const originalPrice = Number(createForm.originalPrice);
      const promotionalPrice = Number(createForm.promotionalPrice);

      if (!createForm.originalPrice || isNaN(originalPrice) || originalPrice <= 0) {
        e.originalPrice = 'Original price is required for promotion';
      }
      if (!createForm.promotionalPrice || isNaN(promotionalPrice) || promotionalPrice <= 0) {
        e.promotionalPrice = 'Promotional price is required';
      }
      if (!e.originalPrice && !e.promotionalPrice && promotionalPrice >= originalPrice) {
        e.promotionalPrice = 'Promotional price must be lower than original price';
      }
    }

    const classes = Number(createForm.classesPerMonth);
    if (!createForm.classesPerMonth || isNaN(classes) || classes < 1) e.classesPerMonth = 'Enter number of classes (1-999, use 999 for unlimited)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validateCreate()) return;
    setIsSubmitting(true);
    try {
      const dto: CreatePlanDto = {
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        price: Number(createForm.price),
        isPromotion: createForm.isPromotion,
        originalPrice: createForm.isPromotion ? Number(createForm.originalPrice) : undefined,
        promotionalPrice: createForm.isPromotion ? Number(createForm.promotionalPrice) : undefined,
        classesPerMonth: Number(createForm.classesPerMonth),
        stripePriceId: createForm.stripePriceId.trim() || undefined,
        stripeProductId: createForm.stripeProductId.trim() || undefined,
        order: Number(createForm.order) || 0,
      };
      await adminService.createPlan(dto);
      showToast(t('toastCreated', { name: dto.name }));
      setShowCreate(false);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastCreateError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!selected) return;
    const e: Record<string, string> = {};
    if (!editForm.name.trim() || editForm.name.length < 2) e.name = t('valNameMin');
    const price = Number(editForm.price);
    if (!editForm.price || isNaN(price) || price <= 0) e.price = t('valPrice');

    if (editForm.isPromotion) {
      const originalPrice = Number(editForm.originalPrice);
      const promotionalPrice = Number(editForm.promotionalPrice);

      if (!editForm.originalPrice || isNaN(originalPrice) || originalPrice <= 0) {
        e.originalPrice = 'Original price is required for promotion';
      }
      if (!editForm.promotionalPrice || isNaN(promotionalPrice) || promotionalPrice <= 0) {
        e.promotionalPrice = 'Promotional price is required';
      }
      if (!e.originalPrice && !e.promotionalPrice && promotionalPrice >= originalPrice) {
        e.promotionalPrice = 'Promotional price must be lower than original price';
      }
    }

    const classes = Number(editForm.classesPerMonth);
    if (!editForm.classesPerMonth || isNaN(classes) || classes < 1 || classes > 999) e.classesPerMonth = t('valClasses');
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setIsSubmitting(true);
    try {
      const dto: UpdatePlanDto = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        price,
        isPromotion: editForm.isPromotion,
        originalPrice: editForm.isPromotion ? Number(editForm.originalPrice) : undefined,
        promotionalPrice: editForm.isPromotion ? Number(editForm.promotionalPrice) : undefined,
        classesPerMonth: classes,
        stripePriceId: editForm.stripePriceId.trim() || undefined,
        stripeProductId: editForm.stripeProductId.trim() || undefined,
        isActive: editForm.isActive,
        order: Number(editForm.order) || 0,
      };
      await adminService.updatePlan(selected.id, dto);
      showToast(t('toastUpdated', { name: editForm.name }));
      setShowEdit(false);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastUpdateError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await adminService.updatePlan(selected.id, { isActive: false });
      showToast(t('toastDeactivated', { name: selected.name }));
      setShowDeactivate(false);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastDeactivateError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const all = plans.data ?? [];
  const active = all.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitleCount', { all: all.length, active })}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[#3c8ea8] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#367f96] transition-colors"
          >
            <span className="text-base leading-none">+</span> {t('newPlan')}
          </button>
        }
      />

      {plans.isLoading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : plans.error ? (
        <ErrorState message={plans.error} />
      ) : all.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d4e2e5] bg-[#f7fbfc] py-16 text-center">
          <div className="mb-3">
            <IconClipboardList />
          </div>
          <p className="text-sm font-medium text-[#5f7480]">{t('emptyTitle')}</p>
          <p className="text-xs text-[#8097a3] mt-1">{t('emptyHint')}</p>
          <button onClick={openCreate} className="mt-4 rounded-lg bg-[#3c8ea8] px-5 py-2 text-sm font-medium text-white hover:bg-[#367f96]">
            {t('emptyBtn')}
          </button>
        </div>
      ) : (
        <DataTable
          keyField="id"
          emptyText={t('noResults')}
          rows={all.sort((a, b) => a.order - b.order).map((p) => ({ ...p, _raw: p }))}
          columns={[
            { key: 'order', label: t('colOrder'), render: (v) => <span className="text-xs text-[#c8bfa8] font-mono">{v as number + 1}</span> },
            { key: 'name', label: t('colName') },
            { key: 'description', label: t('colDescription'), render: (v) => <span className="text-xs text-[#8097a3] max-w-[200px] truncate block">{(v as string) || '-'}</span> },
            { key: 'price', label: t('colPrice'),
              render: (v, row) => {
                const plan = row as AdminPlan;
                return (
                  <div className="flex flex-col">
                    {plan.isPromotion && plan.originalPrice && Number(plan.originalPrice) > Number(v) && (
                      <span className="text-xs text-[#8097a3] line-through">${Number(plan.originalPrice).toFixed(2)}</span>
                    )}
                    <span className="font-semibold text-[#3c8ea8]">${Number(v).toFixed(2)}<span className="font-normal text-[#8097a3] text-xs">{t('perMonth')}</span></span>
                    {plan.isPromotion && (
                      <span className="mt-1 inline-flex w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Promo</span>
                    )}
                  </div>
                );
              },
            },
            { key: 'classesPerMonth', label: t('colClassesMonth'),
              render: (v) => (v as number) === 999 ? <span className="text-[#3c8ea8] font-medium">{t('unlimited')}</span> : <span>{v as number}</span>,
            },
            { key: 'isActive', label: t('colStatus'),
              render: (v) => <StatusBadge label={v ? t('statusActive') : t('statusInactive')} variant={v ? 'success' : 'error'} />,
            },
            { key: '_raw', label: t('colActions'),
              render: (v) => {
                const p = v as AdminPlan;
                return (
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(p)}
                      className="rounded px-2 py-1 text-xs border border-[#d4e2e5] text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors">
                      {t('btnEdit')}
                    </button>
                    {p.isActive && (
                      <button onClick={() => openDeactivate(p)}
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

      {/* Modal: Criar Plano */}
      <Modal
        title={t('createTitle')}
        open={showCreate}
        onClose={() => setShowCreate(false)}
        size="lg"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]">
              {tc('cancel')}
            </button>
            <button onClick={handleCreate} disabled={isSubmitting} className="rounded-lg bg-[#3c8ea8] px-5 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50">
              {isSubmitting ? tc('creating') : t('btnCreate')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <strong>Note:</strong> If Stripe IDs are blank, they will be created automatically when the plan is saved.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LABEL}>{t('fieldName')}</label>
              <input className={FIELD} value={createForm.name} onChange={(e) => setC('name', e.target.value)} placeholder={t('namePlaceholder')} />
              <FieldErr msg={errors.name} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>{t('fieldDescription')}</label>
              <input className={FIELD} value={createForm.description} onChange={(e) => setC('description', e.target.value)} placeholder={t('descriptionPlaceholder')} />
            </div>
            <div>
              <label className={LABEL}>{t('fieldPrice')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8097a3]">$</span>
                <input type="number" step="0.01" min="0" className={`${FIELD} pl-7`} value={createForm.price} onChange={(e) => setC('price', e.target.value)} placeholder={t('pricePlaceholder')} />
              </div>
              <FieldErr msg={errors.price} />
            </div>
            <div className="col-span-2 rounded-lg border border-[#d4e2e5] bg-[#f7fbfc] p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1f2e35]">
                <input
                  type="checkbox"
                  checked={createForm.isPromotion}
                  onChange={(e) => {
                    setCreateForm((f) => ({ ...f, isPromotion: e.target.checked }));
                    setErrors((prev) => ({ ...prev, originalPrice: '', promotionalPrice: '' }));
                  }}
                  className="h-4 w-4 accent-[#3c8ea8]"
                />
                Promotional plan
              </label>
              {createForm.isPromotion && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Original price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={FIELD}
                      value={createForm.originalPrice}
                      onChange={(e) => setC('originalPrice', e.target.value)}
                      placeholder="120.00"
                    />
                    <FieldErr msg={errors.originalPrice} />
                  </div>
                  <div>
                    <label className={LABEL}>Promotional price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={FIELD}
                      value={createForm.promotionalPrice}
                      onChange={(e) => setC('promotionalPrice', e.target.value)}
                      placeholder="89.00"
                    />
                    <FieldErr msg={errors.promotionalPrice} />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className={LABEL}>{t('fieldClasses')}</label>
              <input type="number" min="1" max="999" className={FIELD} value={createForm.classesPerMonth} onChange={(e) => setC('classesPerMonth', e.target.value)} placeholder={t('classesPlaceholder')} />
              <FieldErr msg={errors.classesPerMonth} />
            </div>
            <div>
              <label className={LABEL}>{t('fieldStripePriceId')}</label>
              <input className={FIELD} value={createForm.stripePriceId} onChange={(e) => setC('stripePriceId', e.target.value)} placeholder={t('stripePricePlaceholder')} />
              <FieldErr msg={errors.stripePriceId} />
            </div>
            <div>
              <label className={LABEL}>{t('fieldStripeProductId')}</label>
              <input className={FIELD} value={createForm.stripeProductId} onChange={(e) => setC('stripeProductId', e.target.value)} placeholder={t('stripeProductPlaceholder')} />
              <FieldErr msg={errors.stripeProductId} />
            </div>
            <div>
              <label className={LABEL}>{t('fieldOrder')}</label>
              <input type="number" min="0" className={FIELD} value={createForm.order} onChange={(e) => setC('order', e.target.value)} placeholder="0" />
              <p className="mt-1 text-xs text-[#8097a3]">{t('orderHint')}</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: Editar Plano */}
      <Modal
        title={t('editTitle', { name: selected?.name ?? '' })}  
        open={showEdit}
        onClose={() => setShowEdit(false)}
        size="md"
        footer={
          <>
            <button onClick={() => setShowEdit(false)} className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa]">
              {tc('cancel')}
            </button>
            <button onClick={handleEdit} disabled={isSubmitting} className="rounded-lg bg-[#3c8ea8] px-5 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50">
              {isSubmitting ? tc('saving') : tc('save')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-[#f7fbfc] border border-[#d4e2e5] p-3 text-xs text-[#5f7480]">
            Stripe IDs are optional. Leave blank to auto-create product/price on save.
          </div>
          <div>
            <label className={LABEL}>{t('fieldNameEdit')}</label>
            <input className={FIELD} value={editForm.name} onChange={(e) => { setEditForm((f) => ({ ...f, name: e.target.value })); setErrors({}); }} />
            <FieldErr msg={errors.name} />
          </div>
          <div>
            <label className={LABEL}>{t('fieldDescriptionEdit')}</label>
            <input className={FIELD} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>{t('fieldPrice')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8097a3]">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${FIELD} pl-7`}
                  value={editForm.price}
                  onChange={(e) => { setEditForm((f) => ({ ...f, price: e.target.value })); setErrors((x) => ({ ...x, price: '' })); }}
                  placeholder={t('pricePlaceholder')}
                />
              </div>
              <FieldErr msg={errors.price} />
            </div>
            <div className="col-span-2 rounded-lg border border-[#d4e2e5] bg-[#f7fbfc] p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1f2e35]">
                <input
                  type="checkbox"
                  checked={editForm.isPromotion}
                  onChange={(e) => setEditForm((f) => ({ ...f, isPromotion: e.target.checked }))}
                  className="h-4 w-4 accent-[#3c8ea8]"
                />
                Promotional plan
              </label>
              {editForm.isPromotion && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Original price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={FIELD}
                      value={editForm.originalPrice}
                      onChange={(e) => setEditForm((f) => ({ ...f, originalPrice: e.target.value }))}
                      placeholder="120.00"
                    />
                    <FieldErr msg={errors.originalPrice} />
                  </div>
                  <div>
                    <label className={LABEL}>Promotional price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={FIELD}
                      value={editForm.promotionalPrice}
                      onChange={(e) => setEditForm((f) => ({ ...f, promotionalPrice: e.target.value }))}
                      placeholder="89.00"
                    />
                    <FieldErr msg={errors.promotionalPrice} />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className={LABEL}>{t('fieldClasses')}</label>
              <input
                type="number"
                min="1"
                max="999"
                className={FIELD}
                value={editForm.classesPerMonth}
                onChange={(e) => { setEditForm((f) => ({ ...f, classesPerMonth: e.target.value })); setErrors((x) => ({ ...x, classesPerMonth: '' })); }}
                placeholder={t('classesPlaceholder')}
              />
              <FieldErr msg={errors.classesPerMonth} />
            </div>
            <div>
              <label className={LABEL}>{t('fieldStripePriceId')}</label>
              <input
                className={FIELD}
                value={editForm.stripePriceId}
                onChange={(e) => { setEditForm((f) => ({ ...f, stripePriceId: e.target.value })); setErrors((x) => ({ ...x, stripePriceId: '' })); }}
                placeholder={t('stripePricePlaceholder')}
              />
              <FieldErr msg={errors.stripePriceId} />
            </div>
            <div>
              <label className={LABEL}>{t('fieldStripeProductId')}</label>
              <input
                className={FIELD}
                value={editForm.stripeProductId}
                onChange={(e) => { setEditForm((f) => ({ ...f, stripeProductId: e.target.value })); setErrors((x) => ({ ...x, stripeProductId: '' })); }}
                placeholder={t('stripeProductPlaceholder')}
              />
              <FieldErr msg={errors.stripeProductId} />
            </div>
          </div>
          <div>
            <label className={LABEL}>{t('fieldOrderEdit')}</label>
            <input type="number" min="0" className={FIELD} value={editForm.order} onChange={(e) => setEditForm((f) => ({ ...f, order: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>{t('fieldStatusEdit')}</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" checked={editForm.isActive} onChange={() => setEditForm((f) => ({ ...f, isActive: true }))} className="accent-[#3c8ea8]" />
                {t('statusActiveRadio')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" checked={!editForm.isActive} onChange={() => setEditForm((f) => ({ ...f, isActive: false }))} className="accent-red-500" />
                {t('statusInactiveRadio')}
              </label>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeactivate}
        title={t('deactivateTitle')}
        message={t('deactivateMsg', { name: selected?.name ?? '' })}
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivate(false)}
        isLoading={isSubmitting}
        confirmLabel={t('deactivateConfirm')}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1f2e35] px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}

