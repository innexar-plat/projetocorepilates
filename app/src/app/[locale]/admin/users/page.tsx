import { AdminShell } from '@/components/layout/AdminShell';
import { AdminUsersContent } from '@/components/sections/AdminUsersContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminUsersContent />
    </AdminShell>
  );
}
