'use client';

import { useState, useCallback, useEffect } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState } from '@/components/molecules/AdminStates';
import { useResource } from '@/hooks/use-resource';
import { adminService, type SiteSetting } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

/* Default settings groups + keys shipped on first load */
const DEFAULT_SETTINGS: SiteSetting[] = [
  { key: 'site.name', value: 'Core Pilates', group: 'general' },
  { key: 'site.tagline', value: 'Transform your body and mind', group: 'general' },
  { key: 'site.phone', value: '', group: 'contact' },
  { key: 'site.email', value: '', group: 'contact' },
  { key: 'site.address', value: '', group: 'contact' },
  { key: 'site.instagram', value: '', group: 'social' },
  { key: 'site.whatsapp', value: '', group: 'social' },
  { key: 'site.facebook', value: '', group: 'social' },
  { key: 'site.trial_classes', value: '1', group: 'business' },
  { key: 'site.cancellation_hours', value: '12', group: 'business' },
];

function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm text-white shadow-2xl animate-fade-up
      ${type === 'error' ? 'bg-red-600' : 'bg-[#1f2e35]'}`}>
      {message}
    </div>
  );
}

const GROUP_LABELS: Record<string, string> = {
  general: 'General',
  contact: 'Contact',
  social: 'Social Media',
  business: 'Business Rules',
};

export function AdminSettingsContent() {
  const t = useTranslations('admin.settings');
  const tc = useTranslations('admin.common');

  const [form, setForm] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const settingsResource = useResource(() => adminService.getSettings(), [refreshKey]);

  /* Merge fetched settings with defaults */
  useEffect(() => {
    const fetched = settingsResource.data ?? [];
    const base: Record<string, string> = {};
    for (const def of DEFAULT_SETTINGS) base[def.key] = def.value;
    for (const s of fetched) base[s.key] = s.value;
    setForm(base);
  }, [settingsResource.data]);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const settings = Object.entries(form).map(([key, value]) => ({
        key,
        value,
        group: DEFAULT_SETTINGS.find((d) => d.key === key)?.group ?? 'general',
      }));
      await adminService.saveSettings(settings);
      showToast(t('toastSaved'));
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      showToast(e.message ?? t('toastError'), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  /* Group the settings for rendering */
  const groups = DEFAULT_SETTINGS.reduce<Record<string, typeof DEFAULT_SETTINGS>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  if (settingsResource.error) {
    return <ErrorState message={settingsResource.error} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <div className="space-y-6">
        {Object.entries(groups).map(([group, fields]) => (
          <section
            key={group}
            className="rounded-2xl border border-[#d4e2e5] bg-white p-6 shadow-sm"
          >
            <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-[#3c8ea8]">
              {GROUP_LABELS[group] ?? group}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
                    {t(`key.${f.key.replace('site.', '')}` as any) || f.key.replace('site.', '')}
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#d4e2e5] bg-[#fbf8ef] px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none transition-colors"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={t(`placeholder.${f.key.replace('site.', '')}` as any) || ''}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || settingsResource.isLoading}
          className="rounded-xl bg-[#3c8ea8] px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#2f7084] disabled:opacity-60 transition-all duration-200"
        >
          {isSaving ? tc('saving') : t('saveAll')}
        </button>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}

