import { GET } from '../route';
import { classSessionsService } from '@/modules/classes/services/class-sessions.service';

jest.mock('@/modules/classes/services/class-sessions.service', () => ({
  classSessionsService: {
    listUpcoming: jest.fn(),
  },
}));

const listUpcomingMock = classSessionsService.listUpcoming as jest.Mock;

describe('GET /api/v1/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns upcoming sessions with defaults', async () => {
    listUpcomingMock.mockResolvedValue([{ id: 'session-1' }]);

    const req = { nextUrl: new URL('http://localhost/api/v1/sessions') };
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listUpcomingMock).toHaveBeenCalledWith(undefined, 30);
    expect(body.data).toEqual({ data: [{ id: 'session-1' }] });
  });

  it('returns 400 when classId query is invalid', async () => {
    const req = { nextUrl: new URL('http://localhost/api/v1/sessions?classId=invalid') };
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation failed');
  });

  it('returns filtered sessions for valid classId and limit', async () => {
    listUpcomingMock.mockResolvedValue([{ id: 'session-2' }]);

    const req = {
      nextUrl: new URL(
        'http://localhost/api/v1/sessions?classId=11111111-1111-4111-8111-111111111111&limit=5',
      ),
    };
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listUpcomingMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', 5);
    expect(body.data).toEqual({ data: [{ id: 'session-2' }] });
  });
});
