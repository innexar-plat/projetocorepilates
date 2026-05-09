'use client';

import { useState } from 'react';
import { FadeIn } from '@/components/atoms/FadeIn';
import { BenefitsSection } from '@/components/sections/BenefitsSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { getMarketingContent } from '@/lib/site-content';
import { useResource } from '@/hooks/use-resource';
import { websiteService } from '@/services/website.service';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

/* â”€â”€ Class image mapping by keyword â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function getClassImage(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('mat') || t.includes('classic mat')) return '/MAT-Pilates-com-acessÃ³rios-CAPA.jpg';
  if (t.includes('flow')) return '/flowpilates.jpg';
  if (t.includes('burn')) return '/Core+Burn+-94.webp';
  if (t.includes('boot')) return '/brazilianbooty.webp';
  if (t.includes('upper') || t.includes('body')) return '/upper-boody.jfif';
  if (t.includes('conditioning') || t.includes('fitness')) return '/FitConditioning.jpg';
  if (t.includes('ball')) return '/ideia1.jpeg';
  if (t.includes('equipment') || t.includes('intro') || t.includes('reformer')) return '/ideia2.jpeg';
  return '/ideia3.jpeg';
}

/* â”€â”€ Static class types catalog (shown on home as visual grid) â”€â”€ */
const CLASS_TYPES = [
  {
    name: 'Classic Mat Pilatesâ„¢',
    desc: 'A timeless full-body class that improves strength, posture, flexibility, balance, and body awareness.',
    img: '/MAT-Pilates-com-acessÃ³rios-CAPA.jpg',
  },
  {
    name: 'Classical Pilates Ballâ„¢',
    desc: 'Enhances core strength, stability, coordination and flexibility using the Pilates ball for deeper muscle activation.',
    img: '/ideia1.jpeg',
  },
  {
    name: 'Brazilian Flow Pilatesâ„¢',
    desc: 'A fluid and energizing class that blends strength, mobility, posture and rhythm for graceful movement.',
    img: '/flowpilates.jpg',
  },
  {
    name: 'Brazilian Burnâ„¢',
    desc: 'A high-energy conditioning class that elevates endurance, burns calories and builds lean strength with intensity.',
    img: '/Core+Burn+-94.webp',
  },
  {
    name: 'Brazilian Bootâ„¢',
    desc: 'Lower body sculpting focused on glutes, legs, hips and pelvic stability.',
    img: '/brazilianbooty.webp',
  },
  {
    name: 'Brazilian Upper Bodyâ„¢',
    desc: 'Strengthen and tone your upper body with targeted exercises for arms, shoulders, back, chest and posture.',
    img: '/upper-boody.jfif',
  },
  {
    name: 'Brazilian Fitness Conditioningâ„¢',
    desc: 'Dynamic full-body training that improves strength, endurance, agility, and overall performance.',
    img: '/FitConditioning.jpg',
  },
  {
    name: 'Intro Equipment Experienceâ„¢',
    desc: 'Introduction to Reformer, Cadillac, Chair, Barrel and Mat. Learn, explore and build confidence with every piece of equipment.',
    img: '/ideia2.jpeg',
  },
  {
    name: 'Private Sessionâ„¢',
    desc: 'One-on-one personalized training tailored to your goals, needs, and fitness level.',
    img: '/ideia3.jpeg',
  },
  {
    name: 'Duet / Semi-Private Sessionâ„¢',
    desc: 'Train with a partner and enjoy personalized attention in a motivating and supportive environment.',
    img: '/fundobraziliancorepilates.png',
  },
] as const;

