import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteNav } from '@/components/layout/SiteNav';
import { PreRegistrationCard } from '@/components/sections/PreRegistrationCard';
import { auth } from '@/lib/auth';
import { getMarketingContent } from '@/lib/site-content';
import type { Locale } from '@/i18n/routing';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const copy = getMarketingContent(locale).registrationClosed;

  return {
    title: copy.title,
    description: copy.subtitle,
    alternates: {
      canonical: `https://braziliancorepilates.com/${locale}/cadastro`,
    },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const c = getMarketingContent(locale).registrationClosed;
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <>
      <SiteNav locale={locale} isAdmin={isAdmin} />
      <main className="premium-bg mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center rounded-3xl px-4 py-10 sm:px-6">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="glass-card rounded-3xl p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">{c.eyebrow}</p>
            <h1 className="mt-2 text-5xl font-black leading-tight text-[var(--color-ink)]">{c.title}</h1>
            <p className="mt-3 max-w-md text-base text-[var(--color-muted)]">{c.subtitle}</p>
            <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white/80 p-5">
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">{c.note}</p>
            </div>
          </section>

          <section>
            <PreRegistrationCard locale={locale} source={`pre-registration-page-${locale}`} />
          </section>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
