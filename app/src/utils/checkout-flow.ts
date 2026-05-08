export type CheckoutPlan = {
  id: string;
  name: string;
  price: number | string;
  classesPerMonth: number;
  description: string | null;
};

export type CheckoutSession = {
  id: string;
  date: string;
  class: {
    id?: string;
    title: string;
    instructor: string;
    startTime: string;
    maxCapacity: number;
    durationMin?: number;
  };
  bookedCount?: number;
  availableSlots?: number;
  isAvailable?: boolean;
  _count?: {
    bookings?: number;
  };
};

export type NormalizedCheckoutSession = CheckoutSession & {
  bookedCount: number;
  availableSlots: number;
  isAvailable: boolean;
};

export type CheckoutTurmaGroup = {
  key: string;
  title: string;
  instructor: string;
  startTime: string;
  timeLabel: string;
  durationMin: number;
  maxCapacity: number;
  daysLabel: string;
  nextSessionId: string;
  nextSessionDate: string;
  nextSessionLabel: string;
  nextAvailableSlots: number;
  totalSessions: number;
  sessions: NormalizedCheckoutSession[];
};

type CheckoutContext = {
  plan: CheckoutPlan;
  sessions: CheckoutSession[];
};

const LOCALE_DAY_LABELS: Record<string, string[]> = {
  pt: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
  es: ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const MONDAY_FIRST_ORDER = [1, 2, 3, 4, 5, 6, 0];

function parseCheckoutDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`);
  }

  return new Date(value);
}

function unwrapData<T>(payload: unknown): T {
  const data = payload as { data?: { data?: T } | T };
  if (data?.data && typeof data.data === 'object' && 'data' in data.data) {
    return (data.data as { data: T }).data;
  }

  return data?.data as T;
}

function getLocalePrefix(locale: string) {
  return locale.split('-')[0] ?? 'en';
}

function getDayLabel(dayIndex: number, locale: string) {
  const prefix = getLocalePrefix(locale);
  const labels = LOCALE_DAY_LABELS[prefix] ?? LOCALE_DAY_LABELS.en;

  return labels[dayIndex] ?? LOCALE_DAY_LABELS.en[dayIndex];
}

export function normalizeCheckoutSessions(sessions: CheckoutSession[]) {
  return sessions
    .map<NormalizedCheckoutSession>((session) => {
      const bookedCount = session.bookedCount ?? session._count?.bookings ?? 0;
      const availableSlots = session.availableSlots ?? Math.max(session.class.maxCapacity - bookedCount, 0);

      return {
        ...session,
        bookedCount,
        availableSlots,
        isAvailable: session.isAvailable ?? availableSlots > 0,
      };
    })
    .filter((session) => session.isAvailable)
    .sort((left, right) => parseCheckoutDate(left.date).getTime() - parseCheckoutDate(right.date).getTime());
}

export function formatCheckoutTime(startTime: string, locale: string) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date(Date.UTC(2026, 0, 1, hours, minutes));

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

export function formatRecurringDays(dates: string[], locale: string) {
  const uniqueDays = Array.from(
    new Set(dates.map((date) => parseCheckoutDate(date).getDay())),
  ).sort((left, right) => MONDAY_FIRST_ORDER.indexOf(left) - MONDAY_FIRST_ORDER.indexOf(right));

  return uniqueDays.map((dayIndex) => getDayLabel(dayIndex, locale)).join(', ');
}

export function buildTurmaGroups(sessions: CheckoutSession[], locale: string): CheckoutTurmaGroup[] {
  const normalizedSessions = normalizeCheckoutSessions(sessions);
  const groups = new Map<string, NormalizedCheckoutSession[]>();

  for (const session of normalizedSessions) {
    const key = [session.class.title, session.class.instructor, session.class.startTime].join('::');
    const list = groups.get(key) ?? [];

    list.push(session);
    groups.set(key, list);
  }

  return Array.from(groups.entries())
    .map(([key, groupedSessions]) => {
      const [nextSession] = groupedSessions;

      return {
        key,
        title: nextSession.class.title,
        instructor: nextSession.class.instructor,
        startTime: nextSession.class.startTime,
        timeLabel: formatCheckoutTime(nextSession.class.startTime, locale),
        durationMin: nextSession.class.durationMin ?? 60,
        maxCapacity: nextSession.class.maxCapacity,
        daysLabel: formatRecurringDays(groupedSessions.map((session) => session.date), locale),
        nextSessionId: nextSession.id,
        nextSessionDate: nextSession.date,
        nextSessionLabel: new Intl.DateTimeFormat(locale, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).format(parseCheckoutDate(nextSession.date)),
        nextAvailableSlots: nextSession.availableSlots,
        totalSessions: groupedSessions.length,
        sessions: groupedSessions,
      };
    })
    .sort((left, right) => new Date(left.nextSessionDate).getTime() - new Date(right.nextSessionDate).getTime());
}

export function buildCheckoutQuery(params: { plan: string; session?: string }) {
  const searchParams = new URLSearchParams({ plan: params.plan });

  if (params.session) {
    searchParams.set('session', params.session);
  }

  return searchParams.toString();
}

export async function fetchCheckoutContext(planId: string): Promise<CheckoutContext> {
  const [planResponse, sessionsResponse] = await Promise.all([
    fetch(`/api/v1/plans/${planId}`, { credentials: 'include', cache: 'no-store' }),
    fetch('/api/v1/sessions?limit=50', { credentials: 'include', cache: 'no-store' }),
  ]);

  if (!planResponse.ok) {
    const payload = await planResponse.json().catch(() => ({}));
    throw new Error((payload as { message?: string })?.message ?? 'Unable to load selected plan');
  }

  if (!sessionsResponse.ok) {
    const payload = await sessionsResponse.json().catch(() => ({}));
    throw new Error((payload as { message?: string })?.message ?? 'Unable to load available classes');
  }

  const planPayload = await planResponse.json();
  const sessionsPayload = await sessionsResponse.json();

  return {
    plan: unwrapData<CheckoutPlan>(planPayload),
    sessions: unwrapData<CheckoutSession[]>(sessionsPayload) ?? [],
  };
}