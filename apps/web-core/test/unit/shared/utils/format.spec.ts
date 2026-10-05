import { formatDate } from '@/shared/utils/format';

describe('formatDate', () => {
  it('formats in Spanish using the Bogotá time zone', () => {
    expect(formatDate('2026-02-01T09:00:00.000Z')).toBe('1/02/2026');
    expect(formatDate('2026-01-01T00:00:00.000Z')).toBe('31/12/2025');
  });
});