/* â”€â”€ Section separator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-12 text-center">
      <div className="flex items-center justify-center gap-4">
        <span className="h-px w-16 bg-[var(--color-brand)]/30 sm:w-24" />
        <p
          className="text-sm font-bold uppercase tracking-[0.28em] text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
        >
          {title}
        </p>
        <span className="h-px w-16 bg-[var(--color-brand)]/30 sm:w-24" />
      </div>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-sm text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function WebsiteHomeContent() {
  const t = useTranslations('home');
  const locale = useLocale() as Locale;
  const marketing = getMarketingContent(locale);
  const plans = useResource(() => websiteService.listPlans());
  const classes = useResource(() => websiteService.listClasses());
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  type PilatesClass = NonNullable<typeof classes.data>[number];

  const weekdayOrder: Record<string, number> = {
    MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4,
    FRIDAY: 5, SATURDAY: 6, SUNDAY: 7,
  };

  let weekdayLabel: Record<string, string>;
  if (locale === 'pt') {
    weekdayLabel = { MONDAY: 'Segunda-feira', TUESDAY: 'TerÃ§a-feira', WEDNESDAY: 'Quarta-feira', THURSDAY: 'Quinta-feira', FRIDAY: 'Sexta-feira', SATURDAY: 'SÃ¡bado', SUNDAY: 'Domingo' };
  } else if (locale === 'es') {
    weekdayLabel = { MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'MiÃ©rcoles', THURSDAY: 'Jueves', FRIDAY: 'Viernes', SATURDAY: 'SÃ¡bado', SUNDAY: 'Domingo' };
  } else {
    weekdayLabel = { MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday' };
  }

  const classesByDay = (classes.data ?? [])
    .slice()
    .sort((a, b) => {
      const dayDiff = (weekdayOrder[a.dayOfWeek] ?? 99) - (weekdayOrder[b.dayOfWeek] ?? 99);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    })
    .reduce((acc, item) => {
      const key = item.dayOfWeek;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, PilatesClass[]>);

  const dayEntries = Object.entries(classesByDay).sort(
    ([a], [b]) => (weekdayOrder[a] ?? 99) - (weekdayOrder[b] ?? 99),
  );
  const defaultOpenDay = dayEntries[0]?.[0];

  function isDayOpen(day: string) {
    if (day in openDays) return openDays[day];
    return day === defaultOpenDay;
  }
  function toggleDay(day: string) {
    setOpenDays((prev) => ({
      ...prev,
      [day]: !(day in prev ? prev[day] : day === defaultOpenDay),
    }));
  }

  return (
    <>
      {/* â”€â”€ OUR CLASSES section with image cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
        <FadeIn variant="up">
          <SectionTitle title="OUR CLASSES" subtitle="50 MINUTES EACH" />
        </FadeIn>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {CLASS_TYPES.map((cls, i) => (
            <FadeIn key={cls.name} variant="up" delay={((i % 3) + 1) as 1 | 2 | 3}>
              <Link href="/aulas" locale={locale}>
                <article className="group cursor-pointer overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[var(--color-brand)]/30">
                  <div className="relative h-44 overflow-hidden bg-[var(--color-paper-2)]">
                    <img
                      src={cls.img}
                      alt={cls.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-ink)] leading-tight">
                      {cls.name}
                    </h3>
                    <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)] line-clamp-3">
                      {cls.desc}
                    </p>
                  </div>
                </article>
              </Link>
            </FadeIn>
          ))}
        </div>

        {/* Senior Class â€” full width banner */}
        <FadeIn variant="up" className="mt-6">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-ink)] p-6 sm:p-8">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(/fundobraziliancorepilates.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="absolute inset-0 bg-[var(--color-ink)]/80" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
              <div className="flex-1">
                <h3 className="text-lg font-black uppercase tracking-[0.14em] text-white">
                  Senior Classâ„¢
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
                  A safe, supportive and effective class designed to improve mobility, balance, strength, flexibility and confidence. Ideal for active aging and enhancing quality of life through mindful movement.
                </p>
              </div>
              <div className="flex flex-wrap gap-6">
                {[
                  { label: 'Improves Mobility' },
                  { label: 'Builds Strength' },
                  { label: 'Enhances Balance' },
                  { label: 'Supports Active Living' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/15">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[var(--color-brand)]">
                        <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 10-16 0" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 whitespace-nowrap">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* â”€â”€ Method section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6">
        <FadeIn variant="up">
          <div className="grid gap-6 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(248,245,238,0.97),rgba(255,255,255,1))] p-6 shadow-[0_25px_70px_rgba(15,23,42,0.07)] lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:p-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">{marketing.methodSection.eyebrow}</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-bold text-[var(--color-ink)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '-0.025em' }}>
                {marketing.methodSection.title}
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--color-muted)] sm:text-lg">{marketing.methodSection.intro}</p>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-muted)] sm:text-lg">{marketing.methodSection.philosophy}</p>
            </div>
            <div className="flex h-full flex-col justify-between rounded-[1.75rem] bg-[var(--color-ink)] p-5 text-white sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">{marketing.methodSection.missionTitle}</p>
                <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">{marketing.methodSection.missionText}</p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {['Core', 'Posture', 'Confidence'].map((label, i) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-white/90">
                      {i === 0 ? 'Strength with control' : i === 1 ? 'Alignment with elegance' : 'Movement with purpose'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Benefits */}
      <BenefitsSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* â”€â”€ PRICING section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6" id="pricing">
        <FadeIn variant="up">
          <SectionTitle title="CHOOSE YOUR EXPERIENCE" />
        </FadeIn>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr_auto]">
          {/* Intro Equipment */}
          <FadeIn variant="up" delay={1}>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 h-full">
              <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--color-ink)]">
                Intro Equipment Experienceâ„¢
              </h3>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-brand)] font-semibold">
                Reformer Â· Cadillac Â· Chair Â· Barrel Â· Mat
              </p>
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Single Class', price: '$40' },
                  { label: '4 Classes / 3-Month Contract', price: '$120' },
                  { label: '8 Classes / 3-Month Contract', price: '$200' },
                  { label: 'Unlimited Classes / 6-Month', price: '$299/mo' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]/50 last:border-0">
                    <span className="text-xs text-[var(--color-muted)] uppercase tracking-[0.08em]">{row.label}</span>
                    <span className="text-sm font-bold text-[var(--color-brand)]">{row.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Pilates Ball & Conditioning â€” featured */}
          <FadeIn variant="up" delay={2}>
            <div className="rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-ink)] p-6 text-white h-full">
              <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-white">
                Pilates Ball & Brazilian Fitness Conditioningâ„¢
              </h3>
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Single Class', price: '$40' },
                  { label: '4 Classes / 3-Month Contract', price: '$120' },
                  { label: '8 Classes / 3-Month Contract', price: '$200' },
                  { label: 'Unlimited Classes / 6-Month', price: '$249/mo' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <span className="text-xs text-white/60 uppercase tracking-[0.08em]">{row.label}</span>
                    <span className="text-sm font-bold text-[var(--color-brand)]">{row.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* All Classes */}
          <FadeIn variant="up" delay={3}>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 h-full">
              <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--color-ink)]">
                All Classes â€” Unlimited Access
              </h3>
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Single Class', price: '$40' },
                  { label: '4 Classes / 3-Month Contract', price: '$140' },
                  { label: '8 Classes / 3-Month Contract', price: '$240' },
                  { label: 'Unlimited Classes / 6-Month', price: '$299/mo' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]/50 last:border-0">
                    <span className="text-xs text-[var(--color-muted)] uppercase tracking-[0.08em]">{row.label}</span>
                    <span className="text-sm font-bold text-[var(--color-brand)]">{row.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Private & Duet */}
          <FadeIn variant="up" delay={3}>
            <div className="min-w-[200px] space-y-4 lg:max-w-[240px]">
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--color-brand)]">
                    <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 10-16 0" />
                  </svg>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--color-ink)]">Private Sessions</h4>
                </div>
                {[
                  { label: 'Single Private Class', price: '$80' },
                  { label: '3 Private Classes', price: '$175' },
                  { label: '5 Private Classes', price: '$375' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]/50 last:border-0">
                    <span className="text-[11px] text-[var(--color-muted)]">{row.label}</span>
                    <span className="text-sm font-bold text-[var(--color-brand)]">{row.price}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--color-brand)]">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--color-ink)]">Duet / Semi-Private</h4>
                </div>
                {[
                  { label: 'Single Class (per person)', price: '$55' },
                  { label: '5-Class Package (per person)', price: '$250' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]/50 last:border-0">
                    <span className="text-[11px] text-[var(--color-muted)]">{row.label}</span>
                    <span className="text-sm font-bold text-[var(--color-brand)]">{row.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Plans from API */}
        {((plans.data ?? []).length > 0) && (
          <>
            <div className="mt-16">
              <FadeIn variant="up" className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">{t('plans.eyebrow')}</p>
                <h2 className="mt-2 text-2xl font-bold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '-0.025em' }}>
                  {t('plans.title')}
                </h2>
              </FadeIn>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(plans.data ?? []).slice(0, 3).map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                  <p className="font-bold text-[var(--color-ink)]">{plan.name}</p>
                  <p className="mt-1 text-2xl font-black text-[var(--color-brand)]">
                    ${plan.price}<span className="text-sm font-semibold text-[var(--color-muted)]">/mo</span>
                  </p>
                  {plan.description && <p className="mt-2 text-xs text-[var(--color-muted)]">{plan.description}</p>}
                  <Link href="/planos" locale={locale} className="mt-4 block w-full rounded-full bg-[var(--color-brand)] py-2.5 text-center text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[var(--color-brand-dark)] transition-colors">
                    {t('plans.cta')}
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/planos" locale={locale} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)] hover:underline">
                {t('plans.viewAll')} â†’
              </Link>
            </div>
          </>
        )}
      </section>

      {/* â”€â”€ Live schedule â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {(dayEntries.length > 0 || classes.isLoading) && (
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
          <FadeIn variant="up" className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">{t('classes.eyebrow')}</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--color-ink)] sm:text-4xl" style={{ fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '-0.025em' }}>
              {t('classes.title')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted)]">{t('classes.subtitle')}</p>
          </FadeIn>

          {classes.isLoading && (
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--color-paper-2)]" />)}
            </div>
          )}

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {dayEntries.map(([day, dayClasses], i) => (
              <FadeIn key={day} variant={i % 2 === 0 ? 'left' : 'right'} delay={((i % 2) + 1) as 1 | 2}>
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className="flex w-full items-center justify-between text-left"
                    aria-expanded={isDayOpen(day)}
                  >
                    <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--color-brand)]">
                      {weekdayLabel[day] ?? day}
                    </h3>
                    <span className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
                      {dayClasses.length}
                      <svg className={`h-4 w-4 transition-transform ${isDayOpen(day) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                  {isDayOpen(day) && (
                    <div className="mt-4 space-y-3">
                      {dayClasses.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-paper)] p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="4" r="2" /><path d="M12 7v6M9 13l-2 5M15 13l2 5M9 13h6" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-bold text-[var(--color-ink)]">{item.title}</p>
                            {(() => {
                              const img = getClassImage(item.title);
                              return img ? null : null;
                            })()}
                            <p className="truncate text-xs text-[var(--color-muted)]">{item.instructor}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-semibold text-[var(--color-ink)]">{item.startTime}</p>
                            <p className="text-xs text-[var(--color-muted)]">{item.durationMin} min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn variant="up" delay={3} className="mt-8 text-center">
            <Link href="/aulas" locale={locale} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)] hover:underline">
              {t('classes.viewAll')} â†’
            </Link>
          </FadeIn>
        </section>
      )}

      {/* â”€â”€ Footer CTA Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
        <FadeIn variant="scale">
          <div className="relative overflow-hidden rounded-3xl bg-[var(--color-ink)] p-10 text-center sm:p-14">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[var(--color-brand)]/20 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-[var(--color-brand)]/15 blur-2xl" />
            <p className="relative text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">{t('cta.eyebrow')}</p>
            <h2 className="relative mt-3 text-4xl font-bold text-white sm:text-5xl" style={{ fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '-0.025em' }}>
              {t('cta.title')}
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-base text-white/70">{t('cta.subtitle')}</p>
            <div className="relative mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/cadastro" locale={locale} className="rounded-full bg-[var(--color-brand)] px-10 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-[var(--color-brand)]/30 hover:bg-[var(--color-brand-dark)] transition-all hover:scale-[1.02]">
                {t('cta.btn')}
              </Link>
              <Link href="/contato" locale={locale} className="rounded-full border border-white/30 px-10 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-white/10 transition-colors">
                {t('cta.btnSecondary')}
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}

