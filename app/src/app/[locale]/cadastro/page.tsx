import { RegisterForm } from '@/components/sections/RegisterForm';
import type { Locale } from '@/i18n/routing';
import type { Metadata } from 'next';

const copy: Record<Locale, { eyebrow: string; title: string; subtitle: string; bullets: string[] }> = {
  pt: {
    eyebrow: 'Comece hoje',
    title: 'Crie sua conta premium',
    subtitle: 'Tenha acesso ao portal, agende aulas e acompanhe sua evolução.',
    bullets: ['Cadastro rápido e seguro', 'Portal com histórico completo', 'Controle de aulas e pagamentos'],
  },
  en: {
    eyebrow: 'Start today',
    title: 'Create your premium account',
    subtitle: 'Get portal access, book classes and track your progress.',
    bullets: ['Fast and secure signup', 'Portal with full history', 'Classes and payments control'],
  },
  es: {
    eyebrow: 'Comienza hoy',
    title: 'Crea tu cuenta premium',
    subtitle: 'Accede al portal, reserva clases y sigue tu evolución.',
    bullets: ['Registro rápido y seguro', 'Portal con historial completo', 'Control de clases y pagos'],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === 'pt' ? 'Cadastro' : locale === 'es' ? 'Registro' : 'Sign up',
    description:
      locale === 'pt'
        ? 'Crie sua conta no Core Pilates com segurança.'
        : locale === 'es'
          ? 'Crea tu cuenta en Core Pilates de forma segura.'
          : 'Create your Core Pilates account securely.',
    alternates: {
      canonical: `https://corepilates.com/${locale}/cadastro`,
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
  const c = copy[locale];

  return (
    <main className="premium-bg mx-auto flex min-h-screen w-full max-w-6xl items-center rounded-3xl px-4 py-10 sm:px-6">
      <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-card hidden rounded-3xl p-8 lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">{c.eyebrow}</p>
          <h1 className="mt-2 text-5xl font-black leading-tight text-[var(--color-ink)]">{c.title}</h1>
          <p className="mt-3 max-w-md text-base text-[var(--color-muted)]">{c.subtitle}</p>
          <ul className="mt-8 space-y-3">
            {c.bullets.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-[var(--color-ink)]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand)]/15 text-[var(--color-brand)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <RegisterForm />
        </section>
      </div>
    </main>
  );
}
