import { AdminShell } from '@/components/layout/AdminShell';
import { AdminPlansContent } from '@/components/sections/AdminPlansContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminPlanosPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminPlansContent />
    </AdminShell>
  );
}
