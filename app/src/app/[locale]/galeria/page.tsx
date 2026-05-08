import { SiteNav } from '@/components/layout/SiteNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { GalleryContent } from '@/components/sections/GalleryContent';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const isPt = locale === 'pt';
  const title = isEn ? 'Studio Gallery' : isPt ? 'Galeria do Estúdio' : 'Galería del Estudio';
  const description = isEn
    ? 'Take a look inside Core Pilates Miami. Our modern studio, certified instructors and happy students.'
    : isPt
      ? 'Conheça o Core Pilates Miami. Estúdio moderno, instrutores certificados e alunos felizes.'
      : 'Mira dentro de Core Pilates Miami. Estudio moderno, instructores certificados.';
  return {
    title,
    description,
    alternates: {
      canonical: `https://corepilates.com/${locale}/galeria`,
      languages: {
        en: '/en/galeria',
        pt: '/pt/galeria',
        es: '/es/galeria',
      },
    },
    openGraph: { title, description, url: `https://corepilates.com/${locale}/galeria` },
  };
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <>
      <SiteNav locale={locale} isAdmin={isAdmin} />
      <main>
        <GalleryContent />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
