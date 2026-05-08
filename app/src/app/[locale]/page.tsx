import { SiteNav } from '@/components/layout/SiteNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { HeroSection } from '@/components/sections/HeroSection';
import { WebsiteHomeContent } from '@/components/sections/WebsiteHomeContent';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const isPt = locale === 'pt';
  const title = isEn
    ? 'Core Pilates Miami — Transform Your Body & Mind'
    : isPt
      ? 'Core Pilates Miami — Transforme Seu Corpo e Mente'
      : 'Core Pilates Miami — Transforma Tu Cuerpo y Mente';
  const description = isEn
    ? 'Premium Pilates studio in Miami. Reformer & mat classes, certified instructors. Start your trial today.'
    : isPt
      ? 'Estúdio de Pilates premium em Miami. Aulas de reformer e mat. Comece sua aula experimental hoje.'
      : 'Estudio de Pilates premium en Miami. Clases de reformer y mat. Empieza tu clase de prueba hoy.';
  return {
    title,
    description,
    alternates: {
      canonical: `https://corepilates.com/${locale}`,
      languages: { en: '/en', pt: '/pt', es: '/es' },
    },
    openGraph: { title, description, url: `https://corepilates.com/${locale}` },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <>
      <SiteNav locale={locale} isAdmin={isAdmin} />
      <main>
        <HeroSection locale={locale} />
        <WebsiteHomeContent />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
