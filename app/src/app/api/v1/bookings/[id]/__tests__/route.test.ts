import { DELETE } from '../route';
import { auth } from '@/lib/auth';
import { bookingsService } from '@/modules/bookings/services/bookings.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/bookings/services/bookings.service', () => ({
  bookingsService: {
    cancel: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const cancelMock = bookingsService.cancel as jest.Mock;

describe('DELETE /api/v1/bookings/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null as any);

    const req = new Request('http://localhost/api/v1/bookings/booking-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'booking-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('cancels booking for authenticated user', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } } as any);
    cancelMock.mockResolvedValue({ id: 'booking-1', status: 'CANCELED' } as any);

    const req = new Request('http://localhost/api/v1/bookings/booking-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'booking-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ data: { id: 'booking-1', status: 'CANCELED' } });
    expect(cancelMock).toHaveBeenCalledWith('booking-1', '11111111-1111-4111-8111-111111111111');
  });
});
