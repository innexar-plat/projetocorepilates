import { SiteNav } from '@/components/layout/SiteNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ContactForm } from '@/components/sections/ContactForm';
import { FadeIn } from '@/components/atoms/FadeIn';
import { auth } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const isPt = locale === 'pt';
  const title = isEn ? 'Contact Us' : isPt ? 'Fale Conosco' : 'Contáctenos';
  const description = isEn
    ? 'Book a free trial class or get in touch with Core Pilates Miami. We reply within 24 hours.'
    : isPt
      ? 'Agende uma aula experimental gratuita ou entre em contato com o Core Pilates Miami.'
      : 'Reserva una clase de prueba gratuita o contáctanos. Respondemos en 24 horas.';
  return {
    title,
    description,
    alternates: {
      canonical: `https://corepilates.com/${locale}/contato`,
      languages: {
        en: '/en/contato',
        pt: '/pt/contato',
        es: '/es/contato',
      },
    },
    openGraph: { title, description, url: `https://corepilates.com/${locale}/contato` },
  };
}

const INFO_ITEMS = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Address',
    value: '1234 Brickell Ave, Suite 500\nMiami, FL 33131',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    label: 'WhatsApp',
    value: '+1 (305) 555-2468',
    href: 'https://wa.me/13055552468',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Email',
    value: 'hello@corepilates.com',
    href: 'mailto:hello@corepilates.com',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Hours',
    value: 'Mon–Fri: 6 am – 9 pm\nSat–Sun: 8 am – 6 pm',
  },
];

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const [t, session] = await Promise.all([getTranslations('website.contact'), auth()]);
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <>
      <SiteNav locale={locale} isAdmin={isAdmin} />

      {/* Hero band */}
      <section className="bg-[var(--color-ink)] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <FadeIn variant="up">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
              {t('eyebrow')}
            </p>
            <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg text-white/60">
              {t('subtitle')}
            </p>
          </FadeIn>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">

          {/* Left — info panel */}
          <FadeIn variant="left">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-black text-[var(--color-ink)]">
                  {locale === 'pt' ? 'Informações de contato' : locale === 'es' ? 'Información de contacto' : 'Contact information'}
                </h2>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {locale === 'pt' ? 'Estamos aqui para ajudar.' : locale === 'es' ? 'Estamos aquí para ayudarte.' : 'We\'re here to help.'}
                </p>
              </div>

              <div className="space-y-5">
                {INFO_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith('http') ? '_blank' : undefined}
                          rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="mt-0.5 block text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors whitespace-pre-line"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm font-medium text-[var(--color-ink)] whitespace-pre-line">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Instagram CTA */}
              <a
                href="https://instagram.com/corepilates"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                @corepilates
              </a>
            </div>
          </FadeIn>

          {/* Right — form */}
          <FadeIn variant="right">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-black text-[var(--color-ink)]">
                {locale === 'pt' ? 'Envie uma mensagem' : locale === 'es' ? 'Envía un mensaje' : 'Send a message'}
              </h2>
              <ContactForm />
            </div>
          </FadeIn>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </>
  );
}

