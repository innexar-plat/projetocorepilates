import { Link } from '@/i18n/navigation';
import { getMarketingContent } from '@/lib/site-content';
import type { Locale } from '@/i18n/routing';

type Props = { locale: Locale };

export function TeachersPageContent({ locale }: Props) {
  const copy = getMarketingContent(locale).teacherPage;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,242,232,0.96))] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">{copy.eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-[var(--color-ink)] sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--color-muted)]">{copy.subtitle}</p>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        {copy.teachers.map((teacher) => {
          const initials = teacher.name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <article key={teacher.name} className="rounded-[28px] border border-[var(--color-border)] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand)]/12 text-xl font-black text-[var(--color-brand)]">
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">{teacher.role}</p>
                  <h2 className="mt-1 text-2xl font-black text-[var(--color-ink)]">{teacher.name}</h2>
                  <a href={`tel:${teacher.phoneHref}`} className="mt-2 inline-flex text-sm font-semibold text-[var(--color-brand)] hover:underline">
                    {copy.contactLabel}: {teacher.phoneLabel}
                  </a>
                </div>
              </div>

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
            </article>
          );
        })}
      </section>

      <section className="mt-10 rounded-[32px] bg-[var(--color-ink)] p-8 text-white sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">{getMarketingContent(locale).preRegistration.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black">{copy.ctaTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80">{copy.ctaText}</p>
        <div className="mt-6">
          <Link href="/cadastro" locale={locale} className="inline-flex rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-95">
            {copy.ctaButton}
          </Link>
        </div>
      </section>
    </main>
  );
}