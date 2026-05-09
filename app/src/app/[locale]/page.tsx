import { SiteNav } from '@/components/layout/SiteNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { GrandOpeningPopup } from '@/components/sections/GrandOpeningPopup';
import { HeroSection } from '@/components/sections/HeroSection';
import { WebsiteHomeContent } from '@/components/sections/WebsiteHomeContent';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const isPt = locale === 'pt';
  let title = 'Brazilian Core Pilates — Mueve tu cuerpo con proposito';
  let description = 'Studio boutique de Pilates en Sebastian, Florida. Conoce la inauguracion, las profesoras y el pre-registro prioritario.';

  if (isEn) {
    title = 'Brazilian Core Pilates — Move Beyond Borders';
    description = 'Boutique Pilates studio in Sebastian, Florida. Explore classes, meet the founders and join the opening pre-registration list.';
  } else if (isPt) {
    title = 'Brazilian Core Pilates — Va alem das fronteiras';
    description = 'Studio boutique de Pilates em Sebastian, Florida. Conheca as professoras, as aulas e entre no pre-cadastro da inauguracao.';
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://braziliancorepilates.com/${locale}`,
      languages: { en: '/en', pt: '/pt', es: '/es' },
    },
    openGraph: { title, description, url: `https://braziliancorepilates.com/${locale}` },
  };
}

export default async function HomePage({ params }: Readonly<{ params: Promise<{ locale: Locale }> }>) {
  const { locale } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <>
      <SiteNav locale={locale} isAdmin={isAdmin} />
      <main>
        <HeroSection locale={locale} />
        <WebsiteHomeContent />
        <GrandOpeningPopup locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
