import { deriveEnrolledClassId, toCheckoutSessions } from '../portal-classes';

describe('portal-classes utils', () => {
  it('prioritizes active booking statuses when deriving enrolled class', () => {
    const classId = deriveEnrolledClassId([
      {
        id: 'b1',
        status: 'CANCELED',
        classSessionId: 's1',
        createdAt: '2026-04-05T10:00:00.000Z',
        classSession: { id: 's1', date: '2026-04-10', class: { id: 'class-canceled', title: '', instructor: '', startTime: '', maxCapacity: 10, durationMin: 60 } },
      },
      {
        id: 'b2',
        status: 'CONFIRMED',
        classSessionId: 's2',
        createdAt: '2026-04-04T10:00:00.000Z',
        classSession: { id: 's2', date: '2026-04-11', class: { id: 'class-confirmed', title: '', instructor: '', startTime: '', maxCapacity: 10, durationMin: 60 } },
      },
    ]);

    expect(classId).toBe('class-confirmed');
  });

  it('maps portal sessions to checkout sessions shape', () => {
    const mapped = toCheckoutSessions([
      {
        id: 'session-1',
        date: '2026-04-20',
        class: {
          id: 'class-1',
          title: 'Turma Core',
          instructor: 'Ana Lima',
          startTime: '08:00',
          maxCapacity: 10,
          durationMin: 60,
        },
        bookedCount: 4,
        availableSlots: 6,
        isAvailable: true,
      },
    ]);

    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({
      id: 'session-1',
      class: { id: 'class-1', title: 'Turma Core' },
      bookedCount: 4,
      availableSlots: 6,
      isAvailable: true,
    });
  });
});
