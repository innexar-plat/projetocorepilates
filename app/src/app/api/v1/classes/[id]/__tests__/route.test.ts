import { GET } from '../route';
import { classesService } from '@/modules/classes/services/classes.service';
import { NotFoundError } from '@/lib/errors';

jest.mock('@/modules/classes/services/classes.service', () => ({
  classesService: {
    getById: jest.fn(),
  },
}));

const getByIdMock = classesService.getById as jest.Mock;

describe('GET /api/v1/classes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns class details by id', async () => {
    getByIdMock.mockResolvedValue({ id: 'class-1', title: 'Pilates Reformer' });

    const req = new Request('http://localhost/api/v1/classes/class-1');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'class-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getByIdMock).toHaveBeenCalledWith('class-1');
    expect(body.data).toEqual({ data: { id: 'class-1', title: 'Pilates Reformer' } });
  });

  it('returns 404 when class is not found', async () => {
    getByIdMock.mockRejectedValue(new NotFoundError('Class not found'));

    const req = new Request('http://localhost/api/v1/classes/missing');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'missing' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not Found');
  });
});
