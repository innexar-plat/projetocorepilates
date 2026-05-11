import { Link } from '@/i18n/navigation';
import { getMarketingContent } from '@/lib/site-content';
import type { Locale } from '@/i18n/routing';

const TEACHER_PHOTOS: Record<string, string> = {
  'Fernanda Santos': '/fernanda.jpeg',
  'Cleide Ostroff': '/cleide.jpeg',
};

type Props = { locale: Locale };

export function TeachersPageContent({ locale }: Props) {
  const copy = getMarketingContent(locale).teacherPage;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,245,238,0.96))] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">{copy.eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-[var(--color-ink)] sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--color-muted)]">{copy.subtitle}</p>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        {copy.teachers.map((teacher) => {
          const photo = TEACHER_PHOTOS[teacher.name];

          return (
            <article key={teacher.name} className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              {/* Teacher photo */}
              {photo && (
                <div className="relative aspect-[4/5] overflow-hidden bg-white">
                  <img
                    src={photo}
                    alt={teacher.name}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="p-7">
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{teacher.role}</p>
                  <h2 className="mt-1 text-2xl font-black text-[var(--color-ink)]">{teacher.name}</h2>
                </div>

                {!photo && (
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand)]/12 text-xl font-black text-[var(--color-brand)]">
                    {teacher.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}

                <a href={`tel:${teacher.phoneHref}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand)] hover:underline">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.58 1.18 2 2 0 012.56 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l.91-.91a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {copy.contactLabel}: {teacher.phoneLabel}
                </a>

                <p className="mt-5 text-sm leading-relaxed text-[var(--color-muted)]">{teacher.bio}</p>

                <div className="mt-5 rounded-2xl bg-[var(--color-paper)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]">{copy.focusLabel}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {teacher.focus.map((item) => (
                      <span key={item} className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-10 rounded-[32px] bg-[var(--color-ink)] p-8 text-white sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">{getMarketingContent(locale).preRegistration.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black">{copy.ctaTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80">{copy.ctaText}</p>
        <div className="mt-6">
          <Link href="/cadastro" locale={locale} className="inline-flex rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--color-brand-dark)]">
            {copy.ctaButton}
          </Link>
        </div>
      </section>
    </main>
  );
}
