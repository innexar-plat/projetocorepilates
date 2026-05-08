import { NextRequest } from 'next/server';
import { GET } from '../route';
import { galleryService } from '@/modules/gallery/services/gallery.service';

jest.mock('@/modules/gallery/services/gallery.service', () => ({
  galleryService: {
    listAll: jest.fn(),
    listAlbums: jest.fn(),
  },
}));

const listAllMock = galleryService.listAll as jest.Mock;
const listAlbumsMock = galleryService.listAlbums as jest.Mock;

describe('GET /api/v1/gallery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes album filter to service when query is provided', async () => {
    listAllMock.mockResolvedValue([
      {
        id: 'img-1',
        album: 'Pilates Studio',
        order: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    listAlbumsMock.mockResolvedValue([
      { id: 'a-1', name: 'Pilates Studio', order: 1, isActive: true },
    ]);

    const req = new NextRequest('http://localhost/api/v1/gallery?album=Pilates%20Studio');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listAllMock).toHaveBeenCalledWith(true, 'Pilates Studio');
    expect(body.data).toEqual([
      {
        id: 'img-1',
        album: 'Pilates Studio',
        order: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('returns empty list when requested album is inactive', async () => {
    listAllMock.mockResolvedValue([
      {
        id: 'img-1',
        album: 'Legacy Album',
        order: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    listAlbumsMock.mockResolvedValue([
      { id: 'a-1', name: 'Legacy Album', order: 1, isActive: false },
    ]);

    const req = new NextRequest('http://localhost/api/v1/gallery?album=Legacy%20Album');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });
});
