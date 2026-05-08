import { AdminShell } from '@/components/layout/AdminShell';
import { AdminSessionsContent } from '@/components/sections/AdminSessionsContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminSessoesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return (
    <AdminShell locale={locale}>
      <AdminSessionsContent />
    </AdminShell>
  );
}
