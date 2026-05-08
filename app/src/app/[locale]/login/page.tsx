import { LoginForm } from '@/components/sections/LoginForm';
import type { Locale } from '@/i18n/routing';
import type { Metadata } from 'next';

const copy: Record<Locale, { eyebrow: string; title: string; subtitle: string; bullets: string[] }> = {
  pt: {
    eyebrow: 'Acesso seguro',
    title: 'Bem-vindo de volta',
    subtitle: 'Entre para gerenciar aulas, pagamentos e seu progresso no Core Pilates.',
    bullets: ['Painel completo do aluno', 'Agendamento com poucos cliques', 'Histórico e suporte em um só lugar'],
  },
  en: {
    eyebrow: 'Secure access',
    title: 'Welcome back',
    subtitle: 'Sign in to manage classes, payments and your Core Pilates progress.',
    bullets: ['Complete student dashboard', 'Quick booking flow', 'History and support in one place'],
  },
  es: {
    eyebrow: 'Acceso seguro',
    title: 'Bienvenido de nuevo',
    subtitle: 'Inicia sesión para gestionar clases, pagos y tu progreso en Core Pilates.',
    bullets: ['Panel completo del alumno', 'Reserva rápida de clases', 'Historial y soporte en un solo lugar'],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === 'pt' ? 'Login' : locale === 'es' ? 'Iniciar sesión' : 'Login',
    description:
      locale === 'pt'
        ? 'Acesso seguro à sua conta no Core Pilates.'
        : locale === 'es'
          ? 'Acceso seguro a tu cuenta en Core Pilates.'
          : 'Secure access to your Core Pilates account.',
    alternates: {
      canonical: `https://corepilates.com/${locale}/login`,
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

export default async function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
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
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
