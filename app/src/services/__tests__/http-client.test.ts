import { httpGet, httpPost } from '@/services/http-client';

describe('http-client', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should unwrap nested data for GET responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { data: [{ id: '1' }] } }), { status: 200 })
    );

    const result = await httpGet<Array<{ id: string }>>('/api/v1/plans');

    expect(result.data).toEqual([{ id: '1' }]);
  });

  it('should throw API message when request fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 })
    );

    await expect(httpGet('/api/v1/admin/users')).rejects.toThrow('Forbidden');
  });

  it('should post payload and unwrap response data', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 'lead_1' } }), { status: 201 })
    );

    const result = await httpPost<{ id: string }, { name: string }>('/api/v1/leads', { name: 'Ana' });

    expect(result).toEqual({ id: 'lead_1' });
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/leads',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
