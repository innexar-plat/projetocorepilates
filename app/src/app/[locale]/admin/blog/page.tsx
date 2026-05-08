import { AdminShell } from '@/components/layout/AdminShell';
import { AdminBlogContent } from '@/components/sections/AdminBlogContent';
import type { Locale } from '@/i18n/routing';

export default async function AdminBlogPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <AdminShell locale={locale}>
      <AdminBlogContent />
    </AdminShell>
  );
}
