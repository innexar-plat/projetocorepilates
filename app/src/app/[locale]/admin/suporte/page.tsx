import { AdminShell } from '@/components/layout/AdminShell';
import { AdminSupportContent } from '@/components/sections/AdminSupportContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminSuportePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminSupportContent />
    </AdminShell>
  );
}
