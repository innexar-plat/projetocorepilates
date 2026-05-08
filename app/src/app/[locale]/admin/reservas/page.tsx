import { AdminShell } from '@/components/layout/AdminShell';
import { AdminBookingsContent } from '@/components/sections/AdminBookingsContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminReservasPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminBookingsContent />
    </AdminShell>
  );
}
