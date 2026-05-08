import { AdminShell } from '@/components/layout/AdminShell';
import { AdminGalleryContent } from '@/components/sections/AdminGalleryContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminGalleryPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <AdminShell locale={locale}>
      <AdminGalleryContent />
    </AdminShell>
  );
}
