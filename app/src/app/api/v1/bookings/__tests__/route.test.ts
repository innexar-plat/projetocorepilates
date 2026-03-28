import { GET, POST } from '../route';
import { auth } from '@/lib/auth';
import { bookingsService } from '@/modules/bookings/services/bookings.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/bookings/services/bookings.service', () => ({
  bookingsService: {
    listByUser: jest.fn(),
    book: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const listByUserMock = bookingsService.listByUser as jest.Mock;
const bookMock = bookingsService.book as jest.Mock;

describe('GET /api/v1/bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null as any);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns authenticated user bookings', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } } as any);
    listByUserMock.mockResolvedValue([{ id: 'b-1' }] as any);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ data: [{ id: 'b-1' }] });
    expect(listByUserMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });
});

describe('POST /api/v1/bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null as any);

    const req = new Request('http://localhost/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify({ classSessionId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when payload is invalid', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } } as any);

    const req = new Request('http://localhost/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify({ classSessionId: 'not-a-uuid' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation failed');
  });

  it('returns 201 when booking is created', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } } as any);
    bookMock.mockResolvedValue({ id: 'booking-1', status: 'CONFIRMED' } as any);

    const req = new Request('http://localhost/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify({ classSessionId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data).toEqual({ data: { id: 'booking-1', status: 'CONFIRMED' } });
    expect(bookMock).toHaveBeenCalledWith({
      userId: '11111111-1111-4111-8111-111111111111',
      classSessionId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
    });
  });
});
