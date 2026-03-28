import { generateContractContent } from '../entities/contract-template';

describe('contract-template', () => {
  it('uses default studio name when studioName is not provided', () => {
    const content = generateContractContent({
      clientName: 'Ana Paula',
      clientEmail: 'ana@example.com',
      date: '2026-03-28T10:00:00.000Z',
    });

    expect(content).toContain('Core Pilates');
    expect(content).toContain('Ana Paula');
    expect(content).toContain('ana@example.com');
  });

  it('uses provided studio name when studioName exists', () => {
    const content = generateContractContent({
      clientName: 'Carlos Mendes',
      clientEmail: 'carlos@example.com',
      studioName: 'Brazilian Core Pilates',
      date: '2026-03-28T10:00:00.000Z',
    });

    expect(content).toContain('Brazilian Core Pilates');
    expect(content).toContain('Carlos Mendes');
    expect(content).toContain('carlos@example.com');
  });
});
