import { websiteService } from '@/services/website.service';

describe('websiteService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch plans from real API path', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { data: [{ id: 'p1', name: 'Starter', price: 99, classesPerMonth: 4 }] } }), { status: 200 })
    );

    const data = await websiteService.listPlans();

    expect(data[0].id).toBe('p1');
    expect(fetchSpy).toHaveBeenCalledWith('/api/v1/plans', expect.any(Object));
  });

  it('should post lead using backend endpoint', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 'lead_1' } }), { status: 201 })
    );

    const lead = await websiteService.createLead({
      name: 'Ana',
      email: 'ana@example.com',
      source: 'website',
    });

    expect(lead.id).toBe('lead_1');
    expect(fetchSpy).toHaveBeenCalledWith('/api/v1/leads', expect.objectContaining({ method: 'POST' }));
  });
});
