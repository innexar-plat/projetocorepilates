import { AdminShell } from '@/components/layout/AdminShell';
import { AdminClientProfilesContent } from '@/components/sections/AdminClientProfilesContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminPerfisPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminClientProfilesContent />
    </AdminShell>
  );
}
