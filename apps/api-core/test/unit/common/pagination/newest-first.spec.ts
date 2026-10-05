import { newestFirst } from '@common/pagination/newest-first';

describe('newestFirst', () => {
  it('orders by creation date descending and breaks ties by id in byte order', () => {
    const sameInstant = new Date('2026-01-01T00:00:00.000Z');
    const items = [
      { id: 'b', createdAt: sameInstant },
      { id: 'c', createdAt: new Date('2025-01-01T00:00:00.000Z') },
      { id: 'a', createdAt: sameInstant },
      { id: 'd', createdAt: new Date('2027-01-01T00:00:00.000Z') },
    ];

    expect([...items].sort(newestFirst).map((item) => item.id)).toEqual(['d', 'a', 'b', 'c']);
  });
});
