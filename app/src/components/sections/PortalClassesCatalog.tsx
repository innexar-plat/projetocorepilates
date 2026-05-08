'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { useResource } from '@/hooks/use-resource';
import { portalService } from '@/services/portal.service';
import { buildTurmaGroups } from '@/utils/checkout-flow';
import { deriveEnrolledClassId, toCheckoutSessions } from '@/utils/portal-classes';

type Feedback = {
  kind: 'success' | 'error';
  message: string;
};

export function PortalClassesCatalog() {
  const t = useTranslations('portal.classes');
  const locale = useLocale() as Locale;

  const bookings = useResource(() => portalService.getBookings(), []);
  const sessions = useResource(() => portalService.getUpcomingSessions(80), []);

  const [showChangeOptions, setShowChangeOptions] = useState(false);
  const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const turmaGroups = useMemo(
    () => buildTurmaGroups(toCheckoutSessions(sessions.data ?? []), locale),
    [locale, sessions.data],
  );

  const enrolledClassId = useMemo(
    () => deriveEnrolledClassId(bookings.data ?? []),
    [bookings.data],
  );

  const enrolledTurmaGroups = useMemo(() => {
    if (!enrolledClassId) return [];

    return turmaGroups.filter((group) => group.sessions.some((session) => session.class.id === enrolledClassId));
  }, [enrolledClassId, turmaGroups]);

  const visibleTurmaGroups = showChangeOptions
    ? turmaGroups.filter((group) => group.nextAvailableSlots > 0)
    : enrolledTurmaGroups;

  const activeTurmaName = enrolledTurmaGroups[0]?.title ?? null;

  async function handleBook(sessionId: string, fromChangeFlow: boolean) {
    setBookingSessionId(sessionId);
    setFeedback(null);

    try {
      await portalService.bookClass(sessionId);
      await Promise.all([bookings.refresh(), sessions.refresh()]);
      setFeedback({ kind: 'success', message: t('bookingSuccess') });

      if (fromChangeFlow) {
        setShowChangeOptions(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('bookingError');
      setFeedback({ kind: 'error', message });
    } finally {
      setBookingSessionId(null);
    }
  }

  return (
    <div className="premium-bg w-full rounded-3xl p-4 sm:p-5">
      <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-white/75 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{t('myTurmaLabel')}</p>
        <p className="mt-1 text-lg font-bold text-[var(--color-ink)]">{activeTurmaName ?? t('noTurmaAssigned')}</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {showChangeOptions ? t('changeModeHint') : t('defaultModeHint')}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {!showChangeOptions ? (
            <button
              type="button"
              onClick={() => setShowChangeOptions(true)}
              className="rounded-xl border border-[var(--color-brand)]/40 px-4 py-2 text-sm font-semibold text-[var(--color-brand)] transition-colors hover:bg-[var(--color-brand)] hover:text-white"
            >
              {t('changeTurma')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowChangeOptions(false);
                setFeedback(null);
              }}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper)]"
            >
              {t('backToMyTurma')}
            </button>
          )}
        </div>
      </div>

      {feedback ? (
        <p
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            feedback.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      {bookings.isLoading || sessions.isLoading ? (
        <p className="rounded-xl border border-[var(--color-border)] bg-white/70 px-4 py-3 text-sm text-[var(--color-muted)]">
          {t('loading')}
        </p>
      ) : null}

      {bookings.error || sessions.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bookings.error ?? sessions.error}
        </p>
      ) : null}

      {!bookings.isLoading && !sessions.isLoading && !bookings.error && !sessions.error ? (
        <>
          {visibleTurmaGroups.length === 0 ? (
            <p className="rounded-xl border border-[var(--color-border)] bg-white/70 px-4 py-3 text-sm text-[var(--color-muted)]">
              {showChangeOptions ? t('noAvailableTurmas') : t('noMyTurmaSessions')}
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleTurmaGroups.map((group) => {
                const isBooking = bookingSessionId === group.nextSessionId;

                return (
                  <article
                    key={group.key}
                    className="rounded-2xl border border-[var(--color-border)] bg-white/80 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
                          {showChangeOptions ? t('availableTurmaLabel') : t('myTurmaCardLabel')}
                        </p>
                        <h3 className="mt-1 text-xl font-black text-[var(--color-ink)]">{group.title}</h3>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">{group.instructor}</p>
                      </div>
                      <span className="rounded-full bg-[var(--color-brand)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
                        {t('duration', { count: group.durationMin })}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{t('days')}</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{group.daysLabel}</p>
                      </div>
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{t('time')}</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{group.timeLabel}</p>
                      </div>
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{t('nextClass')}</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{group.nextSessionLabel}</p>
                      </div>
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{t('slots')}</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                          {t('slotCount', { count: group.nextAvailableSlots, total: group.maxCapacity })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4">
                      <p className="text-xs text-[var(--color-muted)]">{t('upcomingCount', { count: group.totalSessions })}</p>
                      <button
                        type="button"
                        onClick={() => handleBook(group.nextSessionId, showChangeOptions)}
                        disabled={isBooking || group.nextAvailableSlots <= 0}
                        className="rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--color-brand)]/25 transition-colors hover:bg-[var(--color-brand-dark)] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isBooking
                          ? t('booking')
                          : showChangeOptions
                            ? t('selectTurma')
                            : t('bookMyTurma')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
