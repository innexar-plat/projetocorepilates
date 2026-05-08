import { SiteNav } from '@/components/layout/SiteNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PlansPageContent } from '@/components/sections/PlansPageContent';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const isPt = locale === 'pt';
  const title = isEn ? 'Plans & Pricing' : isPt ? 'Planos & Preços' : 'Planes y Precios';
  const description = isEn
    ? 'Flexible Pilates plans for every goal. No hidden fees, cancel anytime. View our pricing.'
    : isPt
      ? 'Planos de Pilates para todos os objetivos. Sem taxas ocultas, cancele quando quiser.'
      : 'Planes de Pilates para todos los objetivos. Sin tarifas ocultas, cancela cuando quieras.';
  return {
    title,
    description,
    alternates: {
      canonical: `https://corepilates.com/${locale}/planos`,
      languages: {
        en: '/en/planos',
        pt: '/pt/planos',
        es: '/es/planos',
      },
    },
    openGraph: { title, description, url: `https://corepilates.com/${locale}/planos` },
  };
}

export default async function PlansPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <>
      <SiteNav locale={locale} isAdmin={isAdmin} />
      <main>
        <PlansPageContent />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
