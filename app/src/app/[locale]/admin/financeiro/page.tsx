import { AdminShell } from '@/components/layout/AdminShell';
import { AdminFinanceiroContent } from '@/components/sections/AdminFinanceiroContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminFinanceiroPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminFinanceiroContent />
    </AdminShell>
  );
}
