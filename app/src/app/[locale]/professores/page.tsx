import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteNav } from '@/components/layout/SiteNav';
import { TeachersPageContent } from '@/components/sections/TeachersPageContent';
import { auth } from '@/lib/auth';
import { getMarketingContent } from '@/lib/site-content';
import type { Locale } from '@/i18n/routing';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const copy = getMarketingContent(locale).teacherPage;

  return {
    title: copy.title,
    description: copy.subtitle,
    alternates: {
      canonical: `https://braziliancorepilates.com/${locale}/professores`,
      languages: { en: '/en/professores', pt: '/pt/professores', es: '/es/professores' },
    },
  };
}

export default async function TeachersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <>
      <SiteNav locale={locale} isAdmin={isAdmin} />
      <TeachersPageContent locale={locale} />
      <SiteFooter locale={locale} />
    </>
  );
}