import { SiteNav } from '@/components/layout/SiteNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { BlogContent } from '@/components/sections/BlogContent';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const isPt = locale === 'pt';
  const title = isEn ? 'Pilates Blog & Tips' : isPt ? 'Blog de Pilates & Dicas' : 'Blog de Pilates y Consejos';
  const description = isEn
    ? 'Expert tips, guides and articles about Pilates, wellness and healthy living from Core Pilates Miami.'
    : isPt
      ? 'Dicas, guias e artigos sobre Pilates, bem-estar e vida saudável do Core Pilates Miami.'
      : 'Consejos, guías y artículos sobre Pilates, bienestar y vida saludable.';
  return {
    title,
    description,
    alternates: {
      canonical: `https://corepilates.com/${locale}/blog`,
      languages: {
        en: '/en/blog',
        pt: '/pt/blog',
        es: '/es/blog',
      },
    },
    openGraph: { title, description, url: `https://corepilates.com/${locale}/blog` },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <>
      <SiteNav locale={locale} isAdmin={isAdmin} />
      <main>
        <BlogContent />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
