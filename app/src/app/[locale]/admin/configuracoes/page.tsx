import { AdminShell } from '@/components/layout/AdminShell';
import { AdminSettingsContent } from '@/components/sections/AdminSettingsContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <AdminShell locale={locale}>
      <AdminSettingsContent />
    </AdminShell>
  );
}
