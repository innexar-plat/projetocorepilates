import { AdminShell } from '@/components/layout/AdminShell';
import { AdminLeadsContent } from '@/components/sections/AdminLeadsContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminLeadsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminLeadsContent />
    </AdminShell>
  );
}
