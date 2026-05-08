import { AdminShell } from '@/components/layout/AdminShell';
import { AdminClassesContent } from '@/components/sections/AdminClassesContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminClassesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminClassesContent />
    </AdminShell>
  );
}
