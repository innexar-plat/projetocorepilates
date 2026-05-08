import { POST } from '../route';
import { auth } from '@/lib/auth';
import { classesService } from '@/modules/classes/services/classes.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/classes/services/classes.service', () => ({
  classesService: {
    create: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const createMock = classesService.create as jest.Mock;

describe('POST /api/v1/admin/classes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'CLIENT' } });

    const req = new Request('http://localhost/api/v1/admin/classes', {
      method: 'POST',
      body: JSON.stringify({ title: 'Mat Pilates' }),
    });

    const res = await POST(req as any);

    expect(res.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });

    const req = new Request('http://localhost/api/v1/admin/classes', {
      method: 'POST',
      body: '{"title": "broken"',
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Invalid JSON body');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('creates class and returns 201 for valid payload', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    createMock.mockResolvedValue({ id: 'class-1', title: 'Mat Pilates' });

    const req = new Request('http://localhost/api/v1/admin/classes', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Mat Pilates',
        instructor: 'Ana',
        dayOfWeek: 'MONDAY',
        startTime: '07:00',
      }),
    });

    const res = await POST(req as any);

    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith({
      title: 'Mat Pilates',
      instructor: 'Ana',
      dayOfWeek: 'MONDAY',
      startTime: '07:00',
      maxCapacity: 10,
      durationMin: 60,
      isActive: true,
    });
  });
});
