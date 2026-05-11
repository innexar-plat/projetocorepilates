'use client';

import { useState } from 'react';
import { FadeIn } from '@/components/atoms/FadeIn';
import { useResource } from '@/hooks/use-resource';
import { websiteService } from '@/services/website.service';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/utils/cn';
import Image from 'next/image';

const DAY_COLORS: Record<string, string> = {
  MONDAY:    'from-violet-500/15 to-violet-500/5 border-violet-200',
  TUESDAY:   'from-sky-500/15 to-sky-500/5 border-sky-200',
  WEDNESDAY: 'from-emerald-500/15 to-emerald-500/5 border-emerald-200',
  THURSDAY:  'from-amber-500/15 to-amber-500/5 border-amber-200',
  FRIDAY:    'from-rose-500/15 to-rose-500/5 border-rose-200',
  SATURDAY:  'from-orange-500/15 to-orange-500/5 border-orange-200',
  SUNDAY:    'from-pink-500/15 to-pink-500/5 border-pink-200',
};

const DAY_DOT: Record<string, string> = {
  MONDAY:    'bg-violet-400',
  TUESDAY:   'bg-sky-400',
  WEDNESDAY: 'bg-emerald-400',
  THURSDAY:  'bg-amber-400',
  FRIDAY:    'bg-rose-400',
  SATURDAY:  'bg-orange-400',
  SUNDAY:    'bg-pink-400',
};

const DAY_LABEL: Record<string, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
};

const DAY_LABEL_LOCALE: Record<Locale, Record<string, string>> = {
  en: DAY_LABEL,
  pt: {
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
  },
  es: {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miércoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
  },
};

const DAY_ORDER: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
};

const DAY_IMAGE: Record<string, string> = {
  MONDAY: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=1200&q=80',
  TUESDAY: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80',
  WEDNESDAY: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1200&q=80',
  THURSDAY: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&w=1200&q=80',
  FRIDAY: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80',
  SATURDAY: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=1200&q=80',
  SUNDAY: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
};

function ClassCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-6">
      <div className="flex items-start justify-between">
        <div className="h-6 w-32 rounded-lg bg-[var(--color-paper-2)]" />
        <div className="h-6 w-16 rounded-full bg-[var(--color-paper-2)]" />
      </div>
      <div className="mt-3 h-4 w-24 rounded bg-[var(--color-paper-2)]" />
      <div className="mt-4 h-3 w-full rounded bg-[var(--color-paper-2)]" />
      <div className="mt-2 h-3 w-3/4 rounded bg-[var(--color-paper-2)]" />
      <div className="mt-6 h-9 w-full rounded-xl bg-[var(--color-paper-2)]" />
    </div>
  );
}

