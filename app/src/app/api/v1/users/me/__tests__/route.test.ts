import { GET, PATCH } from '../route';
import { auth } from '@/lib/auth';
import { usersService } from '@/modules/users/services/users.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/users/services/users.service', () => ({
  usersService: {
    getById: jest.fn(),
    update: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const getByIdMock = usersService.getById as jest.Mock;
const updateMock = usersService.update as jest.Mock;

describe('GET /api/v1/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/users/me');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('Authentication required');
  });

  it('returns authenticated user profile', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getByIdMock.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Ana Silva',
      email: 'ana@example.com',
      phone: null,
      avatarUrl: null,
      role: 'CLIENT',
      createdAt: new Date('2026-03-28T00:00:00.000Z'),
      updatedAt: new Date('2026-03-28T00:00:00.000Z'),
    });

    const req = new Request('http://localhost/api/v1/users/me');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'ana@example.com',
      role: 'CLIENT',
    });
  });
});

describe('PATCH /api/v1/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Ana Silva' }),
    });

    const res = await PATCH(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when payload is invalid', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });

    const req = new Request('http://localhost/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl: 'invalid-url' }),
    });

    const res = await PATCH(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation failed');
    expect(Array.isArray(body.details)).toBe(true);
  });

  it('updates profile and returns 200', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    updateMock.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Ana Souza',
      email: 'ana@example.com',
      phone: '+5511999999999',
      avatarUrl: null,
      updatedAt: new Date('2026-03-28T01:00:00.000Z'),
    });

    const req = new Request('http://localhost/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Ana Souza', phone: '+5511999999999' }),
    });

    const res = await PATCH(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Ana Souza',
      phone: '+5511999999999',
    });
    expect(updateMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', {
      name: 'Ana Souza',
      phone: '+5511999999999',
    });
  });
});
