import { POST } from '../route';

describe('POST /api/v1/auth/register', () => {
  it('returns 403 because public registration is closed', async () => {
    const req = new Request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Registration Closed');
    expect(body.message).toBe(
      'New account registration is temporarily closed. Please use the pre-registration form instead.',
    );
  });
});
