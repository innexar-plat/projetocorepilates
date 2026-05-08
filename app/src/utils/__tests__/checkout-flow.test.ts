import { buildTurmaGroups, formatCheckoutTime, formatRecurringDays, normalizeCheckoutSessions } from '@/utils/checkout-flow';

describe('checkout-flow utilities', () => {
  it('should normalize availability when sessions omit derived fields', () => {
    const sessions = normalizeCheckoutSessions([
      {
        id: 'session-1',
        date: '2026-04-06',
        class: {
          title: 'Turma X',
          instructor: 'Ana',
          startTime: '09:00',
          maxCapacity: 8,
        },
        _count: { bookings: 3 },
      },
    ]);

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.availableSlots).toBe(5);
  });

  it('should format recurring days in monday-first order', () => {
    const label = formatRecurringDays(['2026-04-10', '2026-04-06', '2026-04-07'], 'en');

    expect(label).toBe('Mon, Tue, Fri');
  });

  it('should group sessions by turma identity and pick the next available session', () => {
    const groups = buildTurmaGroups(
      [
        {
          id: 'session-2',
          date: '2026-04-07',
          class: {
            title: 'Turma X',
            instructor: 'Ana',
            startTime: '09:00',
            maxCapacity: 8,
            durationMin: 60,
          },
          availableSlots: 4,
          isAvailable: true,
        },
        {
          id: 'session-1',
          date: '2026-04-06',
          class: {
            title: 'Turma X',
            instructor: 'Ana',
            startTime: '09:00',
            maxCapacity: 8,
            durationMin: 60,
          },
          availableSlots: 5,
          isAvailable: true,
        },
        {
          id: 'session-3',
          date: '2026-04-10',
          class: {
            title: 'Turma X',
            instructor: 'Ana',
            startTime: '09:00',
            maxCapacity: 8,
            durationMin: 60,
          },
          availableSlots: 2,
          isAvailable: true,
        },
      ],
      'en',
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.nextSessionId).toBe('session-1');
    expect(groups[0]?.daysLabel).toBe('Mon, Tue, Fri');
    expect(groups[0]?.totalSessions).toBe(3);
  });

  it('should format time using locale rules', () => {
    expect(formatCheckoutTime('09:00', 'en')).toBe('9:00 AM');
  });
});