export function ClassesCatalog() {
  const t = useTranslations('home.classes');
  const locale = useLocale() as Locale;
  const classes = useResource(() => websiteService.listClasses());
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const items = classes.data ?? [];
  const isEmpty = !classes.isLoading && items.length === 0;
  const dayLabels = DAY_LABEL_LOCALE[locale] ?? DAY_LABEL;

  const sortedItems = [...items].sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99);
    if (dayDiff !== 0) return dayDiff;

    const timeDiff = a.startTime.localeCompare(b.startTime);
    if (timeDiff !== 0) return timeDiff;

    return a.title.localeCompare(b.title);
  });

  const groupedByDay = sortedItems.reduce<Record<string, typeof sortedItems>>((acc, item) => {
    if (!acc[item.dayOfWeek]) acc[item.dayOfWeek] = [];
    acc[item.dayOfWeek].push(item);
    return acc;
  }, {});

  const dayEntries = Object.entries(groupedByDay).sort(
    ([a], [b]) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99),
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
    <div className="premium-bg w-full rounded-3xl p-3 sm:p-5">
      {classes.isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <ClassCardSkeleton key={i} />)}
        </div>
      )}

      {!classes.isLoading && (
        <>
          {isEmpty && (
            <p className="mb-6 text-center text-sm text-[var(--color-muted)]">
              {locale === 'pt'
                ? 'Nenhuma aula ativa encontrada no momento. Fale com nossa equipe para detalhes.'
                : locale === 'es'
                  ? 'No se encontraron clases activas por ahora. Habla con nuestro equipo para más detalles.'
                  : 'No active classes found right now. Contact our team for details.'}
            </p>
          )}
          <div className="space-y-6">
            {dayEntries.map(([day, dayItems], dayIndex) => (
              <FadeIn key={day} variant="up" delay={((dayIndex % 3) + 1) as 1 | 2 | 3}>
                <section className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className="mb-4 flex w-full items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 text-left"
                    aria-expanded={isDayOpen(day)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', DAY_DOT[day] ?? 'bg-[var(--color-brand)]')} />
                      <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--color-ink)]">
                        {dayLabels[day] ?? day}
                      </h3>
                    </div>
                    <span className="flex items-center gap-2 rounded-full bg-[var(--color-paper)] px-2.5 py-1 text-xs font-semibold text-[var(--color-muted)]">
                      {dayItems.length}
                      <svg
                        className={cn('h-4 w-4 transition-transform', isDayOpen(day) ? 'rotate-180' : '')}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>

                  {isDayOpen(day) && (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {dayItems.map((item) => {
                      const gradientClass = DAY_COLORS[item.dayOfWeek] ?? 'from-[var(--color-brand)]/10 to-[var(--color-brand)]/5 border-[var(--color-brand)]/20';
                      const dotClass = DAY_DOT[item.dayOfWeek] ?? 'bg-[var(--color-brand)]';
                      const dayImage =
                        (typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0
                          ? item.imageUrl.trim()
                          : DAY_IMAGE[item.dayOfWeek]) ?? DAY_IMAGE.MONDAY;
                      const initials = item.instructor.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase();

                      return (
                        <div key={item.id} className={cn(
                          'glass-card group relative flex h-full flex-col overflow-hidden rounded-2xl p-0',
                          'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
                          gradientClass,
                        )}>
                          <div className="relative h-28">
                            <Image
                              src={dayImage}
                              alt={item.title}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                          </div>
                          <div className="p-6">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={cn('h-2 w-2 rounded-full', dotClass)} />
                                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                                    {dayLabels[item.dayOfWeek] ?? item.dayOfWeek}
                                  </span>
                                </div>
                                <h3 className="mt-1 text-lg font-black text-[var(--color-ink)] leading-snug">
                                  {item.title}
                                </h3>
                              </div>
                              <span className="shrink-0 rounded-full bg-white/70 px-3 py-0.5 text-xs font-bold text-[var(--color-ink)] shadow-sm">
                                {item.durationMin} min
                              </span>
                            </div>

                            {(() => {
                              const desc = 'description' in item ? (item.description as string | undefined) : undefined;
                              return desc ? (
                                <p className="mt-3 text-sm text-[var(--color-muted)] leading-relaxed line-clamp-2 flex-1">
                                  {desc}
                                </p>
                              ) : <div className="flex-1" />;
                            })()}

                            <div className="mt-4 flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]/20 text-[0.6rem] font-black text-[var(--color-brand)]">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-[var(--color-ink)]">{item.instructor}</p>
                                <p className="text-xs text-[var(--color-muted)]">
                                  {item.startTime}
                                  {' · '}
                                  {t('capacity', { count: item.maxCapacity })}
                                </p>
                              </div>
                            </div>

                            <Link
                              href="/contato"
                              locale={locale}
                              className="mt-5 block w-full rounded-xl border border-[var(--color-brand)]/40 py-2 text-center text-sm font-semibold text-[var(--color-brand)] transition-all duration-200 hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)] hover:shadow-md"
                            >
                              {t('enroll')}
                            </Link>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  )}
                </section>
              </FadeIn>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
