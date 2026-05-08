import { AdminShell } from '@/components/layout/AdminShell';
import { AdminDashboardContent } from '@/components/sections/AdminDashboardContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminDashboardContent />
    </AdminShell>
  );
}
