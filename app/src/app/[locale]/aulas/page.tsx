import { SiteNav } from '@/components/layout/SiteNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClassesCatalog } from '@/components/sections/ClassesCatalog';
import { auth } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const isPt = locale === 'pt';
  const title = isEn ? 'Pilates Classes Schedule' : isPt ? 'Grade de Aulas de Pilates' : 'Horarios de Clases de Pilates';
  const description = isEn
    ? 'Browse our full Pilates class schedule. Reformer, mat, prenatal and more. Book your spot online.'
    : isPt
      ? 'Veja a grade completa de aulas de Pilates. Reformer, solo, pré-natal e mais. Reserve sua vaga.'
      : 'Consulta el horario completo de clases de Pilates. Reformer, mat, prenatal y más.';
  return {
    title,
    description,
    alternates: {
      canonical: `https://corepilates.com/${locale}/aulas`,
      languages: {
        en: '/en/aulas',
        pt: '/pt/aulas',
        es: '/es/aulas',
      },
    },
    openGraph: { title, description, url: `https://corepilates.com/${locale}/aulas` },
  };
}

export default async function ClassesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const [t, session] = await Promise.all([getTranslations('website.classes'), auth()]);
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <>
      <SiteNav locale={locale} isAdmin={isAdmin} />
      <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />
        <ClassesCatalog />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
