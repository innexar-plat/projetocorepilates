import { AdminShell } from '@/components/layout/AdminShell';
import { AdminSubscriptionsContent } from '@/components/sections/AdminSubscriptionsContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminAssinaturasPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminSubscriptionsContent />
    </AdminShell>
  );
}
