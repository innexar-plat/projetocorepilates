import { GET } from '../route';
import { classesService } from '@/modules/classes/services/classes.service';

jest.mock('@/modules/classes/services/classes.service', () => ({
  classesService: {
    listAll: jest.fn(),
  },
}));

const listAllMock = classesService.listAll as jest.Mock;

describe('GET /api/v1/classes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns active classes by default', async () => {
    listAllMock.mockResolvedValue([{ id: 'class-1' }]);

    const req = { nextUrl: new URL('http://localhost/api/v1/classes') };
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listAllMock).toHaveBeenCalledWith(true);
    expect(body.data).toEqual([{ id: 'class-1' }]);
  });

  it('returns all classes when all=true', async () => {
    listAllMock.mockResolvedValue([{ id: 'class-1' }, { id: 'class-2' }]);

    const req = { nextUrl: new URL('http://localhost/api/v1/classes?all=true') };
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listAllMock).toHaveBeenCalledWith(false);
    expect(body.data).toEqual([{ id: 'class-1' }, { id: 'class-2' }]);
  });
});
